import React, { useState, useEffect } from 'react';
import { Plus, Sliders, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import InternalNavBar from './components/InternalNavBar';
import IngredientModal from './components/IngredientModal'; 
import AdjustStockModal from './components/AdjustStockModal'; 
import apiClient from '../../utils/apiClient'; 
import './KitchenTheme.css'; 

// 👇 1. Import Socket Hook
import { useSocket } from '../../context/SocketContext';

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // 👇 2. Get Socket Instance
  const { socket } = useSocket();

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const fetchIngredients = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await apiClient('/inventory'); 
      if (!response.ok) throw new Error('Failed to fetch ingredients.');
      const data = await response.json();
      setIngredients(data);
      setError(null);
    } catch (err) {
       if (err.message !== 'Session expired') {
        setError(err.message);
        // Don't toast on background refresh to avoid spam
        if (!isBackground) toast.error(err.message);
      }
    } finally {
      if (!isBackground) setLoading(false); 
    }
  };

  useEffect(() => {
    if (token) fetchIngredients();

    // 👇 3. Add Socket Listeners
    if (socket) {
        // When an order is placed or status changes, stock might change
        socket.on('new-order', () => {
            console.log("📦 Order placed, refreshing inventory...");
            fetchIngredients(true); // true = background refresh (no loading spinner)
        });

        socket.on('order-status-updated', () => {
            // E.g. Order cancelled -> Stock restored
            fetchIngredients(true);
        });
    }

    return () => {
        if (socket) {
            socket.off('new-order');
            socket.off('order-status-updated');
        }
    };
  }, [token, socket]);

  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setIsIngredientModalOpen(true);
  };
  const handleOpenEditModal = (ing) => {
    setSelectedIngredient(ing);
    setIsIngredientModalOpen(true);
  };
  const handleOpenAdjustModal = (ing) => {
    setSelectedIngredient(ing);
    setIsAdjustModalOpen(true);
  };
  const handleCloseModals = () => {
    setIsIngredientModalOpen(false);
    setIsAdjustModalOpen(false);
    setSelectedIngredient(null);
  };

  const handleSaveIngredient = async (formData) => {
    const isEditMode = Boolean(selectedIngredient);
    const url = isEditMode ? `/inventory/${selectedIngredient.ingredient_id}` : '/inventory';
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const response = await apiClient(url, { method, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Failed to save ingredient');
      toast.success(`Ingredient ${isEditMode ? 'updated' : 'created'}!`);
      handleCloseModals();
      fetchIngredients(true); 
    } catch (err) {
       toast.error(err.message);
    }
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
    } catch (err) {
       toast.error(err.message);
    }
  };

  return (
    <>
      <InternalNavBar />
      <div className="kitchen-page">
        
        {/* Header Row */}
        <div className="kitchen-header-row">
          <h1 className="kitchen-title" style={{marginBottom: 0}}>Inventory Management</h1>
          <button onClick={handleOpenAddModal} className="kitchen-btn btn-accent">
            <Plus size={20} /> Add Ingredient
          </button>
        </div>

        {loading ? (
            <div className="text-center text-white text-xl py-10">Loading inventory...</div>
        ) : error ? (
            <div className="text-center text-red-500 text-xl py-10">Error: {error}</div>
        ) : (
            <div className="kitchen-table-container">
            <table className="kitchen-table">
                <thead>
                <tr>
                    <th>Ingredient Name</th>
                    <th className="text-center">Current Stock</th>
                    <th>Unit</th>
                    <th className="text-center">Actions</th>
                </tr>
                </thead>
                <tbody>
                {ingredients.map((item) => (
                    <tr key={item.ingredient_id}>
                    <td className="font-bold">{item.name}</td>
                    <td className="text-center font-bold text-lg">
                        {parseFloat(item.stock_level).toFixed(2)}
                    </td>
                    <td className="text-sm opacity-80">{item.unit_of_measurement}</td>
                    <td className="text-center">
                        <div className="flex justify-center gap-4">
                        <button onClick={() => handleOpenAdjustModal(item)} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Sliders size={16} /> Adjust
                        </button>
                        <button onClick={() => handleOpenEditModal(item)} className="text-gray-600 hover:underline flex items-center gap-1">
                            <Edit2 size={16} /> Edit
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>

      <IngredientModal isOpen={isIngredientModalOpen} onClose={handleCloseModals} onSave={handleSaveIngredient} ingredientToEdit={selectedIngredient} />
      <AdjustStockModal isOpen={isAdjustModalOpen} onClose={handleCloseModals} onAdjust={handleAdjustStock} ingredient={selectedIngredient} />
    </>
  );
};

export default InventoryPage;