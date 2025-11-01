import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MenuManagementTable from './components/MenuManagementTable';
import AddItemModal from './components/AddItemModal';
import AdminHeader from './components/AdminHeader';
import StaffManagementTable from './components/StaffManagementTable';
import StaffModal from './components/StaffModal';
import InventoryLogsTable from './components/InventoryLogsTable';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';

const OrderManagementTable = ({ orders }) => (
  <div className="bg-white shadow-md rounded-lg overflow-hidden">
    <h2 className="text-2xl font-bold p-6">Order Management</h2>
    <table className="min-w-full leading-normal">
      <thead>
        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
          <th className="py-3 px-6 text-left">Order ID</th>
          {/* --- 1. HEADER FIX --- */}
          <th className="py-3 px-6 text-left">Customer Name</th>
          <th className="py-3 px-6 text-left">Type</th>
          <th className="py-3 px-6 text-left">Location</th>
          <th className="py-3 px-6 text-center">Total</th>
          <th className="py-3 px-6 text-center">Status</th>
          <th className="py-3 px-6 text-left">Date</th>
        </tr>
      </thead>
      <tbody className="text-gray-600 text-sm font-light">
        {orders.map((order) => (
          <tr key={order.order_id} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-3 px-6 text-left whitespace-nowrap">{order.order_id}</td>
            
            {/* --- 2. DATA CELL FIX --- */}
            {/* Display name, or "Guest" if customer_id was NULL */}
            <td className="py-3 px-6 text-left">
              {order.first_name || order.last_name ? `${order.first_name} ${order.last_name}` : 'Guest'}
            </td>

            <td className="py-3 px-6 text-left">{order.order_type}</td>
            <td className="py-3 px-6 text-left">{order.delivery_location}</td>
            <td className="py-3 px-6 text-center">
              ₱{parseFloat(order.total_amount || 0).toFixed(2)}
            </td>
            <td className="py-3 px-6 text-center">
              <span
                className={`py-1 px-3 rounded-full text-xs font-semibold ${
                  order.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                  order.status === 'Completed' ? 'bg-green-200 text-green-800' :
                  order.status === 'Cancelled' ? 'bg-red-200 text-red-800' :
                  'bg-gray-200 text-gray-800'
                }`}
              >
                {order.status}
              </span>
            </td>
            <td className="py-3 px-6 text-left">{new Date(order.order_date).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function AdminPage() {
  // ... (Rest of the file is unchanged) ...
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('orders'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');

  const { token } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [ordersResponse, itemsResponse, staffResponse, categoriesResponse] = await Promise.all([
          apiClient('/orders'),
          apiClient('/items'),
          apiClient('/admin/staff'),
          apiClient('/categories') 
        ]);
        
        if (!ordersResponse.ok || !itemsResponse.ok || !staffResponse.ok || !categoriesResponse.ok) {
           throw new Error('Failed to fetch data');
        }
        
        const ordersData = await ordersResponse.json();
        const itemsData = await itemsResponse.json();
        const staffData = await staffResponse.json();
        const categoriesData = await categoriesResponse.json(); 

        setOrders(ordersData);
        setMenuItems(itemsData);
        setStaffList(staffData);
        setCategories(categoriesData);
        
      } catch (err) {
        if (err.message !== 'Session expired') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleAddNewItem = async (formData) => {
    const payload = {
      ...formData,
      ingredients: formData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity_consumed: ing.quantity_consumed
      }))
    };
    
    try {
      const response = await apiClient('/admin/items', { 
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || 'Failed to save the item.');
      }
      
      const itemsResponse = await apiClient('/items');
      const itemsData = await itemsResponse.json();
      setMenuItems(itemsData);

      toast.success('Item added successfully!'); 
      closeModal(); 
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

  const handleUpdateItem = async (itemData) => {
    const payload = {
      ...itemData,
      ingredients: itemData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity_consumed: ing.quantity_consumed
      }))
    };
    
    try {
      const response = await apiClient(`/admin/items/${editingItem.item_id}`, { 
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || 'Failed to update item.');
      }
      
      const itemsResponse = await apiClient('/items');
      const itemsData = await itemsResponse.json();
      setMenuItems(itemsData);

      toast.success('Item updated successfully!');
      closeModal();
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteItem = async (itemIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await apiClient(`/admin/items/${itemIdToDelete}`, { 
        method: 'DELETE',
      });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || 'Failed to delete the item.');
      }
      setMenuItems(prevItems => prevItems.filter(item => item.item_id !== itemIdToDelete));
      toast.success('Item deleted successfully!');
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

const openModalForEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  
  const openModalForAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleMenuFilterChange = (category) => {
    setMenuFilterCategory(category);
  };

  const handleClearFilters = () => {
    setMenuFilterCategory('All');
  };

  const handleAddStaff = async (formData) => {
    try {
      const response = await apiClient('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save the staff member.');
      }
      const newStaff = await response.json(); 
      const listResponse = await apiClient('/admin/staff', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedList = await listResponse.json();
      setStaffList(updatedList);
      
      toast.success('Staff member added successfully!');
      closeStaffModal();
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

  const handleUpdateStaff = async (formData) => {
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }

    try {
      const response = await apiClient(`/admin/staff/${editingStaff.staff_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update staff member.');
      }
      
      const listResponse = await apiClient('/admin/staff', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedList = await listResponse.json();
      setStaffList(updatedList);

      toast.success('Staff member updated successfully!');
      closeStaffModal();
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteStaff = async (staffIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;
    try {
      const response = await apiClient(`/admin/staff/${staffIdToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete the staff member.');
      }
      setStaffList(prevList => prevList.filter(staff => staff.staff_id !== staffIdToDelete));
      toast.success('Staff member deleted successfully!');
    } catch (error) {
       if (error.message !== 'Session expired') {
        toast.error(error.message);
      }
    }
  };

  const openStaffModalForEdit = (staff) => {
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };
  
  const openStaffModalForAdd = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setEditingStaff(null);
  };


   if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  
  const allCategoriesForFilter = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredMenuItems = menuItems.filter(item => 
    menuFilterCategory === 'All' || item.category === menuFilterCategory
  );

   return (
    <>
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
      
        <nav className="flex space-x-4 border-b mb-8">
          <button
            onClick={() => setCurrentView('orders')}
            className={`py-2 px-4 text-lg font-semibold transition-colors ${
              currentView === 'orders'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            Order Management
          </button>
          <button
            onClick={() => setCurrentView('menu')}
            className={`py-2 px-4 text-lg font-semibold transition-colors ${
              currentView === 'menu'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            Menu Management
          </button>
          <button
            onClick={() => setCurrentView('staff')}
            className={`py-2 px-4 text-lg font-semibold transition-colors ${
              currentView === 'staff'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            Staff Management
          </button>
          <button
            onClick={() => setCurrentView('logs')}
            className={`py-2 px-4 text-lg font-semibold transition-colors ${
              currentView === 'logs'
                ? 'border-b-2 border-orange-500 text-orange-500'
                : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            Inventory Logs
          </button>

        </nav>

        <main>
          {currentView === 'orders' && <OrderManagementTable orders={orders} />}
          {currentView === 'menu' && (
            <MenuManagementTable
              items={filteredMenuItems} 
              totalItems={filteredMenuItems.length} 
              categories={allCategoriesForFilter} 
              selectedCategory={menuFilterCategory}
              onFilterChange={handleMenuFilterChange}
              onClearFilters={handleClearFilters}
              onAddItem={openModalForAdd}
              onEditItem={openModalForEdit}
              onDeleteItem={handleDeleteItem}
            />
          )}
          {currentView === 'staff' && (
            <StaffManagementTable
              staffList={staffList}
              onAddStaff={openStaffModalForAdd}
              onEditStaff={openStaffModalForEdit}
              onDeleteStaff={handleDeleteStaff}
            />
          )}
          
          {currentView === 'logs' && <InventoryLogsTable />}

        </main>
        
        <AddItemModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={editingItem ? handleUpdateItem : handleAddNewItem}
          itemToEdit={editingItem}
          categories={categories} 
        />

        <StaffModal
          isOpen={isStaffModalOpen}
          onClose={closeStaffModal}
          onSave={editingStaff ? handleUpdateStaff : handleAddStaff}
          staffToEdit={editingStaff}
        />
      </div>
    </>
  );
}

export default AdminPage;