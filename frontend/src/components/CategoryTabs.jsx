import React from 'react';
const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="mt-8">
      <div className="flex justify-center space-x-4 border-b">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`py-2 px-4 text-lg font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? 'border-b-2 border-orange-500 text-orange-300'
                : 'text-orange-300 hover:text-orange-300'
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