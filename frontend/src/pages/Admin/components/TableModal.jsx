import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../utils/apiClient';

const TableModal = ({ isOpen, onClose, onSave, tableToEdit = null }) => {
  const [formData, setFormData] = useState({ table_number: '', capacity: '' });

  useEffect(() => {
    if (isOpen) {
      if (tableToEdit) {
        setFormData({ 
            table_number: tableToEdit.table_number, 
            capacity: tableToEdit.capacity 
        });
      } else {
        setFormData({ table_number: '', capacity: '' });
      }
    }
  }, [isOpen, tableToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!tableToEdit;
    const url = isEdit ? `/tables/${tableToEdit.table_id}` : '/tables';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await apiClient(url, {
        method: method,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to save table');
      }
      
      toast.success(`Table ${isEdit ? 'updated' : 'created'} successfully!`);
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#3C2A21]">
            {tableToEdit ? 'Edit Table' : 'Add New Table'}
          </h2>
          <button onClick={onClose}><X className="text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Table Number</label>
            <input 
                type="text" 
                value={formData.table_number} 
                onChange={(e) => setFormData({...formData, table_number: e.target.value})} 
                required 
                placeholder="e.g. 1 or 17"
                className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Capacity (Seats)</label>
            <input 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                required 
                min="1"
                className="w-full border p-2 rounded" 
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#F9A825] text-white font-bold rounded hover:bg-yellow-600">
                Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableModal;