import React from 'react';
import { useState, useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';
import PromoBanner from '../../components/PromoBanner';
import CategoryTabs from '../../components/CategoryTabs';
import FoodGrid from '../../components/FoodGrid';
import CartPanel from '../../components/CartPanel';
import ImageModal from '../../components/ImageModal';

function MenuPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // --- NEW STATES FOR CART ---
  const [orderType, setOrderType] = useState('Dine-in'); 
  const [instructions, setInstructions] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const categories = ['All', ...new Set(items.map(item => item.category))];

  useEffect(() => {
    setDeliveryLocation('');
  }, [orderType]);

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

  // --- NEW FUNCTION TO REMOVE ITEM ---
  const handleRemoveItem = (itemIdToRemove) => {
    setCartItems(prevItems => prevItems.filter(item => item.item_id !== itemIdToRemove));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    // UPDATED to use handleRemoveItem
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // --- UPDATED to include orderType and instructions ---
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !deliveryLocation) {
      alert("Your cart is empty!");
      return;
    }
    const totalPrice = cartItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
    const orderData = {
      customer_id: 1,
      total_price: totalPrice,
      order_type: orderType, // <-- ADDED
      instructions: instructions, // <-- ADDED
      delivery_location: deliveryLocation,
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
      setInstructions(''); // Clear instructions after order
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
      <main className="container mx-auto px-4 py-8">
        <div>
          <PromoBanner />
          <CategoryTabs 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
          <FoodGrid 
            items={filteredItems} 
            onAddToCart={handleAddToCart}
            onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
          />
        </div>
      </main>

      {/* --- PASS ALL NEW PROPS TO CARTPANEL --- */}
      <CartPanel 
        cartItems={cartItems} 
        onUpdateQuantity={handleUpdateQuantity} 
        onPlaceOrder={handlePlaceOrder}
        isOpen={isCartOpen}
        onClose={toggleCart}
        orderType={orderType}
        setOrderType={setOrderType}
        instructions={instructions}
        setInstructions={setInstructions}
        onRemoveItem={handleRemoveItem}
        deliveryLocation={deliveryLocation}
        setDeliveryLocation={setDeliveryLocation}
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default MenuPage;