import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InternalNavBar from './components/InternalNavBar';
import CategoryTabs from '../Customer/components/CategoryTabs';
import FoodGrid from '../Customer/components/FoodGrid';
import ImageModal from '../Customer/components/ImageModal';
import PosCart from './components/PosCart'; 
import toast from 'react-hot-toast';
import apiClient from '../../utils/apiClient';
import PosPaymentModal from './components/PosPaymentModal';
import PosReceiptModal from './components/PosReceiptModal'; // ✅ IMPORT RECEIPT MODAL
import { Search } from 'lucide-react';
import './KitchenTheme.css'; // ✅ IMPORT THEME

function PosPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]); 
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [sortOption, setSortOption] = useState('a-z'); 
  
  // POS State (Customer Name is handled inside PosCart, passed up via orderMeta)
  const [deliveryLocation, setDeliveryLocation] = useState(''); 
  
  // Payment & Receipt State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null); 
  
  // ✅ New Receipt State
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { user, token } = useAuth();

  const posPageGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 320px)',
    justifyContent: 'center', 
    gap: '24px',
    marginTop: '32px',
  };
  
  // --- 1. FETCH DATA (Items, Categories, Tables) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsResponse, categoriesResponse, tablesResponse] = await Promise.all([
          apiClient('/items'),
          apiClient('/categories'),
          apiClient('/tables')
        ]);

        if (!itemsResponse.ok) throw new Error('Failed to fetch menu items.');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.');
        
        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        // Handle tables gracefully (if API fails or returns empty)
        const tablesData = tablesResponse.ok ? await tablesResponse.json() : [];

        setItems(itemsData);
        setCategories(categoriesData);
        setTables(tablesData); 

      } catch (err) {
        if (err.message !== 'Session expired') {
          setError(err.message);
        }
      }
    };
    fetchData();
  }, [token]);

  // --- 2. CART HANDLERS ---
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
      // Initialize new items with empty instructions string
      return [...prevItems, { ...clickedItem, quantity: 1, instructions: '' }];
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

  const handleUpdateItemInstructions = (itemId, newInstructions) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.item_id === itemId ? { ...item, instructions: newInstructions } : item
      )
    );
  };

  // --- 3. PAYMENT FLOW ---
  const handleOpenPaymentModal = (orderMeta) => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the cart.");
      return;
    }
    
    // Require name for Take Out
    if (!orderMeta.customerName && orderMeta.serviceMode === 'Take Out') {
         toast.error("Please enter a customer name.");
         return;
    }

    setPendingOrderData(orderMeta);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmCashOrder = async (paymentDetails) => {
    setIsPlacingOrder(true);
    toast.loading('Submitting order...');
    
    const orderData = {
      staff_id: user.id, 
      order_type: 'Walk-in',
      
      // Data from Cart (via pendingOrderData)
      customer_name: pendingOrderData.customerName || 'Guest',
      
      // Logic: If table selected, use that. Else use "Counter (Mode)"
      delivery_location: pendingOrderData.tableNumber 
        ? `Table ${pendingOrderData.tableNumber}` 
        : `Counter (${pendingOrderData.serviceMode})`,
      
      table_id: pendingOrderData.tableId || null,

      payment_method: "Cash",
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        instructions: item.instructions 
      })),
      amount_tendered: paymentDetails.amount_tendered,
      change_amount: paymentDetails.change_amount,
    };
    
    try {
      const response = await apiClient('/orders/pos', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to submit order.');

      toast.dismiss();
      // Toast success is optional since we show the receipt modal now
      // toast.success(`Order #${result.order_id} submitted!`);
      
      // ✅ 4. SHOW RECEIPT
      // Combine backend result (financials) with frontend items (names)
      const finalReceipt = {
          ...result.order,
          items: cartItems 
      };
      setReceiptData(finalReceipt);
      setIsReceiptOpen(true);
      
      // Reset Cart UI
      setIsPaymentModalOpen(false);
      setCartItems([]);
      setDeliveryLocation(''); 
      setPendingOrderData(null);

    } catch (err) {
        toast.dismiss();
        if (err.message !== 'Session expired') {
            toast.error(`Error: ${err.message}`);
        }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // --- SORTING & FILTERING ---
  const getProcessedItems = () => {
    let result = items
      .filter(item => selectedCategory === 0 || item.category_id === selectedCategory)
      .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (sortOption) {
      case 'a-z': result.sort((a, b) => a.item_name.localeCompare(b.item_name)); break;
      case 'z-a': result.sort((a, b) => b.item_name.localeCompare(a.item_name)); break;
      case 'price-low': result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case 'price-high': result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case 'recent': result.sort((a, b) => b.item_id - a.item_id); break;
      default: break;
    }
    return result;
  };

  const finalItems = getProcessedItems();

  // --- RENDER ---
  return (
    // Force full viewport height, no scroll on body
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#523a2e]">
      
      {/* 1. Navbar */}
      <div className="flex-none">
        <InternalNavBar />
      </div>

      {/* 2. Main Layout Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: Menu Grid (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-6 pos-main-content">
            <div className="max-w-7xl mx-auto"> 
                
                {/* Search Bar */}
                <div className="top-0 z-10 pb-4 pt-2 bg-inherit">
                    <div className="relative w-full max-w-lg mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400" size={20} />
                        </div>
                        <input
                        type="text"
                        placeholder="Search for food..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F9A825] shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                    theme="kitchen"
                />

                <FoodGrid
                    items={finalItems} 
                    onAddToCart={handleAddToCart}
                    onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
                    layoutStyle={posPageGridStyle}
                    theme="kitchen"
                />
            </div>
        </main>

        {/* RIGHT: Cart (Fixed Width) */}
        <aside className="w-[400px] flex-none pos-cart-sidebar z-20 shadow-2xl">
          <PosCart
            cartItems={cartItems}
            availableTables={tables} // Pass tables to cart
            onUpdateQuantity={handleUpdateQuantity}
            onPlaceOrder={handleOpenPaymentModal}
            onRemoveItem={handleRemoveItem}
            onUpdateItemInstructions={handleUpdateItemInstructions}
            deliveryLocation={deliveryLocation} 
            setDeliveryLocation={setDeliveryLocation}
          />
        </aside>
      </div>

      {/* Payment Modal */}
      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalDue={pendingOrderData?.totalAmount || 0}
        onConfirmPayment={handleConfirmCashOrder}
      />

      {/* ✅ Receipt Modal */}
      <PosReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={receiptData}
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default PosPage;