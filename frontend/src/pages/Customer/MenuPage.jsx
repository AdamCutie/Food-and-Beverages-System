import React, { useState, useEffect } from 'react';
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

  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const categories = ['All', ...new Set(items.map(item => item.category))];

  useEffect(() => { setDeliveryLocation(''); }, [orderType]);
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/items');
        if (!response.ok) throw new Error('Failed to fetch data from the server.');
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching items:", err);
      }
    };
    fetchItems();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const handleSelectCategory = (category) => setSelectedCategory(category);

  const handleAddToCart = (clickedItem) => {
    setCartItems(prevItems => {
      const isItemInCart = prevItems.find(item => item.item_id === clickedItem.item_id);
      if (isItemInCart) {
        return prevItems.map(item =>
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
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // --- Proceed to payment ---
  const handleProceedToPayment = (grandTotal) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to place an order.");
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 || !deliveryLocation) {
      toast.error("Please add items and enter table/room number first.");
      return;
    }
    setPendingOrderTotal(grandTotal);
    setIsPaymentModalOpen(true);
    setIsCartOpen(false);
  };

  // --- Confirm payment: Create order + PayMongo checkout ---
  const handleConfirmPayment = async (totalAmount, paymentInfo) => {
    setIsPaymentModalOpen(false);
    setIsPlacingOrder(true);
    toast.loading('Placing your order...');

    const orderData = {
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
      // Step 1️⃣ Create the order
      const orderResponse = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderResult.message || 'Failed to create order.');

      const newOrderId = orderResult.order_id;
      const orderTotal = orderResult.total_amount;

      toast.dismiss();
      toast.loading('Redirecting to PayMongo checkout...');

      // Step 2️⃣ Create PayMongo Checkout Session
      const paymentResponse = await fetch(`http://localhost:3000/api/payments/${newOrderId}/paymongo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          total_amount: orderTotal,
          payment_method: paymentInfo.selectedPaymentMethod
        })
      });

      const paymentResult = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentResult.message || 'Failed to create checkout.');

      // Step 3️⃣ Redirect to PayMongo Checkout Page
      if (paymentResult.checkoutUrl) {
        window.location.href = paymentResult.checkoutUrl;
      } else {
        throw new Error("Missing checkout URL from PayMongo response.");
      }
    } catch (err) {
      console.error('Order/Payment Error:', err);
      toast.dismiss();
      toast.error(`Error: ${err.message}`);
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
