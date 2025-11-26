import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InternalNavBar from './components/InternalNavBar';
import CategoryTabs from '../Customer/components/CategoryTabs';
import FoodGrid from '../Customer/components/FoodGrid';
import ImageModal from '../Customer/components/ImageModal';
import PosCart from './components/PosCart'; // --- IMPORT OUR NEW CART ---
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import PosPaymentModal from './components/PosPaymentModal';
import { Search } from 'lucide-react';

function PosPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // POS-specific state
  const [orderType, setOrderType] = useState('Walk-in');
  const [instructions, setInstructions] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Counter');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [totalDue, setTotalDue] = useState(0);

  const { user, token } = useAuth();

  const posPageGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, 320px)',
  justifyContent: 'center', // This centers the card(s)
  gap: '24px',
  marginTop: '32px',
};
  
  // Fetch Menu Items and Categories
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
        if (err.message !== 'Session expired') {
          setError(err.message);
        }
      }
    };
    fetchItems();
  }, [token]);

  // --- All Cart Handlers ---
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

  // This is the new function for the POS
  const handleCashOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the cart.");
      return;
    }
    
    setIsPlacingOrder(true);
    toast.loading('Submitting order...');
    
    const orderData = {
      staff_id: user.id, 
      order_type: orderType,
      instructions: instructions,
      delivery_location: deliveryLocation,
      payment_method: "Cash", // Hardcoded for POS
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        // Include item-specific instructions if you have them
        // instructions: item.instructions || '' 
      }))
    };
    
    try {
      // --- REMOVED PLACEHOLDER, ADDED API CALL ---
      const response = await apiClient('/orders/pos', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit order.');
      }

      toast.dismiss();
      toast.success(`Order #${result.order_id} submitted to kitchen!`);
      
      // Reset the cart
      setCartItems([]);
      setInstructions('');
      setOrderType('Walk-in');
      setDeliveryLocation('Counter');
      
      // We can open a receipt modal here in the future
      // setReceiptDetails(result); 
      // setIsReceiptModalOpen(true);

    } catch (err) {
      toast.dismiss();
      if (err.message !== 'Session expired') {
        toast.error(`Error: ${err.message}`);
      }
    } finally {
      setIsPlacingOrder(false);
    }
    // --- END OF UPDATE ---
  };

const handleOpenPaymentModal = (grandTotal) => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the cart.");
      return;
    }
    if (!deliveryLocation) {
      toast.error("Please enter a customer name or note.");
      return;
    }

    // --- NEW LOGIC ---
    if (orderType === 'Phone Order') {
        // Skip the modal, submit directly as "Pay Later"
        handleConfirmCashOrder({
            amount_tendered: 0,
            change_amount: 0,
            isPayLater: true // Flag to tell the submit function
        });
    } else {
        // Normal Walk-in Flow -> Open Modal
        setTotalDue(grandTotal);
        setIsPaymentModalOpen(true);
    }
  };

  // --- 4. THIS IS THE FINAL API CALL (RENAMED) ---
  const handleConfirmCashOrder = async (paymentData) => {
    setIsPlacingOrder(true);
    toast.loading('Submitting order...');
    
    const orderData = {
      // ... existing fields ...
      staff_id: user.id, 
      order_type: orderType,
      instructions: instructions,
      delivery_location: deliveryLocation,
      
      // --- UPDATED PAYMENT METHOD ---
      payment_method: paymentData.isPayLater ? "Pay Later" : "Cash", 
      
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
      })),
      
      amount_tendered: paymentData.amount_tendered,
      change_amount: paymentData.change_amount,
    };
    
    try {
      const response = await apiClient('/orders/pos', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      // ... (Rest of the function stays the same: success message, reset state, etc.)
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to submit order.');

      toast.dismiss();
      toast.success(`Order #${result.order_id} submitted to kitchen!`);
      
      setIsPaymentModalOpen(false);
      setCartItems([]);
      setInstructions('');
      setOrderType('Walk-in');
      setDeliveryLocation('Counter');
      setTotalDue(0);

    } catch (err) {
        // ... error handling ...
        toast.dismiss();
        if (err.message !== 'Session expired') {
            toast.error(`Error: ${err.message}`);
        }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ... (rest of the file is the same)
  const filteredItems = items
    .filter(item => selectedCategory === 0 || item.category_id === selectedCategory)
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#523a2eff' }}>
      <InternalNavBar />
      <div className="flex flex-1 overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-8">

          <div className="relative w-full max-w-lg mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search for food..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F9A825]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            theme="kitchen"
          />
          <FoodGrid
       items={filteredItems}
       onAddToCart={handleAddToCart}
       onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
       layoutStyle={posPageGridStyle}
       theme="kitchen"
        />
        </main>

 
        <aside className="w-96 border-l border-gray-200 overflow-y-auto h-full">
          <PosCart
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onPlaceOrder={handleOpenPaymentModal}
            orderType={orderType}
            setOrderType={setOrderType}
            instructions={instructions}
            setInstructions={setInstructions}
            onRemoveItem={handleRemoveItem}
            deliveryLocation={deliveryLocation}
            setDeliveryLocation={setDeliveryLocation}
            // isPlacingOrder is no longer needed here
          />
        </aside>
      </div>

      {/* --- ADD THE MODAL TO THE PAGE --- */}
      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalDue={totalDue}
        onConfirmPayment={handleConfirmCashOrder}
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default PosPage;