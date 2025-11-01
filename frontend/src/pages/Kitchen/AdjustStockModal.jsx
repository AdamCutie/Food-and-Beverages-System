import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AdjustStockModal = ({ isOpen, onClose, onAdjust, ingredient }) => {
  const [formData, setFormData] = useState({
    quantity_change: '',
    action_type: 'RESTOCK', // Default action
    reason: '',
  });

  // Reset form when modal opens or ingredient changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        quantity_change: '',
        action_type: 'RESTOCK',
        reason: '',
      });
    }
  }, [isOpen]);

  if (!isOpen || !ingredient) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(formData.quantity_change) <= 0) {
        alert('Quantity must be a positive number.');
        return;
    }
    onAdjust(formData);
  };
  
  const isSubtractAction = formData.action_type === 'WASTE' || formData.action_type === 'ADJUST_SUBTRACT';

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary">
            Adjust Stock
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>

        <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-md">
            <h3 className="font-bold text-lg text-blue-800">{ingredient.name}</h3>
            <p className="text-sm text-gray-700">
                Current Stock: <span className="font-semibold">{parseFloat(ingredient.stock_level).toFixed(2)} {ingredient.unit_of_measurement}</span>
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="action_type" className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              id="action_type"
              value={formData.action_type}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="RESTOCK">Restock (Add)</option>
              <option value="ADJUST_ADD">Manual Adjustment (Add)</option>
              <option value="WASTE">Waste (Subtract)</option>
              <option value="ADJUST_SUBTRACT">Manual Adjustment (Subtract)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity_change" className="block text-sm font-medium text-gray-700">
              Quantity {isSubtractAction ? 'to Subtract' : 'to Add'}
            </label>
            <input
              type="number"
              id="quantity_change"
              step="0.01"
              value={formData.quantity_change}
              onChange={handleChange}
              required
              min="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder={`Amount in ${ingredient.unit_of_measurement}`}
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason (Optional)
            </label>
            <input
              type="text"
              id="reason"
              value={formData.reason}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder={formData.action_type === 'WASTE' ? 'e.g., Expired, Spoilage' : 'e.g., New delivery, Correction'}
            />
          </div>

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
              className={`py-2 px-4 text-white rounded-md ${isSubtractAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustStockModal;