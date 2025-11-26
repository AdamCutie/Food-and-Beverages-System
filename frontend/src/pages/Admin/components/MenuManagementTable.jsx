import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../utils/apiClient';
import '../AdminTheme.css';

// Import Modals
import AddItemModal from './AddItemModal';

const MenuManagementTable = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [filterCategory, setFilterCategory] = useState('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const { token } = useAuth();

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // --- Handlers ---
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await apiClient(`/admin/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      
      toast.success('Item deleted');
      setItems(items.filter(i => i.item_id !== itemId));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      let res;
      if (editingItem) {
        // Update
        res = await apiClient(`/admin/items/${editingItem.item_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Create
        res = await apiClient('/admin/items', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save item');
      }

      toast.success(editingItem ? 'Item updated!' : 'Item created!');
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData(); // Refresh list to get new IDs/Links
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // --- Filtering Logic ---
  const filteredItems = items.filter(item => {
    if (filterCategory === 'All') return true;
    // item.category_id is usually a number, filterCategory is a string from select
    return item.category_id == filterCategory;
  });

  if (loading) return <div className="p-8 text-center text-white">Loading Menu...</div>;

  return (
    <div className="admin-section-container">
      {/* Header Row */}
      <div className="admin-header-row">
        <div>
          <h2 className="admin-page-title">Menu Management</h2>
          <p className="text-sm" style={{ color: '#F9A825' }}>
            Total Menu Items: {filteredItems.length}
          </p>
        </div>

        <div className="flex gap-4 items-center">
            {/* Category Filter Dropdown */}
            <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="admin-select-themed"
                style={{ minWidth: '200px' }}
            >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
            </select>

            <button onClick={openAddModal} className="admin-btn flex items-center gap-2">
                <Plus size={20} /> Add New Item
            </button>
        </div>
      </div>

      {/* Table */}
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
                  <img 
                    src={item.image_url ? `http://localhost:21917${item.image_url}` : '/placeholder-food.png'} 
                    alt={item.item_name}
                    className="w-12 h-12 object-cover rounded-md border border-gray-300"
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
                    <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Item"
                    >
                      <Pencil size={18} />
                    </button>

                    <button 
                        onClick={() => handleDelete(item.item_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
                <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                        No menu items found for this category.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <AddItemModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          categories={categories}
          itemToEdit={editingItem}
        />
      )}
    </div>
  );
};

export default MenuManagementTable;