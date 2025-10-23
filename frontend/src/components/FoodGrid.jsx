import React from 'react';

const FoodGrid = ({ items, onAddToCart, onImageClick }) => {
  if (!items || items.length === 0) {
    return <p className="text-center mt-12 text-gray-500">No items match your search.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
      {items.map((item) => (
        <div key={item.item_id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="relative">
            {/* --- THIS IS THE FIX --- */}
            {/* We prepend the backend server address to the image URL */}
            <img
              src={item.image_url ? `http://localhost:3000${item.image_url}` : 'https://via.placeholder.com/400x300.png?text=No+Image'}
              alt={item.item_name}
              className="w-full h-56 object-cover cursor-pointer"
              onClick={() => onImageClick(item.image_url ? `http://localhost:3000${item.image_url}` : null)}
            />
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.item_name}</h3>
            <div className="mt-auto flex justify-between items-center">
              <p className="text-2xl font-semibold text-gray-900">
                ₱{parseFloat(item.price).toFixed(2)}
              </p>
              <button
                onClick={() => onAddToCart(item)}
                className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-600 transition-transform transform hover:scale-105"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FoodGrid;