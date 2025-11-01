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
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiClient'; // This should be here from our previous step

const primaryColor = { backgroundColor: '#0B3D2E' };

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
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0); // We still use this for display
  const [receiptDetails, setReceiptDetails] = useState(null);

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

      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
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
    setIsPlacingOrder(true);
    toast.loading('Placing your order...');

    const orderData = {
      customer_id: user.id,
      // 'total_price' is removed. Backend will calculate.
      order_type: orderType,
      instructions: instructions,
      delivery_location: deliveryLocation,
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    // --- END OF FIX 2 ---

    try {
      // Step 1: Create the order. Backend calculates total.
      const orderResponse = await apiClient('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderResult.message || 'Failed to create order.');

      const newOrderId = orderResult.order_id;
      // --- 3. THIS IS THE FIX ---
      // We use the SECURE total returned from the backend for the payment.
      const orderTotal = orderResult.total_amount;
      // --- END OF FIX 3 ---

      toast.dismiss();
      toast.loading('Redirecting to PayMongo checkout...');

      // Step 2: Create PayMongo Checkout Session
      const paymentResponse = await apiClient(`/payments/${newOrderId}/paymongo`, {
        method: 'POST',
        body: JSON.stringify({
          total_amount: orderTotal, // Pass the secure total
          payment_method: paymentInfo.selectedPaymentMethod
        })
      });

      const paymentResult = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentResult.message || 'Failed to create checkout.');

      // Step 3: Redirect to PayMongo Checkout Page
      if (paymentResult.checkoutUrl) {
        window.location.href = paymentResult.checkoutUrl;
      } else {
        throw new Error("Missing checkout URL from PayMongo response.");
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

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default MenuPage;