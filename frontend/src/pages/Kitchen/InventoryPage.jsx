import React, { useState, useEffect } from 'react';
import { Plus, Sliders, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import InternalNavBar from './components/InternalNavBar';
import IngredientModal from './components/IngredientModal'; 
import AdjustStockModal from './components/AdjustStockModal'; 
import apiClient from '../../utils/apiClient'; 

const styles = {
  container: {
    backgroundColor: '#523a2eff', 
    minHeight: 'calc(100vh - 84px)', 
    padding: '32px 16px'
  },
  headerTitle: {
    color: '#F9A825',
    fontSize: '1.875rem',
    fontWeight: 'bold'
  },
  addButton: {
    backgroundColor: '#F9A825',
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem 1.5rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
    border: 'none',
    cursor: 'pointer'
  },
  // --- ADJUSTED TABLE STYLES ---
  tableContainer: {
    backgroundColor: '#fff2e0', 
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    overflow: 'hidden', 
    maxWidth: '1500px', // Limit the width to make it thinner
    margin: '0 auto',   // Center the table
  },
  tableHeader: {
    color: '#3C2A21', 
    textTransform: 'uppercase',
    fontSize: '0.875rem',
    fontWeight: '600',
    borderBottom: '2px solid #D1C0B6', 
    backgroundColor: '#fae5cc', 
  },
  tableRow: {
    borderBottom: '1px solid #D1C0B6',
    color: '#3C2A21',
    transition: 'background-color 0.15s',
  },
  tableCell: {
    padding: '12px 16px', 
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
  }
};

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
      setLoading(true);
      const response = await apiClient('/inventory'); 
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients.');
      }
      const data = await response.json();
      setIngredients(data);
      setError(null);
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
      const response = await apiClient(url, {
        method: method,
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
        const response = await apiClient(url, {
            method: 'PUT',
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

  return (
    <>
      <InternalNavBar />
      <div style={styles.container}>
        <div className="flex justify-between items-center mb-6">
          <h1 style={styles.headerTitle}>
            Inventory Management
          </h1>
          <button
            onClick={handleOpenAddModal}
            style={styles.addButton}
            className="hover:opacity-90"
          >
            Add New Ingredient
          </button>
        </div>

        {/* === LOADING STATE === */}
        {loading ? (
            <div className="p-8 text-center text-lg" style={{ color: '#ffffff' }}>
                Loading inventory...
            </div>
        ) : error ? (
            /* === ERROR STATE === */
            <div className="p-8 text-center text-red-500 bg-white rounded-lg">Error: {error}</div>
        ) : (
            /* === CONTENT STATE === */
            <div style={styles.tableContainer}>
            <table className="min-w-full leading-normal">
                <thead>
                <tr style={styles.tableHeader}>
                    <th style={styles.tableCell} className="text-left">Ingredient Name</th>
                    <th style={styles.tableCell} className="text-center">Current Stock</th>
                    <th style={styles.tableCell} className="text-left">Unit</th>
                    <th style={styles.tableCell} className="text-center">Actions</th>
                </tr>
                </thead>
                <tbody>
                {ingredients.map((item) => (
                    <tr
                    key={item.ingredient_id}
                    style={styles.tableRow}
                    className="hover:bg-[#f7dac4]" // Subtle hover effect
                    >
                    <td style={styles.tableCell} className="text-left">
                        <span className="font-bold">{item.name}</span>
                    </td>
                    <td style={styles.tableCell} className="text-center">
                        <span className="font-bold text-lg">
                        {parseFloat(item.stock_level).toFixed(2)}
                        </span>
                    </td>
                    <td style={styles.tableCell} className="text-left">
                        <span className="text-sm font-semibold opacity-80">{item.unit_of_measurement}</span>
                    </td>
                    <td style={styles.tableCell} className="text-center">
                        <div className="flex item-center justify-center gap-6">
                        <button
                            onClick={() => handleOpenAdjustModal(item)}
                            style={{...styles.actionButton, color: '#2563EB'}} // Blue-600
                            className="hover:text-blue-800"
                            title="Adjust Stock"
                        >
                            <Sliders size={18} />
                            Adjust
                        </button>
                        <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{...styles.actionButton, color: '#4B5563'}} // Gray-600
                            className="hover:text-black"
                            title="Edit Details"
                        >
                            <Edit2 size={18} />
                            Edit
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                {ingredients.length === 0 && (
                    <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-500">No ingredients found.</td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
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