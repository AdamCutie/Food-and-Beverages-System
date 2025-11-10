import React from 'react';
import { Edit, Trash2, Search} from 'lucide-react';

const MenuManagementTable = ({ 
  items,
  totalItems, 
  categories, 
  selectedCategory,
  searchTerm,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onAddItem, 
  onEditItem, 
  onDeleteItem 
}) => {
  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ color: '#F9A825' , fontSize: '1.5rem', fontWeight: 'bold' }}>Menu Management</h2>
        <button
          onClick={onAddItem}
          className="bg-[#F9A825] text-white font-bold py-2 px-4 rounded hover:bg-[#c47b04] transition-colors"
        >
          Add New Item
        </button>
      </div>

      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-md shadow">
      
      {/* Filters Container */}
      <div className="flex items-center gap-4">
        
        {/* Category Filter */}
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

        {/* Search Bar (This section is now fixed) */}
        <div>
          <label htmlFor="menuSearch" className="mr-2 text-sm font-medium text-gray-700">Search:</label>
          <div className="relative inline-block"> {/* This wrapper keeps the icon and input together */}
            <input
              type="text"
              id="menuSearch"
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border border-gray-300 rounded-md p-2 pl-9 text-sm" // pl-9 for icon padding
            />
            {/* The icon is positioned relative to the div above */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

      </div>

      {/* Info Container */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
            Total Menu Items: {totalItems}
          </span>
      </div>
    </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Item Name</th>
              <th className="py-3 px-6 text-left">Category</th>
              <th className="py-3 px-6 text-center">Price</th>
              {/* --- STOCK COLUMN REMOVED --- */}
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
                
                {/* --- STOCK COLUMN REMOVED --- */}
                
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center gap-4">
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