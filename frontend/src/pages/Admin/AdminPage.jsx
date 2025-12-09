import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboard from './components/AdminDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OrderManagement from './components/OrderManangement'   
import MenuManagementTable from './components/MenuManagementTable';
import AddItemModal from './components/AddItemModal';
import AdminHeader from './components/AdminHeader';
import InventoryLogsTable from './components/InventoryLogsTable';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import PromotionsManagement from './components/PromotionsManagement'; 
import TableManagement from './components/TableManagement';
import ReviewsManagement from './components/ReviewsManagement';



function AdminPage() {

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const { token } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersResponse, itemsResponse, categoriesResponse] = await Promise.all([
          apiClient('/orders'),
          apiClient('/items'),
          apiClient('/categories') 
        ]);
        if (!ordersResponse.ok || !itemsResponse.ok || !categoriesResponse.ok) {
           throw new Error('Failed to fetch data');
        }
        const ordersData = await ordersResponse.json();
        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json(); 
        setOrders(ordersData);
        setMenuItems(itemsData);
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
              onClick={() => setCurrentView('tables')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'tables' ? accentColor : '#ffffff',
                borderBottom: currentView === 'tables' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Table Management
            </button>

            <button
            onClick={() => setCurrentView('promotions')}
            style={{
              padding: '8px 16px',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: currentView === 'promotions' ? accentColor : '#ffffff',
              borderBottom: currentView === 'promotions' ? `2px solid ${accentColor}` : '2px solid transparent'
            }}
          >
            Promo Management
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
            <button
              onClick={() => setCurrentView('reviews')}
              style={{
                padding: '8px 16px',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: currentView === 'reviews' ? accentColor : '#ffffff',
                borderBottom: currentView === 'reviews' ? `2px solid ${accentColor}` : '2px solid transparent'
              }}
            >
              Food Reviews
            </button>
          </nav>

          <main>
            {currentView === 'dashboard' && <AdminDashboard onNavigate={setCurrentView} />}
            {currentView === 'analytics' && <AnalyticsDashboard />}
            {!loading && !error && currentView === 'promotions' && <PromotionsManagement />}
            
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

            {!loading && !error && currentView === 'logs' && <InventoryLogsTable />}

            {!loading && !error && currentView === 'tables' && <TableManagement />}

            {!loading && !error && currentView === 'reviews' && <ReviewsManagement />}
          </main>
          
          <AddItemModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSave={editingItem ? handleUpdateItem : handleAddNewItem}
            itemToEdit={editingItem}
            categories={categories} 
          />
        </div>
      </div>
    </>
  );
}

export default AdminPage;