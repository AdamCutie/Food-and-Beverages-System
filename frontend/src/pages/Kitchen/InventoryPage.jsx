import React, { useState, useEffect } from 'react';
import { Plus, Sliders, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import InternalNavBar from './components/InternalNavBar';
import IngredientModal from './components/IngredientModal'; 
import AdjustStockModal from './components/AdjustStockModal'; 
import apiClient from '../../utils/apiClient'; // <-- 1. IMPORT

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const fetchIngredients = async () => {
    try {
      // --- 2. USE apiClient ---
      const response = await apiClient('/inventory'); // No headers
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients.');
      }
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
       if (err.message !== 'Session expired') {
        setError(err.message);
        toast.error(err.message);
      }
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (token) {
      fetchIngredients();
    }
  }, [token]);

  // ... (Modal handlers are unchanged) ...
  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setIsIngredientModalOpen(true);
  };
  const handleOpenEditModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsIngredientModalOpen(true);
  };
  const handleOpenAdjustModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIsAdjustModalOpen(true);
  };
  const handleCloseModals = () => {
    setIsIngredientModalOpen(false);
    setIsAdjustModalOpen(false);
    setSelectedIngredient(null);
  };


  const handleSaveIngredient = async (formData) => {
    const isEditMode = Boolean(selectedIngredient);
    const url = isEditMode
      ? `/inventory/${selectedIngredient.ingredient_id}`
      : '/inventory';
    
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      // --- 3. USE apiClient ---
      const response = await apiClient(url, {
        method: method,
        // No headers
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} ingredient.`);
      }

      toast.success(`Ingredient ${isEditMode ? 'updated' : 'created'} successfully!`);
      handleCloseModals();
      fetchIngredients(); 
    } catch (err) {
       if (err.message !== 'Session expired') {
        toast.error(err.message);
      }
    }
  };

  const handleAdjustStock = async (formData) => {
    if (!selectedIngredient) return;

    const url = `/inventory/${selectedIngredient.ingredient_id}/stock`;

    try {
        // --- 4. USE apiClient ---
        const response = await apiClient(url, {
            method: 'PUT',
            // No headers
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to adjust stock.');
        }
        
        toast.success('Stock adjusted successfully!');
        handleCloseModals();
        fetchIngredients(); 

    } catch (err) {
       if (err.message !== 'Session expired') {
        toast.error(err.message);
      }
    }
  };

  // ... (Render logic and JSX is unchanged) ...
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