import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext'; // ✅ Import Context
import HeaderBar from './components/HeaderBar';
import PromoBanner from './components/PromoBanner';
import CategoryTabs from './components/CategoryTabs';
import FoodGrid from './components/FoodGrid';
import CartPanel from './components/CartPanel';
import ImageModal from './components/ImageModal';
import NotificationPanel from './components/NotificationPanel';
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import './CustomerTheme.css';

function MenuPage() {
  // --- Data State ---
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // --- UI State ---
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('a-z');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // --- Hooks ---
  const { addToCart, cartCount } = useCart();
  
  // ✅ OPTIMIZATION: Use Global Notification Context (No local polling!)
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();

  // 1. Fetch Menu Data (Parallel - Keep this, it is good!)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          apiClient('/items'),
          apiClient('/categories')
        ]);

        if (!itemsResponse.ok) throw new Error('Failed to fetch menu items.');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.');

        setItems(await itemsResponse.json());
        setCategories(await categoriesResponse.json());
      } catch (err) {
        console.error("Error fetching data:", err);
        // Only toast if it's not a strict rate limit (handled globally now)
        if (err.message !== "Rate limit reached") {
             toast.error('Failed to load menu.');
        }
      }
    };
    fetchItems();
  }, []);

  // --- Handlers ---
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const handleSelectCategory = (category) => setSelectedCategory(category);
  
  const toggleNotificationPanel = () => {
    const willOpen = !isNotificationPanelOpen;
    setIsNotificationPanelOpen(willOpen);
    if (willOpen) {
      markAllAsRead(); // ✅ Use Context function
    }
  };

  // ✅ OPTIMIZATION: Memoize Filtering & Sorting
  // This prevents the menu from re-sorting every time the notification panel opens.
  const finalItems = useMemo(() => {
    let result = items
      .filter(item => selectedCategory === 0 || item.category_id === selectedCategory)
      .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (sortOption) {
      case 'a-z': result.sort((a, b) => a.item_name.localeCompare(b.item_name)); break;
      case 'z-a': result.sort((a, b) => b.item_name.localeCompare(a.item_name)); break;
      case 'price-low': result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case 'price-high': result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case 'rating-high': result.sort((a, b) => {
            const ratingA = parseFloat(a.average_rating || 0);
            const ratingB = parseFloat(b.average_rating || 0);
            if (ratingB !== ratingA) return ratingB - ratingA;
            return (b.total_reviews || 0) - (a.total_reviews || 0);
        });
        break;
      case 'recent': result.sort((a, b) => b.item_id - a.item_id); break;
      default: break;
    }
    return result;
  }, [items, selectedCategory, searchTerm, sortOption]); // Dependencies

  return (
    <div className="customer-page-container">
      {/* 1. Header */}
      <HeaderBar
        cartCount={cartCount}
        onCartToggle={toggleCart}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        notificationCount={unreadCount} // ✅ Use Context Value
        onNotificationToggle={toggleNotificationPanel}
      />

      <main className="container mx-auto px-4">
        {/* 2. Banner & Tabs */}
        <PromoBanner />
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />
        
        {/* 3. Food Grid */}
        <FoodGrid
          items={finalItems} // ✅ Use Memoized Items
          onAddToCart={(item) => {
              addToCart(item);
              toast.success('Added to cart!');
          }}
          onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
        />
      </main>

      {/* 4. Panels & Modals */}
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={toggleCart} 
      />

      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={toggleNotificationPanel}
        notifications={notifications} // ✅ Pass Context Data
        onDeleteOne={deleteNotification}
        onClearAll={clearAllNotifications}
      />

      <ImageModal 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
}

export default MenuPage;