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
import { Search } from 'lucide-react';

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
  
  // POS State
  const [deliveryLocation, setDeliveryLocation] = useState(''); 
  // REMOVED: const [instructions, setInstructions] = useState(''); // <-- General instructions gone
  
  // Payment & Mode State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null); 

  const { user, token } = useAuth();

  const posPageGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 320px)',
    justifyContent: 'center', 
    gap: '24px',
    marginTop: '32px',
  };
  
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

  // --- Cart Handlers ---
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

  // ✅ NEW HANDLER: Update instructions for a specific item
  const handleUpdateItemInstructions = (itemId, newInstructions) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.item_id === itemId ? { ...item, instructions: newInstructions } : item
      )
    );
  };

  // --- 3. HANDLE OPEN PAYMENT ---
  const handleOpenPaymentModal = (orderMeta) => {
    if (cartItems.length === 0) {
      toast.error("Please add items to the cart.");
      return;
    }
    
    if (!orderMeta.customerName && orderMeta.serviceMode === 'Take Out') {
         toast.error("Please enter a customer name.");
         return;
    }

    setPendingOrderData(orderMeta);
    setIsPaymentModalOpen(true);
  };

  // --- 4. SUBMIT TO BACKEND ---
  const handleConfirmCashOrder = async (paymentDetails) => {
    setIsPlacingOrder(true);
    toast.loading('Submitting order...');
    
    const orderData = {
      staff_id: user.id, 
      order_type: 'Walk-in',
      customer_name: pendingOrderData.customerName || 'Guest',
      delivery_location: pendingOrderData.tableNumber 
        ? `Table ${pendingOrderData.tableNumber}` 
        : `Counter (${pendingOrderData.serviceMode})`,
      
      table_id: pendingOrderData.tableId || null,

      // REMOVED: instructions: instructions, (General instructions gone)
      
      payment_method: "Cash",
      // The backend already knows how to read 'instructions' inside the items array
      items: cartItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        instructions: item.instructions // Pass per-item instructions
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
      toast.success(`Order #${result.order_id} submitted!`);
      
      // Reset
      setIsPaymentModalOpen(false);
      setCartItems([]);
      // setInstructions(''); // No longer needed
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

  // --- Sorting & Filtering ---
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#523a2e]">
      <div className="flex-none">
      <InternalNavBar />
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        
        <main className="flex-1 overflow-y-auto p-6 pos-main-content">
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
        </main>

        <aside className="w-[400px] flex-none pos-cart-sidebar z-20 shadow-2xl">
          <PosCart
            cartItems={cartItems}
            availableTables={tables}
            onUpdateQuantity={handleUpdateQuantity}
            onPlaceOrder={handleOpenPaymentModal}
            // Removed general instructions props
            onRemoveItem={handleRemoveItem}
            onUpdateItemInstructions={handleUpdateItemInstructions} // ✅ Pass new handler
            deliveryLocation={deliveryLocation} 
            setDeliveryLocation={setDeliveryLocation}
          />
        </aside>
      </div>

      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalDue={pendingOrderData?.totalAmount || 0}
        onConfirmPayment={handleConfirmCashOrder}
      />

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default PosPage;