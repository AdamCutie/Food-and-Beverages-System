import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboard from './components/AdminDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OrderManagement from './components/OrderManangement'   
import MenuManagementTable from './components/MenuManagementTable';
import AddItemModal from './components/AddItemModal';
import AdminHeader from './components/AdminHeader';
import StaffManagementTable from './components/StaffManagementTable';
import StaffModal from './components/StaffModal';
import InventoryLogsTable from './components/InventoryLogsTable';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';



function AdminPage() {

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
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

  // ... (All handler functions are unchanged) ...
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
    setEditingItem(null);
    setIsStaffModalOpen(true);
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setEditingStaff(null);
  };

   const allCategoriesForFilter = ['All', ...new Set(menuItems.map(item => item.category))];
   const filteredMenuItems = menuItems.filter(item => {
  const categoryMatch = menuFilterCategory === 'All' || item.category === menuFilterCategory;
  const searchMatch = item.item_name.toLowerCase().includes(menuSearchTerm.toLowerCase());
  return categoryMatch && searchMatch;
});

   // --- ACCENT COLOR for tabs ---
   const accentColor = '#F9A825'; // From your tailwind.config.js

   return (
    <>
      {/* --- INLINE STYLE FOR BACKGROUND --- */}
      <div style={{ backgroundColor: '#480c1b', minHeight: '100vh' }}>
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 ">
        
          <nav className="flex space-x-4 border-b mb-8" style={{ justifyContent: 'center' }}>
              <button
              onClick={() => setCurrentView('dashboard')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'dashboard' ? accentColor : '#ffffff',
                borderBottom: currentView === 'dashboard' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'analytics' ? accentColor : '#ffffff',
                borderBottom: currentView === 'analytics' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'orders' ? accentColor : '#ffffff',
                borderBottom: currentView === 'orders' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Order Management
            </button>
            <button
              onClick={() => setCurrentView('menu')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'menu' ? accentColor : '#ffffff',
                borderBottom: currentView === 'menu' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Menu Management
            </button>
            <button
              onClick={() => setCurrentView('staff')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'staff' ? accentColor : '#ffffff',
                borderBottom: currentView === 'staff' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Staff Management
            </button>
            <button
              onClick={() => setCurrentView('logs')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'logs' ? accentColor : '#ffffff',
                borderBottom: currentView === 'logs' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Inventory Logs
            </button>
          </nav>

          <main>
            {currentView === 'dashboard' && <AdminDashboard />}
            {currentView === 'analytics' && <AnalyticsDashboard />}
            
            {loading && currentView !== 'analytics' && (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.25rem', color: '#ffffff' }}>
                Loading {currentView} data...
              </div>
            )}
            
            {!loading && error && currentView !== 'analytics' && (
               <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.25rem', color: '#DC2626' }}>
                Error loading data: {error}
               </div>
            )}
            
            {!loading && !error && currentView === 'orders' && <OrderManagement orders={orders} />}
            {!loading && !error && currentView === 'menu' && (
              <MenuManagementTable
                items={filteredMenuItems} 
                totalItems={filteredMenuItems.length} 
                categories={allCategoriesForFilter} 
                selectedCategory={menuFilterCategory}
                searchTerm={menuSearchTerm}
                onSearchChange={setMenuSearchTerm}
                onFilterChange={handleMenuFilterChange}
                onAddItem={openModalForAdd}
                onEditItem={openModalForEdit}
                onDeleteItem={handleDeleteItem}
              />
            )}
            {!loading && !error && currentView === 'staff' && (
              <StaffManagementTable
                staffList={staffList}
                onAddStaff={openStaffModalForAdd}
                onEditStaff={openStaffModalForEdit}
                onDeleteStaff={handleDeleteStaff}
              />
            )}
            {!loading && !error && currentView === 'logs' && <InventoryLogsTable />}
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
      </div>
    </>
  );
}

export default AdminPage;