import React from 'react';

// Receive the new props
const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="mt-8">
      <div className="flex space-x-4 border-b">
        {/* Map over the categories to create a button for each one */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`py-2 px-4 text-lg font-semibold transition-colors ${
              selectedCategory === category
                ? 'border-b-2 border-orange-500 text-orange-500' // Active style
                : 'text-gray-500 hover:text-orange-500' // Inactive style
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;