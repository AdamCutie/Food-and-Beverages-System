// frontend/src/components/AddItemModal.jsx

import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddItemModal = ({ isOpen, onClose, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    price: '',
    stock: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    // Reset form and close modal
    setFormData({ item_name: '', category: '', price: '', stock: '' });
    onClose(); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add New Menu Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Item Name Input */}
            <div>
              <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">Item Name</label>
              <input type="text" id="item_name" value={formData.item_name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>

            {/* --- CATEGORY DROPDOWN --- */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                {/* You can also add an option for a new category if you want */}
              </select>
            </div>

            {/* Price Input */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
              <input type="number" id="price" step="0.01" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>

            {/* Stock Input */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
              <input type="number" id="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;