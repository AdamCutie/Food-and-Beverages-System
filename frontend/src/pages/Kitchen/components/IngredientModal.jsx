import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const IngredientModal = ({ isOpen, onClose, onSave, ingredientToEdit }) => {

  const unitOptions = [
    { value: 'g', label: 'g (grams)' },
    { value: 'ml', label: 'ml (milliliters)' },
    { value: 'pcs', label: 'pcs (pieces)' },
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    unit_of_measurement: '',
    stock_level: 0,
    reorder_point: 10, // ✅ New State for Threshold
  });

  const isEditMode = Boolean(ingredientToEdit);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: ingredientToEdit.name || '',
          unit_of_measurement: ingredientToEdit.unit_of_measurement || '',
          stock_level: ingredientToEdit.stock_level, 
          // ✅ Load existing point or default to 10
          reorder_point: ingredientToEdit.reorder_point || 10, 
        });
      } else {
        // Reset for new ingredient
        setFormData({
          name: '',
          unit_of_measurement: '',
          stock_level: 0,
          reorder_point: 10, 
        });
      }
    }
  }, [ingredientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prevData) => {
        const newData = { ...prevData, [id]: value };

        // ✅ SMART LOGIC: Auto-suggest threshold based on Unit
        if (id === 'unit_of_measurement') {
            if (value === 'g' || value === 'ml') {
                newData.reorder_point = 1000; // Default to 1kg / 1L
            } else if (value === 'pcs') {
                newData.reorder_point = 10;   // Default to 10 pieces
            }
        }

        return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {isEditMode ? 'Edit Ingredient' : 'Add New Ingredient'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Ingredient Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="e.g., Beef, Lettuce, Buns"
            />
          </div>

         {/* 2. Unit Selection (Triggers Smart Logic) */}
         <div>
            <label htmlFor="unit_of_measurement" className="block text-sm font-medium text-gray-700">
              Unit of Measurement
            </label>
            <select
              id="unit_of_measurement"
              value={formData.unit_of_measurement}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="" disabled>Select a unit</option>
              {unitOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ✅ NEW: Low Stock Threshold Input */}
          <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
            <label htmlFor="reorder_point" className="flex items-center gap-2 text-sm font-bold text-orange-800">
              <AlertTriangle size={16} />
              Low Stock Threshold (Alert Level)
            </label>
            <div className="flex items-center gap-2 mt-1">
                <input
                type="number"
                id="reorder_point"
                value={formData.reorder_point}
                onChange={handleChange}
                required
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="text-sm text-gray-500 font-bold min-w-[30px]">
                    {formData.unit_of_measurement || ''}
                </span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
                System will alert you when stock falls below this number.
            </p>
          </div>

          {/* 4. Initial Stock (Only for New Items) */}
          {!isEditMode && (
            <div>
              <label htmlFor="stock_level" className="block text-sm font-medium text-gray-700">
                Initial Stock
              </label>
              <input
                type="number"
                id="stock_level"
                step="0.01"
                value={formData.stock_level}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
              <p className="text-xs text-gray-500 mt-1">You can adjust this later using the "Adjust Stock" button.</p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#F9A825] text-white font-bold py-2 px-6 rounded hover:bg-[#c47b04] transition-colors"
            >
              Save Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientModal;