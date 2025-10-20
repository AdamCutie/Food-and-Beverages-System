import React from 'react';

import { useState, useEffect } from 'react';
import HeaderBar from '../components/HeaderBar';
import PromoBanner from '../components/PromoBanner';
import CategoryTabs from '../components/CategoryTabs';
import FoodGrid from '../components/FoodGrid';
import CartPanel from '../components/CartPanel';

function MenuPage() {
  const [items, setItems] = useState([]); // Holds ALL items from the backend
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  
  // --- NEW STATE FOR FILTERING ---
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // ... (fetchItems function is unchanged)
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/items');
        if (!response.ok) {
          throw new Error('Failed to fetch data from the server.');
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, []);

  // --- DERIVE CATEGORIES AND FILTERED ITEMS ---
  // 1. Get a unique list of categories from the items
  const categories = ['All', ...new Set(items.map(item => item.category))];

  // 2. Filter the items based on the selected category
  const filteredItems = items.filter(item => 
    selectedCategory === 'All' || item.category === selectedCategory
  );

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };
  
  // --- (handleAddToCart, handleUpdateQuantity, handlePlaceOrder are all unchanged) ---
  const handleAddToCart = (clickedItem) => {
    setCartItems((prevItems) => {
      const isItemInCart = prevItems.find((item) => item.item_id === clickedItem.item_id);
      if (isItemInCart) {
        return prevItems.map((item) =>
          item.item_id === clickedItem.item_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...clickedItem, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prevItems) => prevItems.filter((item) => item.item_id !== itemId));
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    const totalPrice = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const orderData = {
      customer_id: 1, 
      total_price: totalPrice,
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order.');
      }
      alert('Order placed successfully!');
      setCartItems([]);
    } catch (err) {
      console.error('Error placing order:', err);
      alert(`Error: ${err.message}`);
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen">
      <HeaderBar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <PromoBanner />
            {/* --- PASS NEW PROPS TO CategoryTabs --- */}
            <CategoryTabs 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
            {error && <p className="text-red-500">Error: {error}</p>}
            {/* --- PASS filteredItems (INSTEAD OF items) TO FoodGrid --- */}
            <FoodGrid items={filteredItems} onAddToCart={handleAddToCart} />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <CartPanel 
              cartItems={cartItems} 
              onUpdateQuantity={handleUpdateQuantity} 
              onPlaceOrder={handlePlaceOrder} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default MenuPage;