import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Star, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import './CustomerTheme.css';
import RatingModal from './components/RatingModal'; // ✅ IMPORT MODAL

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ NEW: State for the modal
  const [itemToRate, setItemToRate] = useState(null);

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

  // ✅ UPDATED HANDLER
  const handleRateItem = (orderId, item) => {
    // We pass the item details to the modal state
    setItemToRate({
        item_id: item.item_id,
        item_name: item.item_name,
        order_id: orderId
    });
  };

  return (
    <div className="min-h-screen bg-[#0B3D2E] pb-20"> 
      {/* Header */}
      <div className="bg-[#093125] shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 text-[#F9A825]"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[#F9A825]">My Orders</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading your history...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-300"/>
            <p>You haven't ordered anything yet.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-[#F9A825] font-bold hover:underline">
                Browse Menu
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Order Header */}
              <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#3C2A21] text-lg">Order #{order.order_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12}/> {new Date(order.order_date).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MapPin size={12}/> {order.delivery_location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#F9A825] text-lg">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{order.items?.length} items</p>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                            {item.quantity}x
                        </div>
                        <div>
                            <p className="font-medium text-[#3C2A21]">{item.item_name}</p>
                            {item.instructions && <p className="text-xs text-gray-400 italic">{item.instructions}</p>}
                        </div>
                    </div>

                    {/* RATE BUTTON: Only show if order is SERVED */}
                    {order.status === 'served' && (
                        <button 
                            onClick={() => handleRateItem(order.order_id, item)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#F9A825] text-[#F9A825] text-xs font-bold hover:bg-[#fff8e1] transition-colors"
                        >
                            <Star size={12} fill="#F9A825" /> Rate
                        </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ✅ Render the Modal */}
      <RatingModal 
        isOpen={!!itemToRate} 
        itemToRate={itemToRate}
        onClose={() => setItemToRate(null)}
        onSuccess={() => {
            // Optional: You could refresh the order list if you want to hide the Rate button after rating
            // but for now, we just close the modal.
            setItemToRate(null);
        }}
      />
    </div>
  );
};

export default MyOrdersPage;