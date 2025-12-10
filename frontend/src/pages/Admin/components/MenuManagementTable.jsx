import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, Filter, FolderCog, Edit3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../utils/apiClient';
import '../AdminTheme.css';
import AddItemModal from './AddItemModal';
import ManageCategoriesModal from './ManageCategoriesModal';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-food.png';
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  
  // Dynamic check: Are we on localhost or the live web?
  const BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:21917' 
      : 'https://food-and-beverages-system.onrender.com';
      
  return `${BASE_URL}${imagePath}`;
};

const MenuManagementTable = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Edit States
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const { token } = useAuth();

  // ✅ FIX 2: Added 'isBackground' parameter
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true); // Only show big spinner on initial load
    try {
      const [itemsRes, catsRes] = await Promise.all([
        apiClient('/items'),
        apiClient('/categories')
      ]);
      if (!itemsRes.ok || !catsRes.ok) throw new Error('Failed to fetch data');
      setItems(await itemsRes.json());
      setCategories(await catsRes.json());
    } catch (error) {
      if (error.message !== 'Session expired') toast.error(error.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  // --- Handlers ---
  
  const handleSaveCategory = async (name, categoryId) => {
    try {
        let res;
        if (categoryId) {
            res = await apiClient(`/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify({ name }) });
        } else {
            res = await apiClient('/categories', { method: 'POST', body: JSON.stringify({ name }) });
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to save category");
        }
        
        toast.success(categoryId ? "Category updated!" : "Category created!");
        
        // Don't close modal if adding (let them add more), Close if editing
        if (categoryId) setIsCategoryModalOpen(false);
        setEditingCategory(null);
        
        // ✅ FIX 3: Background refresh prevents modal from unmounting/flickering
        fetchData(true); 
    } catch (error) {
        toast.error(error.message);
    }
  };

  // The rest of the handlers and JSX remain the same...
  const openEditCategoryModal = () => {
      const catToEdit = categories.find(c => c.category_id == filterCategory);
      if (catToEdit) {
          setEditingCategory(catToEdit);
          setIsCategoryModalOpen(true);
      }
  };

  const openAddCategoryModal = () => {
      setEditingCategory(null);
      setIsCategoryModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await apiClient(`/admin/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      toast.success('Item deleted');
      setItems(items.filter(i => i.item_id !== itemId));
    } catch (error) { toast.error(error.message); }
  };

  const handleSaveItem = async (formData) => {
    try {
      let res;
      if (editingItem) {
        res = await apiClient(`/admin/items/${editingItem.item_id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        res = await apiClient('/admin/items', { method: 'POST', body: JSON.stringify(formData) });
      }
      if (!res.ok) throw new Error('Failed to save item');
      toast.success(editingItem ? 'Item updated!' : 'Item created!');
      setIsItemModalOpen(false);
      setEditingItem(null);
      fetchData(true); // Background refresh here too
    } catch (error) { toast.error(error.message); }
  };

  const openAddItemModal = () => { setEditingItem(null); setIsItemModalOpen(true); };
  const openEditItemModal = (item) => { setEditingItem(item); setIsItemModalOpen(true); };

  const filteredItems = items.filter(item => filterCategory === 'All' || item.category_id == filterCategory);

  if (loading) return <div className="p-8 text-center text-[#3C2A21]">Loading Menu...</div>;

  return (
    <div className="w-full">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
            <h2 className="admin-page-title mb-1">Menu Management</h2>
            <p className="text-sm text-gray-300">Total Items: {filteredItems.length}</p>
        </div>

        <div className="flex gap-4">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="admin-select-primary appearance-none pr-10" 
                        style={{ minWidth: '180px' }}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                        <Filter size={18} />
                    </div>
                </div>

                {filterCategory !== 'All' && (
                    <button 
                        onClick={openEditCategoryModal}
                        className="p-3 rounded-lg bg-white text-[#3C2A21] shadow-lg hover:bg-gray-100 transition-transform hover:scale-110 border border-gray-200"
                        title="Edit Category Name"
                    >
                        <Edit3 size={20} />
                    </button>
                )}
            </div>

            {/* Manage Categories Button (Renamed as discussed) */}
            <button 
                onClick={() => setIsCategoryModalOpen(true)} 
                className="admin-btn bg-white text-[#3C2A21] hover:bg-gray-100 shadow-lg border border-gray-200"
            >
                <FolderCog size={20} /> Manage Categories
            </button>

            {/* Add Item Button */}
            <button 
                onClick={openAddItemModal} 
                className="admin-btn admin-btn-primary"
            >
                <Plus size={20} /> Add Item
            </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.item_id}>
                <td>
                  {/* ✅ FIX: Use the helper function here */}
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.item_name}
                    className="w-12 h-12 object-cover rounded-md border border-gray-300"
                    onError={(e) => { e.target.src = '/placeholder-food.png'; }} 
                  />
                </td>
                <td className="font-bold">{item.item_name}</td>
                <td>{item.category || 'Uncategorized'}</td>
                <td className="font-medium">₱{parseFloat(item.price).toFixed(2)}</td>
                <td>
                   <span className={`status-badge ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     {item.is_available ? 'Available' : 'Unavailable'}
                   </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEditItemModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(item.item_id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No menu items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isItemModalOpen && (
        <AddItemModal 
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          categories={categories}
          itemToEdit={editingItem}
        />
      )}
      
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onDataChange={() => fetchData(true)} // ✅ Background refresh
      />
    </div>
  );
};

export default MenuManagementTable;