import React, { useState, useRef, useEffect } from 'react';
import '../CustomerTheme.css'; 

// ✅ FIX: Destructure 'theme' prop
const CategoryTabs = ({ categories, selectedCategory, onSelectCategory, onSortChange, theme = "customer" }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [currentSort, setCurrentSort] = useState('a-z'); 
  const [dropdownStyle, setDropdownStyle] = useState({});
  
  const filterButtonRef = useRef(null);

  const sortOptions = [
    { id: 'a-z', label: 'Alphabetical (A-Z)' },
    { id: 'z-a', label: 'Alphabetical (Z-A)' },
    { id: 'price-low', label: 'Price (Lowest to Highest)' },
    { id: 'price-high', label: 'Price (Highest to Lowest)' },
    { id: 'recent', label: 'Recently Added' },
  ];

  const toggleFilter = () => {
    if (!showFilter) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 5}px`, 
        left: `${rect.right - 200}px`,
        width: '200px',
        zIndex: 9999,
      });
    }
    setShowFilter(!showFilter);
  };

  const handleSortSelection = (sortId) => {
    setCurrentSort(sortId);
    setShowFilter(false);
    if (onSortChange) {
      onSortChange(sortId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterButtonRef.current && 
        !filterButtonRef.current.contains(event.target) &&
        !event.target.closest('.filter-dropdown-menu')
      ) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  return (
    // ✅ FIX: Apply 'kitchen-theme' class if theme prop is 'kitchen'
    <div className={`category-tabs-wrapper ${theme === 'kitchen' ? 'kitchen-theme' : 'customer-theme'}`}>
      <div className="category-tabs-track">
        <div className="category-tabs-list">
          
          <button
            onClick={() => onSelectCategory(0)}
            className={`category-tab-btn ${selectedCategory === 0 ? 'active' : ''}`}
          >
            All Items
          </button>

          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => onSelectCategory(category.category_id)}
              className={`category-tab-btn ${selectedCategory === category.category_id ? 'active' : ''}`}
            >
              {category.name}
            </button>
          ))}

          <div className="filter-wrapper">
            <button 
              ref={filterButtonRef}
              className={`category-tab-btn filter-trigger ${showFilter ? 'active' : ''}`}
              onClick={toggleFilter}
            >
              <svg 
                width="14" height="14" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" strokeWidth="2" 
                strokeLinecap="round" strokeLinejoin="round"
                style={{ marginRight: '6px' }}
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filter
            </button>
          </div>

          {showFilter && (
            <div 
              className="filter-dropdown-menu" 
              style={dropdownStyle}
            >
              {sortOptions.map((option) => (
                <div 
                  key={option.id} 
                  className={`filter-option ${currentSort === option.id ? 'selected' : ''}`}
                  onClick={() => handleSortSelection(option.id)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;