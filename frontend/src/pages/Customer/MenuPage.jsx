import React from 'react';
import { useState, useEffect } from 'react';
// --- 1. IMPORT useAuth and useNavigate ---
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../../components/HeaderBar';
import PromoBanner from '../../components/PromoBanner';
import CategoryTabs from '../../components/CategoryTabs';
import FoodGrid from '../../components/FoodGrid';
import CartPanel from '../../components/CartPanel';
import ImageModal from '../../components/ImageModal';
import PaymentModal from '../../components/PaymentModal'; 
import ReceiptModal from '../../components/ReceiptModal'; 
import toast from 'react-hot-toast';

const primaryColor = { backgroundColor: '#0B3D2E' };

function MenuPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [orderType, setOrderType] = useState('Dine-in');
  const [instructions, setInstructions] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0); 
  const [receiptDetails, setReceiptDetails] = useState(null); 

  // --- 2. GET AUTH STATE AND NAVIGATION ---
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();


  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const categories = ['All', ...new Set(items.map(item => item.category))];

  useEffect(() => { setDeliveryLocation(''); }, [orderType]);
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

  const handleSearchChange = (event) => { setSearchTerm(event.target.value); };
  const toggleCart = () => { setIsCartOpen(!isCartOpen); };
  const handleSelectCategory = (category) => { setSelectedCategory(category); };
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
  const handleRemoveItem = (itemIdToRemove) => { 
    setCartItems(prevItems => prevItems.filter(item => item.item_id !== itemIdToRemove));
   };
  const handleUpdateQuantity = (itemId, newQuantity) => { 
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

  // --- 3. UPDATE: This function now checks for login ---
  const handleProceedToPayment = (grandTotal) => {
    // --- CHECK 1: Check for authentication ---
    if (!isAuthenticated) {
      toast.error("You must be logged in to place an order.");
      navigate('/login'); // Redirect to login page
      return;
    }

    // --- CHECK 2: Original checks ---
    if (cartItems.length === 0 || !deliveryLocation) {
      toast.error("Please add items and enter table/room number first.");
      return;
    }
    
    setPendingOrderTotal(grandTotal); 
    setIsPaymentModalOpen(true);     
    setIsCartOpen(false);            
  };

  // --- 4. UPDATE: This function now sends user ID and Token ---
  const handleConfirmPayment = async (totalAmount, paymentInfo) => {
    setIsPaymentModalOpen(false); 
    setIsPlacingOrder(true);      
    toast.loading('Placing your order...');

    const orderData = {
      // --- FIX: Use the logged-in user's ID ---
      customer_id: user.id, 
      total_price: totalAmount, 
      order_type: orderType,
      instructions: instructions,
      delivery_location: deliveryLocation,
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      // Step 1: Create Order
      const orderResponse = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // --- FIX: Add the Authorization header ---
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });
      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderResult.message || 'Failed to create order.');

      const newOrderId = orderResult.order_id;
      const orderTotal = orderResult.total_amount; 
      const orderDate = orderResult.order_date || new Date().toISOString(); 
      toast.dismiss();
      toast.loading('Simulating payment confirmation...');

      // Step 2: Simulate Payment
      const paymentResponse = await fetch(`http://localhost:3000/api/payments/${newOrderId}/simulate`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          // --- FIX: Add the Authorization header ---
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ total_amount: orderTotal }),
      });
      const paymentResult = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentResult.message || 'Failed to simulate payment.');

      setReceiptDetails({
        order_id: newOrderId,
        order_date: orderDate,
        order_type: orderType,
        delivery_location: deliveryLocation,
        items: [...cartItems], 
        total_amount: orderTotal,
        payment_method: paymentInfo.selectedPaymentMethod 
      });
      setIsReceiptModalOpen(true); 

      setCartItems([]);
      setInstructions('');
      setDeliveryLocation('');
      
      toast.dismiss();

    } catch (err) {
      console.error('Order/Payment Error:', err);
      toast.dismiss();
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsPlacingOrder(false); 
    }
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setReceiptDetails(null); 
  };

   const filteredItems = items
    .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));


  return (
    <div className="bg-gray-100 min-h-screen" style={primaryColor}>
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

      <CartPanel
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={handleProceedToPayment}
        isOpen={isCartOpen}
        onClose={toggleCart}
        orderType={orderType}
        setOrderType={setOrderType}
        instructions={instructions}
        setInstructions={setInstructions}
        onRemoveItem={handleRemoveItem}
        deliveryLocation={deliveryLocation}
        setDeliveryLocation={setDeliveryLocation}
        isPlacingOrder={isPlacingOrder} 
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)} 
        totalAmount={pendingOrderTotal}
        onConfirmPayment={handleConfirmPayment} 
        deliveryLocation={deliveryLocation}
        orderType={orderType}
        cartItems={cartItems} 
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt} 
        orderDetails={receiptDetails} 
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default MenuPage;