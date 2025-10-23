
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

// Destructure the correct props: onAddItem, onEditItem, onDeleteItem
const MenuManagementTable = ({ 
  items, // This is now the filtered list
  totalItems, 
  categories, 
  selectedCategory,
  onFilterChange,
  onClearFilters,
  onAddItem, 
  onEditItem, 
  onDeleteItem 
}) => {
  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        {/* This button now calls the onAddItem function from the parent */}
        <button
          onClick={onAddItem}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Add New Item
        </button>
      </div>

      {/* --- NEW Filter Controls --- */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-md shadow">
        <div>
          <label htmlFor="categoryFilter" className="mr-2 text-sm font-medium text-gray-700">Filter by Category:</label>
          <select 
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <span className="text-sm font-medium text-gray-700">
            Total Menu Items: {totalItems}
          </span>
        <button 
          onClick={onClearFilters}
          className="text-sm text-blue-500 hover:underline"
          disabled={selectedCategory === 'All'} // Disable if already showing all
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Item Name</th>
              <th className="py-3 px-6 text-left">Category</th>
              <th className="py-3 px-6 text-center">Price</th>
              <th className="py-3 px-6 text-center">Stock</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {items.map((item) => (
              <tr key={item.item_id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">
                  <span className="font-medium">{item.item_name}</span>
                </td>
                <td className="py-3 px-6 text-left">
                  <span>{item.category}</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span>₱{parseFloat(item.price).toFixed(2)}</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span>{item.stock}</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center gap-4">
                    {/* This button now calls the onEditItem function from the parent */}
                    <button 
                      onClick={() => onEditItem(item)} 
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.item_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagementTable;