import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HeaderBar from './components/HeaderBar';
import PromoBanner from './components/PromoBanner';
import CategoryTabs from './components/CategoryTabs';
import FoodGrid from './components/FoodGrid';
import CartPanel from './components/CartPanel';
import ImageModal from './components/ImageModal';
import PaymentModal from './components/PaymentModal';
import ReceiptModal from './components/ReceiptModal';
import NotificationPanel from './components/NotificationPanel';
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiClient';

const primaryColor = { backgroundColor: '#0B3D2E' };
const menuPageGridStyle = {
  display: 'grid',
  // This creates columns of 320px, and 'auto-fit' adds as many as fit.
  gridTemplateColumns: 'repeat(auto-fit, 320px)',
  // THIS IS THE FIX: It centers the grid of cards on the page.
  justifyContent: 'center', 
  gap: '32px',
  marginTop: '32px',
};

function MenuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
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
  
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => { setDeliveryLocation(''); }, [orderType]);
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          apiClient('/items'),
          apiClient('/categories')
        ]);

        if (!itemsResponse.ok) throw new Error('Failed to fetch menu items.');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.');

        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setItems(itemsData);
        setCategories(categoriesData);
        toast.success('Menu loaded successfully.');
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
          toast.error('Failed to load menu or categories.');
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    // Only start polling if the user is authenticated
    if (!isAuthenticated) {
      return;
    }

    const POLLING_INTERVAL = 10000; // 10 seconds

    const fetchNotifications = async () => {
      // Don't fetch if the panel is open, because we're interacting with it
      if (isNotificationPanelOpen) {
        return;
      }

      try {
        const res = await apiClient('/notifications');
        if (!res.ok) {
          console.error('Failed to poll for notifications');
          return;
        }
        
        const data = await res.json(); // This is an object: { notifications: [], unreadCount: 0 }

        // Set the state from the database
        setNotifications(data.notifications || []);
        setUnreadNotificationCount(data.unreadCount || 0);

      } catch (err) {
        if (err.message !== 'Session expired') {
          console.error('Polling error:', err);
        }
      }
    };

    // Run once immediately, then set the interval
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, POLLING_INTERVAL);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);

  }, [isAuthenticated, isNotificationPanelOpen]); 

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const toggleNotificationPanel = () => {
    // Optimistically open the panel immediately
    const panelWillBeOpen = !isNotificationPanelOpen;
    setIsNotificationPanelOpen(panelWillBeOpen);

    // If the panel is opening, mark all as read
    if (panelWillBeOpen) {
      // Optimistically set count to 0
      setUnreadNotificationCount(0);
      
      // Tell the backend to mark them as read
      apiClient('/notifications/mark-read', {
        method: 'PUT'
      }).catch(err => {
        // If it fails, log it but don't bother the user
        console.error("Failed to mark notifications as read:", err);
      });
    }
  };
  const handleSelectCategory = (category) => setSelectedCategory(category);
  const handleAddToCart = (clickedItem) => {
    setCartItems(prevItems => {
      const isItemInCart = prevItems.find(item => item.item_id === clickedItem.item_id);
      if (isItemInCart) {
         toast('Increased item quantity.', { icon: '➕' });
        return prevItems.map(item =>
          item.item_id === clickedItem.item_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
        toast.success('Added to cart!');
      return [...prevItems, { ...clickedItem, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemIdToRemove) => {
    setCartItems(prevItems => prevItems.filter(item => item.item_id !== itemIdToRemove));
     toast('Item removed from cart.', { icon: '🗑️' });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
        toast('Item removed (0 quantity).', { icon: '⚠️' });
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
       toast('Quantity updated.', { icon: '🔄' });
    }
  };

  // --- 1. THIS IS THE FIX ---
  // We no longer pass the total. We just open the modal.
  // We still calculate the total here *for display* in the PaymentModal.
  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to place an order.");
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 || !deliveryLocation) {
      toast.error("Please add items and enter table/room number first.");
      return;
    }
    
    // Calculate total for display
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceCharge = subtotal * 0.10;
    const vatAmount = (subtotal + serviceCharge) * 0.12;
    const grandTotal = subtotal + serviceCharge + vatAmount;

    setPendingOrderTotal(grandTotal); // Set for display
    setIsPaymentModalOpen(true);
    setIsCartOpen(false);
  };
  // --- END OF FIX 1 ---

  // --- 2. THIS IS THE FIX ---
  // `totalAmount` argument is removed.
const handleConfirmPayment = async (paymentInfo) => {
    setIsPaymentModalOpen(false);
      setTimeout(() => {
      setIsPlacingOrder(true);
      toast.loading('Placing your order...');
    }, 0);

    // Prepare order data - backend will calculate total
    const orderData = {
      customer_id: user.id,
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
      // Step 1: Create the order
      const orderResponse = await apiClient('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      const orderResult = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderResult.message || 'Failed to create order.');
      }

      const newOrderId = orderResult.order_id;

      toast.dismiss();
      toast.loading('Creating PayMongo checkout...');

      // Step 2: Create PayMongo payment link
      // ✅ FIX: No body needed - backend gets order total from database
      const paymentResponse = await apiClient(`/payments/${newOrderId}/paymongo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
        // ❌ OLD (WRONG): body: JSON.stringify({ total_amount: xxx, payment_method: xxx })
        // ✅ NEW (CORRECT): No body needed!
      });

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        throw new Error(paymentResult.message || 'Failed to create PayMongo checkout.');
      }

      toast.dismiss();
      toast.success('Redirecting to PayMongo...');

      // Step 3: Redirect to PayMongo checkout
      if (paymentResult.checkout_url) {
        // Save order info before redirect (optional - for return handling)
        localStorage.setItem('pending_order_id', newOrderId);
        
        // Redirect to PayMongo
        window.location.href = paymentResult.checkout_url;
      } else {
        throw new Error("Missing checkout URL from PayMongo.");
      }

    } catch (err) {
      console.error('Order/Payment Error:', err);
      toast.dismiss();
      
      if (err.message !== 'Session expired') {
        toast.error(`Error: ${err.message}`);
      }
      
      setIsPlacingOrder(false);
    }
};

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setReceiptDetails(null);
  };

  // --- (NEW) HANDLER TO DELETE ONE NOTIFICATION ---
  const handleDeleteNotification = async (notificationId) => {
    try {
      const res = await apiClient(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      
      // Optimistically update UI
      setNotifications(prev => 
        prev.filter(n => n.notification_id !== notificationId)
      );
      toast.success('Notification cleared.');
    } catch (err) {
      if (err.message !== 'Session expired') {
        toast.error(err.message);
      }
    }
  };

  // --- (NEW) HANDLER TO CLEAR ALL NOTIFICATIONS ---
  const handleClearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      const res = await apiClient('/notifications/clear-all', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear notifications');
      
      // Optimistically update UI
      setNotifications([]);
      setUnreadNotificationCount(0); // Also reset count
      toast.success('All notifications cleared.');
    } catch (err) {
      if (err.message !== 'Session expired') {
        toast.error(err.message);
      }
    }
  };

  const filteredItems = items
    .filter(item => selectedCategory === 0 || item.category_id === selectedCategory)
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-gray-100 min-h-screen" style={primaryColor}>
      <HeaderBar
        cartCount={cartCount}
        onCartToggle={toggleCart}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        notificationCount={unreadNotificationCount}
        onNotificationToggle={toggleNotificationPanel}
      />

      <main className="container mx-auto px-4">
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
        layoutStyle={menuPageGridStyle} 
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
        totalAmount={pendingOrderTotal} // Pass display total
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

      {/* --- (NEW) PASS PROPS TO PANEL --- */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={toggleNotificationPanel}
        notifications={notifications}
        onDeleteOne={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default MenuPage;