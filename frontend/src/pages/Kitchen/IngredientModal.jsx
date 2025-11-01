import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const IngredientModal = ({ isOpen, onClose, onSave, ingredientToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit_of_measurement: '',
    stock_level: 0, // Only used when creating a new item
  });
  const isEditMode = Boolean(ingredientToEdit);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // We only edit details here, not stock level
        setFormData({
          name: ingredientToEdit.name || '',
          unit_of_measurement: ingredientToEdit.unit_of_measurement || '',
          stock_level: ingredientToEdit.stock_level, // Keep it for context, but won't edit
        });
      } else {
        // Reset for new ingredient
        setFormData({
          name: '',
          unit_of_measurement: '',
          stock_level: 0,
        });
      }
    }
  }, [ingredientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
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

          <div>
            <label htmlFor="unit_of_measurement" className="block text-sm font-medium text-gray-700">
              Unit of Measurement
            </label>
            <input
              type="text"
              id="unit_of_measurement"
              value={formData.unit_of_measurement}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="e.g., g, ml, pcs"
            />
          </div>

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
              className="py-2 px-4 bg-green-700 text-white rounded-md hover:bg-green-800"
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