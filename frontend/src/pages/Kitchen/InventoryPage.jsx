import React, { useState, useEffect } from 'react';
import { Plus, Sliders, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

import InternalNavBar from '../../components/InternalNavBar';
import { useAuth } from '../../context/AuthContext';

// --- 1. IMPORT BOTH MODALS ---
import IngredientModal from './IngredientModal'; 
import AdjustStockModal from './AdjustStockModal'; 

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // --- Data Fetching ---
  const fetchIngredients = async () => {
    // We don't need to set loading to true for a refetch
    // setLoading(true); 
    try {
      const response = await fetch('http://localhost:3000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients.');
      }
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false); // Only set loading false on initial load
    }
  };

  useEffect(() => {
    if (token) {
      fetchIngredients();
    }
  }, [token]);

  // --- Modal Handlers ---
  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsIngredientModalOpen(true);
  };

  // --- 2. UPDATE ADJUST MODAL HANDLER ---
  const handleOpenAdjustModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsAdjustModalOpen(true); // Uncommented
  };

  const handleCloseModals = () => {
    setIsIngredientModalOpen(false);
    setIsAdjustModalOpen(false);
    setSelectedIngredient(null);
  };

  // --- API Call Handlers ---
  const handleSaveIngredient = async (formData) => {
    const isEditMode = Boolean(selectedIngredient);
    const url = isEditMode
      ? `http://localhost:3000/api/inventory/${selectedIngredient.ingredient_id}`
      : 'http://localhost:3000/api/inventory';
    
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} ingredient.`);
      }

      toast.success(`Ingredient ${isEditMode ? 'updated' : 'created'} successfully!`);
      handleCloseModals();
      fetchIngredients(); // Refetch list
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- 3. ADD REAL API LOGIC FOR ADJUST STOCK ---
  const handleAdjustStock = async (formData) => {
    if (!selectedIngredient) return;

    const url = `http://localhost:3000/api/inventory/${selectedIngredient.ingredient_id}/stock`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to adjust stock.');
        }
        
        toast.success('Stock adjusted successfully!');
        handleCloseModals();
        fetchIngredients(); // Refetch list to show new stock level

    } catch (err) {
        toast.error(err.message);
    }
  };

  // --- (Render Logic is unchanged) ---
  if (loading) {
    return (
      <>
        <InternalNavBar />
        <div className="p-8 text-center text-lg">Loading inventory...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <InternalNavBar />
        <div className="p-8 text-center text-red-500">Error: {error}</div>
      </>
    );
  }

  return (
    <>
      <InternalNavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">
            Inventory Management
          </h1>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition-colors"
          >
            <Plus size={20} />
            Add New Ingredient
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Ingredient Name</th>
                <th className="py-3 px-6 text-center">Current Stock</th>
                <th className="py-3 px-6 text-left">Unit</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {ingredients.map((item) => (
                <tr
                  key={item.ingredient_id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-left">
                    <span className="font-medium">{item.name}</span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className="font-semibold">
                      {parseFloat(item.stock_level).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span>{item.unit_of_measurement}</span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center gap-4">
                      <button
                        onClick={() => handleOpenAdjustModal(item)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900"
                        title="Adjust Stock"
                      >
                        <Sliders size={18} />
                        Adjust
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="flex items-center gap-1 text-gray-600 hover:text-black"
                        title="Edit Details"
                      >
                        <Edit2 size={18} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 4. RENDER BOTH MODALS --- */}
      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveIngredient}
        ingredientToEdit={selectedIngredient}
      />
      
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseModals}
        onAdjust={handleAdjustStock}
        ingredient={selectedIngredient}
      />
    </>
  );
};

export default InventoryPage;