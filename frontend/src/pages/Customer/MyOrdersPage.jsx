import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Star, Package, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import './CustomerTheme.css';
import RatingModal from './components/RatingModal';
import HeaderBar from './components/HeaderBar'; // ✅ Added Header for consistency

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToRate, setItemToRate] = useState(null);
  
  // View Filter State (Default to 'all')
  const [activeTab, setActiveTab] = useState('all'); 

  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchMyOrders = async () => {
      setLoading(true);
      try {
        const response = await apiClient('/orders/my-orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyOrders();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'served': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRateItem = (orderId, item) => {
    setItemToRate({
        item_id: item.item_id,
        item_name: item.item_name,
        order_id: orderId
    });
  };

  const handleRatingSuccess = () => {
    window.location.reload(); 
  };

  // --- LOGIC: Filter Items for "To Rate" and "Rated" tabs ---
  const getItemsByRatingStatus = (isRated) => {
    const relevantItems = [];
    const seenItemIds = new Set(); 

    orders.forEach(order => {
        if (order.status === 'served' || order.status === 'completed') {
            order.items.forEach(item => {
                const hasRating = item.my_rating !== null;
                // Unique items only
                if (hasRating === isRated && !seenItemIds.has(item.item_id)) {
                    seenItemIds.add(item.item_id);
                    relevantItems.push({ ...item, order_date: order.created_at || order.order_date, order_id: order.order_id });
                }
            });
        }
    });
    return relevantItems;
  };

  const itemsToRate = getItemsByRatingStatus(false);
  const itemsRated = getItemsByRatingStatus(true);

  return (
    <div className="customer-page-container min-h-screen bg-[#0B3D2E] pb-20"> 
      
      {/* 1. Header (Reusing Global Header) */}
      <HeaderBar showSearch={false} onCartToggle={() => {}} />

      <main className="container mx-auto px-4 pt-6">
        
        {/* ✅ NEW LAYOUT: Header Section */}
        <div className="max-w-3xl mx-auto mb-8 relative">
            
            {/* Row 1: Back Button (Left) & Title (Center) */}
            <div className="relative flex items-center justify-center mb-6 h-10">
                
                {/* Back Button (Absolute Left) */}
                <button 
                    onClick={() => navigate('/')}
                    className="absolute left-0 flex items-center gap-2 text-[#F9A825] hover:text-[#F9A825] transition-colors font-bold"
                >
                    <ArrowLeft size={24} /> 
                    <span className="hidden sm:inline">Back to Dining</span> {/* Text hides on tiny screens */}
                </button>

                {/* Title (Centered) */}
                <h1 className="text-3xl font-extrabold text-[#F9A825]">My Orders</h1>
            </div>

            {/* Row 2: Filter Tabs (Centered) */}
            <div className="flex justify-center">
                <div className="flex gap-6 border-b border-[#FFF8E1]/20 pb-1 px-4">
                    {['all', 'to-rate', 'rated'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === tab 
                                ? 'text-[#F9A825]' 
                                : 'text-[#FFF8E1]/60 hover:text-[#FFF8E1]'
                            }`}
                        >
                            {tab.replace('-', ' ')}
                            
                            {/* Notification Badge for 'To Rate' */}
                            {tab === 'to-rate' && itemsToRate.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                                    {itemsToRate.length}
                                </span>
                            )}

                            {/* Active Line */}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F9A825] rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="max-w-3xl mx-auto space-y-6">
        
        {loading ? (
          <div className="text-[#F9A825] text-center py-10">Loading orders...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-400">{error}</div>
        ) : (
            <>
                {/* VIEW 1: ALL ORDERS (History Cards) */}
                {activeTab === 'all' && (
                    orders.length === 0 ? (
                        <div className="text-center py-12 bg-[#FFF8E1]/5 rounded-2xl border border-[#FFF8E1]/10">
                            <Package size={48} className="mx-auto mb-3 text-[#FFF8E1]/20"/>
                            <p className="text-[#FFF8E1] text-lg mb-4">No orders yet.</p>
                            <button onClick={() => navigate('/')} className="bg-[#F9A825] text-[#0B3D2E] px-6 py-2 rounded-full font-bold hover:bg-white transition-colors">
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            // ✅ CARD THEME: Cream Background + Green Text + Gold Accent
                            <div key={order.order_id} className="bg-[#FFF8E1] rounded-2xl p-6 shadow-lg border-l-8 border-[#F9A825]">
                                
                                {/* Order Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[#0B3D2E]/10 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-bold text-[#0B3D2E]">Order #{order.order_id}</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={14}/> {new Date(order.created_at || order.order_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><MapPin size={14}/> {order.delivery_location || 'Dine-in'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:mt-0 text-right">
                                        <p className="text-2xl font-bold text-[#F9A825]">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#0B3D2E]/10 h-8 w-8 rounded-lg flex items-center justify-center text-[#0B3D2E] font-bold text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#0B3D2E]">{item.item_name}</div>
                                                    {item.instructions && <div className="text-xs text-gray-500 italic">"{item.instructions}"</div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* VIEW 2 & 3: ITEMS GRID (To Rate / Rated) */}
                {(activeTab === 'to-rate' || activeTab === 'rated') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(activeTab === 'to-rate' ? itemsToRate : itemsRated).length === 0 ? (
                             <div className="col-span-full text-center py-20 text-[#FFF8E1]/50">
                                {activeTab === 'to-rate' ? "You're all caught up! Nothing to rate." : "You haven't rated anything yet."}
                             </div>
                        ) : (
                            (activeTab === 'to-rate' ? itemsToRate : itemsRated).map((item) => (
                                <div key={item.item_id} className="bg-[#FFF8E1] p-6 rounded-2xl shadow-lg border-l-4 border-[#F9A825] flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-[#0B3D2E] text-lg">{item.item_name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">Ordered {new Date(item.order_date).toLocaleDateString()}</p>
                                        
                                        {/* Show Star Rating if Rated */}
                                        {activeTab === 'rated' && (
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < item.my_rating ? "#F9A825" : "#eee"} color={i < item.my_rating ? "#F9A825" : "#ddd"} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleRateItem(item.order_id, item)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                                            activeTab === 'to-rate' 
                                            ? 'bg-[#0B3D2E] text-[#FFF8E1] hover:bg-[#082a20]' 
                                            : 'border border-gray-300 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {activeTab === 'to-rate' ? 'Rate Now' : 'Edit'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </>
        )}
        </div>
      </main>

      <RatingModal 
        isOpen={!!itemToRate} 
        itemToRate={itemToRate}
        onClose={() => setItemToRate(null)}
        onSuccess={handleRatingSuccess}
      />
    </div>
  );
};

export default MyOrdersPage;