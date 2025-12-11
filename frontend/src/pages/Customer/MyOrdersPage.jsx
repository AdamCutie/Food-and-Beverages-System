import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Star, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import './CustomerTheme.css';
import RatingModal from './components/RatingModal';

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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
        if (order.status === 'served') {
            order.items.forEach(item => {
                const hasRating = item.my_rating !== null;
                // Unique items only
                if (hasRating === isRated && !seenItemIds.has(item.item_id)) {
                    seenItemIds.add(item.item_id);
                    relevantItems.push({ ...item, order_date: order.order_date, order_id: order.order_id });
                }
            });
        }
    });
    return relevantItems;
  };

  const itemsToRate = getItemsByRatingStatus(false);
  const itemsRated = getItemsByRatingStatus(true);

  return (
    <div className="min-h-screen bg-[#fdf8f5] pb-20"> 
      
      {/* ✅ NEW NAVBAR LAYOUT */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 relative flex items-center justify-between">
            
            {/* 1. LEFT: Title & Back Button */}
            <div className="flex items-center gap-3 z-10">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 rounded-full hover:bg-gray-100 text-[#3C2A21] transition-colors"
                >
                    <ArrowLeft size={22} />
                </button>
                <h1 className="text-lg font-bold text-[#3C2A21]">My Orders</h1>
            </div>

            {/* 2. CENTER: Tabs (Absolute Centered) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full flex items-center gap-8">
                {['all', 'to-rate', 'rated'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative h-full flex items-center px-2 text-sm font-bold capitalize transition-colors ${
                            activeTab === tab ? 'text-[#F9A825]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {/* Tab Text */}
                        {tab.replace('-', ' ')}
                        
                        {/* Notification Badge */}
                        {tab === 'to-rate' && itemsToRate.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                                {itemsToRate.length}
                            </span>
                        )}

                        {/* Active Indicator (Bottom Line) */}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F9A825] rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* 3. RIGHT: Spacer (Optional, kept empty for balance) */}
            <div className="w-[100px] hidden sm:block"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
            <>
                {/* VIEW 1: ALL ORDERS (History Cards) */}
                {activeTab === 'all' && (
                    orders.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Package size={48} className="mx-auto mb-3 text-gray-300"/>
                            <p>No orders yet.</p>
                            <button onClick={() => navigate('/')} className="mt-4 text-[#F9A825] font-bold hover:underline">
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-[#3C2A21]">Order #{order.order_id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(order.order_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {order.delivery_location}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#F9A825]">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="text-gray-500 font-bold">{item.quantity}x</div>
                                                <div className="text-[#3C2A21]">{item.item_name}</div>
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
                             <div className="col-span-full text-center py-20 text-gray-400">
                                {activeTab === 'to-rate' ? "You're all caught up! Nothing to rate." : "You haven't rated anything yet."}
                             </div>
                        ) : (
                            (activeTab === 'to-rate' ? itemsToRate : itemsRated).map((item) => (
                                <div key={item.item_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-[#3C2A21]">{item.item_name}</h3>
                                        <p className="text-xs text-gray-400 mb-2">Ordered {new Date(item.order_date).toLocaleDateString()}</p>
                                        
                                        {/* Show Star Rating if Rated */}
                                        {activeTab === 'rated' && (
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} fill={i < item.my_rating ? "#F9A825" : "#eee"} color={i < item.my_rating ? "#F9A825" : "#ddd"} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleRateItem(item.order_id, item)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                                            activeTab === 'to-rate' 
                                            ? 'bg-[#F9A825] text-[#3C2A21] hover:bg-[#e0961f]' 
                                            : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
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