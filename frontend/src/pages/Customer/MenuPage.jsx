import React from 'react';
import { useState, useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';
import PromoBanner from '../../components/PromoBanner';
import CategoryTabs from '../../components/CategoryTabs';
import FoodGrid from '../../components/FoodGrid';
import CartPanel from '../../components/CartPanel';

function MenuPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const categories = ['All', ...new Set(items.map(item => item.category))];

  useEffect(() => {
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };



  const filteredItems = items
    .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
    // --- THIS IS THE LINE THAT WAS FIXED ---
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

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
      <HeaderBar 
        cartCount={cartCount} 
        onCartToggle={toggleCart}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      {/* The 'container' class will handle the centering */}
      <main className="container mx-auto px-4 py-8">
        <div> {/* This div wraps the main content */}
          <PromoBanner />
          <CategoryTabs 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
          <FoodGrid items={filteredItems} onAddToCart={handleAddToCart} />
        </div>
      </main>

      <CartPanel 
        cartItems={cartItems} 
        onUpdateQuantity={handleUpdateQuantity} 
        onPlaceOrder={handlePlaceOrder}
        isOpen={isCartOpen}
        onClose={toggleCart}
      />
    </div>
  );
}

export default MenuPage;