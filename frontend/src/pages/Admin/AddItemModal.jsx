// frontend/src/pages/Admin/AddItemModal.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, UploadCloud } from 'lucide-react';

// Receive the categories prop again
const AddItemModal = ({ isOpen, onClose, onSave, categories = [], itemToEdit }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: '', // This will hold the final category value
    price: '',
    stock: '',
    image_url: '',
  });
  const [uploading, setUploading] = useState(false);
  const isEditMode = Boolean(itemToEdit);

  // --- NEW STATE ---
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const showNewCategoryInput = selectedDropdownCategory === 'ADD_NEW';

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          item_name: itemToEdit.item_name || '',
          description: itemToEdit.description || '',
          category: itemToEdit.category || '',
          price: itemToEdit.price || '',
          stock: itemToEdit.stock || '',
          image_url: itemToEdit.image_url || '',
        });
        setSelectedDropdownCategory(itemToEdit.category || '');
        setNewCategoryName('');
      } else {
        setFormData({ item_name: '', description: '', category: '', price: '', stock: '', image_url: '' });
        setSelectedDropdownCategory('');
        setNewCategoryName('');
      }
    }
  }, [itemToEdit, isOpen]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleCategoryDropdownChange = (e) => {
    const value = e.target.value;
    setSelectedDropdownCategory(value);
    if (value !== 'ADD_NEW') {
      setFormData(prev => ({ ...prev, category: value }));
      setNewCategoryName('');
    } else {
      setFormData(prev => ({ ...prev, category: newCategoryName })); // Use current new name or empty
    }
  };

  const handleNewCategoryNameChange = (e) => {
    const value = e.target.value;
    setNewCategoryName(value);
    setFormData(prev => ({ ...prev, category: value }));
  };


  const handleFileUpload = async (e) => {
    // ... (this function remains the same)
      const file = e.target.files[0];
      if (!file) return;
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      setUploading(true);
      try {
        const response = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Image upload failed');
        }
        setFormData(prevData => ({ ...prevData, image_url: data.image }));
        toast.success('Image uploaded successfully!');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setUploading(false);
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the category currently stored in formData state
    if (!formData.category) {
        toast.error('Please select or add a category.');
        return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* --- ALL FORM FIELDS RESTORED --- */}
          <div className="space-y-4">
            {/* Item Name */}
            <div>
              <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">Item Name</label>
              <input type="text" id="item_name" value={formData.item_name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
            </div>
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              ></textarea>
            </div>
            {/* Category Dropdown */}
            <div>
              <label htmlFor="categoryDropdown" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="categoryDropdown"
                value={selectedDropdownCategory}
                onChange={handleCategoryDropdownChange}
                required={!showNewCategoryInput}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="ADD_NEW">-- Add New Category --</option>
              </select>
            </div>
            {/* New Category Input (Conditional) */}
            {showNewCategoryInput && (
              <div>
                <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700">New Category Name</label>
                <input
                  type="text"
                  id="newCategoryName"
                  value={newCategoryName}
                  onChange={handleNewCategoryNameChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="Enter new category name"
                />
              </div>
            )}
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
              <input type="number" id="price" step="0.01" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
            </div>
            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
              <input type="number" id="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
            </div>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              {formData.image_url && (
                <img src={`http://localhost:3000${formData.image_url}`} alt="Preview" className="w-full h-32 object-cover rounded-md my-2"/>
              )}
              <label htmlFor="image-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <p className="pl-1">{uploading ? 'Uploading...' : 'Upload a file'}</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
                </div>
              </label>
              <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleFileUpload} />
            </div>
          </div>
          {/* --- END OF RESTORED FIELDS --- */}
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={uploading}>
              {uploading ? 'Waiting for upload...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;