import React, { useState, useEffect } from 'react';
import { Plus, Sliders, Edit2, AlertTriangle, CheckCircle, Filter, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import './KitchenTheme.css'; 

// Import Modals
import IngredientModal from './components/IngredientModal'; 
import AdjustStockModal from './components/AdjustStockModal'; 
import InternalNavBar from './components/InternalNavBar';
import { useSocket } from '../../context/SocketContext';

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { socket } = useSocket();

  // --- FILTERS & SORTING STATE ---
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [sortBy, setSortBy] = useState('stock-low'); 

  // --- MODAL STATE ---
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  // ✅ NEW: Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const fetchIngredients = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await apiClient('/inventory'); 
      if (!response.ok) throw new Error('Failed to fetch ingredients.');
      const data = await response.json();
      setIngredients(data);
      setError(null);

      if (!isBackground) {
        const hasLowStock = data.some(item => {
           const current = parseFloat(item.stock_level);
           const threshold = parseFloat(item.reorder_point || 10);
           return current <= threshold;
        });

        if (hasLowStock) {
            setFilterStatus('Low Stock');
        } else {
            setFilterStatus('All');
        }
      }

    } catch (err) {
       if (err.message !== 'Session expired') {
        setError(err.message);
        if (!isBackground) toast.error(err.message);
      }
    } finally {
      if (!isBackground) setLoading(false); 
    }
  };

  useEffect(() => {
    if (token) fetchIngredients();

    if (socket) {
        socket.on('new-order', () => { fetchIngredients(true); });
        socket.on('order-status-updated', () => { fetchIngredients(true); });
    }

    return () => {
        if (socket) {
            socket.off('new-order');
            socket.off('order-status-updated');
        }
    };
  }, [token, socket]);

  // --- HANDLERS ---
  const handleOpenAddModal = () => { setSelectedIngredient(null); setIsIngredientModalOpen(true); };
  const handleOpenEditModal = (ing) => { setSelectedIngredient(ing); setIsIngredientModalOpen(true); };
  const handleOpenAdjustModal = (ing) => { setSelectedIngredient(ing); setIsAdjustModalOpen(true); };
  
  // ✅ NEW: Delete Handlers
  const handleOpenDeleteModal = (ing) => { setSelectedIngredient(ing); setIsDeleteModalOpen(true); };
  
  const handleCloseModals = () => {
    setIsIngredientModalOpen(false);
    setIsAdjustModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedIngredient(null);
  };

  const handleSaveIngredient = async (formData) => {

    const newName = formData.name.trim().toLowerCase();
    
    const duplicate = ingredients.find(ing => {

        const existingName = ing.name.trim().toLowerCase();
        
        if (selectedIngredient) {
            return existingName === newName && ing.ingredient_id !== selectedIngredient.ingredient_id;
        }
        return existingName === newName;
    });


    if (duplicate) {
        toast.error(`"${formData.name}" already exists in inventory!`);
        return; 
    }
    
    const isEditMode = Boolean(selectedIngredient);
    const url = isEditMode ? `/inventory/${selectedIngredient.ingredient_id}` : '/inventory';
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const response = await apiClient(url, { method, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Failed to save ingredient');
      toast.success(`Ingredient ${isEditMode ? 'updated' : 'created'}!`);
      handleCloseModals();
      fetchIngredients(true); 
    } catch (err) { toast.error(err.message); }
  };

  const handleAdjustStock = async (formData) => {
    if (!selectedIngredient) return;
    try {
        const response = await apiClient(`/inventory/${selectedIngredient.ingredient_id}/stock`, {
            method: 'PUT', body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to adjust stock');
        toast.success('Stock adjusted!');
        handleCloseModals();
        fetchIngredients(true); 
    } catch (err) { toast.error(err.message); }
  };

  // ✅ NEW: Confirm Delete Logic
  const handleDeleteIngredient = async () => {
    if (!selectedIngredient) return;
    try {
        const response = await apiClient(`/inventory/${selectedIngredient.ingredient_id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete ingredient');
        toast.success('Ingredient deleted successfully');
        handleCloseModals();
        fetchIngredients(true);
    } catch (err) {
        toast.error(err.message);
    }
  };

  // --- FILTER & SORT LOGIC ---
  const getProcessedIngredients = () => {
      // 1. Filter
      let result = ingredients.filter(item => {
          const current = parseFloat(item.stock_level);
          const threshold = parseFloat(item.reorder_point || 10);
          const isLow = current <= threshold;

          if (filterStatus === 'Low Stock') return isLow;
          if (filterStatus === 'Good') return !isLow;
          return true; // 'All'
      });

      // 2. Sort
      result.sort((a, b) => {
          const stockA = parseFloat(a.stock_level);
          const stockB = parseFloat(b.stock_level);

          switch (sortBy) {
              case 'stock-low': return stockA - stockB; // Lowest first
              case 'stock-high': return stockB - stockA; // Highest first
              case 'name': return a.name.localeCompare(b.name); // A-Z
              default: return 0;
          }
      });

      return result;
  };

  const filteredList = getProcessedIngredients();

  return (
    <>
      <InternalNavBar />
      <div className="kitchen-page">
        <div className="kitchen-container">
            
            {/* 1. HEADER ROW */}
            <div className="kitchen-header-row">
                <div>
                    <h1 className="kitchen-title mb-1">Inventory Management</h1>
                    <p className="text-sm text-gray-300">Total Ingredients: {ingredients.length}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-end">
                    
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="kitchen-select-primary appearance-none pr-10" 
                            style={{ minWidth: '160px' }}
                        >
                            <option value="All">All Status</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Good">Good Stock</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                            <Filter size={18} />
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="admin-btn bg-white text-[#3C2A21] hover:bg-gray-100 shadow-lg border border-gray-200"
                        >
                            <option value="name">Name (A-Z)</option>
                            <option value="stock-low">Stock (Lowest First)</option>
                            <option value="stock-high">Stock (Highest First)</option>
                        </select>
                    </div>

                    {/* Add Button */}
                    <button 
                        onClick={handleOpenAddModal} 
                        className="kitchen-btn btn-accent flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Ingredient
                    </button>
                </div>
            </div>

            {/* 2. TABLE CONTAINER */}
            {loading ? (
                    <div className="text-center text-white text-xl py-10">Loading inventory...</div>
            ) : error ? (
                    <div className="text-center text-red-500 text-xl py-10">Error: {error}</div>
            ) : (
                    <div className="kitchen-table-container">
                    <table className="kitchen-table w-full border-collapse">
                    <thead>
                    <tr className="border-b border-gray-200">
                        <th className="py-4 text-center w-1/4">Ingredient Name</th>
                        <th className="py-4 text-center w-1/6">Status</th>
                        <th className="py-4 text-center w-1/6">Current Stock</th>
                        <th className="py-4 text-center w-1/6">Unit</th>
                        <th className="py-4 text-center w-1/12">Actions</th>
                    </tr>
                    </thead>
                        <tbody>
{filteredList.map((item) => {
    const current = parseFloat(item.stock_level);
    const threshold = parseFloat(item.reorder_point || 10);
    const isLow = current <= threshold;

    return (
        <tr key={item.ingredient_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            
            {/* 1. NAME: text-center, w-1/4 (Matches Header) */}
            <td className="py-4 font-bold text-left w-1/3">{item.name}</td>
            
            {/* 2. STATUS: text-center, w-1/6 (Matches Header) */}
            <td className="py-4 text-left w-1/6">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border ${isLow ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                        {isLow ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                        {isLow ? 'Low Stock' : 'Good'}
                </div>
            </td>

            {/* 3. STOCK: text-center, w-1/6 (Matches Header) */}
            <td className={`py-4 text-center font-bold text-lg w-1/6 ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                {Math.floor(current)}
            </td>
            
            {/* 4. UNIT: text-center, w-1/6 (Matches Header) */}
            <td className="py-4 text-left text-gray-500 text-center w-1/6">{item.unit_of_measurement}</td>
            
            {/* 5. ACTIONS: text-center, w-1/4 (Matches Header) */}
            <td className="py-4 text-left w-1/12">
                <div className="flex justify-start ">
                        <button onClick={() => handleOpenAdjustModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Adjust Stock">
                            <Sliders size={18} />
                        </button>
                        <button onClick={() => handleOpenEditModal(item)} className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Edit Details">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(item)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete Ingredient">
                            <Trash2 size={18} />
                        </button>
                            </div>
                        </td>
                    </tr>
                );
            })}
            {filteredList.length === 0 && (
                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No ingredients found matching filters.</td></tr>
            )}
            </tbody>
                    </table>
                    </div>
            )}

            {/* Modals */}
            <IngredientModal isOpen={isIngredientModalOpen} onClose={handleCloseModals} onSave={handleSaveIngredient} ingredientToEdit={selectedIngredient} />
            <AdjustStockModal isOpen={isAdjustModalOpen} onClose={handleCloseModals} onAdjust={handleAdjustStock} ingredient={selectedIngredient} />
            
            {/* ✅ NEW: Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedIngredient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl relative border-t-4 border-red-500">
                        <button 
                            onClick={handleCloseModals}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="bg-red-100 p-3 rounded-full mb-3">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Delete Ingredient?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete <span className="font-bold text-gray-800">{selectedIngredient.name}</span>? 
                                <br/>This action cannot be undone.
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={handleCloseModals}
                                className="flex-1 py-2 rounded-lg font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteIngredient}
                                className="flex-1 py-2 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </>
  );
};

export default InventoryPage;