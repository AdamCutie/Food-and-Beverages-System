import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Clock, Package, CheckCircle, CheckCircle2, Calendar } from 'lucide-react'; // Added Calendar Icon
import InternalNavBar from './components/InternalNavBar';
import apiClient from '../../utils/apiClient';
import './KitchenTheme.css'; 
import { useSocket } from '../../context/SocketContext';

function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // FILTERS
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All Types');
  // Default to today's date (Format: YYYY-MM-DD)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [servedCount, setServedCount] = useState(0);

  const { socket } = useSocket();

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await apiClient(`/orders/${orderId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      return null;
    }
  };

  // Initial Data Load
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [kitchenResponse, servedResponse] = await Promise.all([
        apiClient('/orders/kitchen'),
        apiClient('/orders/served')
      ]);
      const ordersList = await kitchenResponse.json();
      const servedList = await servedResponse.json();
      setServedCount(servedList.length);

      const ordersWithDetails = await Promise.all(
        ordersList.map(order => fetchOrderDetails(order.order_id))
      );
      setKitchenOrders(ordersWithDetails.filter(o => o !== null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // --- REAL-TIME LISTENERS ---
    if (socket) {
        socket.on('new-order', async (data) => {
            console.log('🆕 New order received:', data);
            
            let fullOrder;
            if (data.items && data.first_name) {
                fullOrder = {
                    order_id: data.order_id,
                    order_date: data.order_date || new Date().toISOString(),
                    order_type: data.order_type,
                    delivery_location: data.delivery_location,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    status: data.status,
                    total_amount: data.total_amount,
                    items: data.items || []
                };
            } else {
                fullOrder = await fetchOrderDetails(data.order_id);
            }
            
            if (fullOrder) {
                setKitchenOrders(prev => {
                    if (prev.find(o => o.order_id === fullOrder.order_id)) return prev;
                    return [fullOrder, ...prev]; 
                });
                toast.success(`New Order #${data.order_id} Received!`, {
                    duration: 3000,
                    position: 'top-right'
                });
            }
        });

        socket.on('order-status-updated', (data) => {
            console.log('🔄 Order status updated:', data);
            
            setKitchenOrders(prev => {
                const { order_id, status } = data;
                
                if (status === 'served' || status === 'cancelled') {
                    if (status === 'served') setServedCount(c => c + 1);
                    
                    const orderName = prev.find(o => o.order_id === order_id);
                    if (orderName) {
                        toast.success(`Order #${order_id} ${status === 'served' ? 'Served' : 'Cancelled'}`, {
                            duration: 2000
                        });
                    }
                    return prev.filter(o => o.order_id !== order_id);
                }
                return prev.map(o => o.order_id === order_id ? { ...o, status } : o);
            });
        });
    }

    return () => {
        if(socket) {
            socket.off('new-order');
            socket.off('order-status-updated');
        }
    };
  }, [socket]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await apiClient(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- FILTERS LOGIC ---
  const handleFilterClick = (status) => {
    if (filterStatus === status) {
        setFilterStatus('All');
    } else {
        setFilterStatus(status);
    }
  };

  // Updated filtering to include Date
  const filteredOrders = kitchenOrders.filter(order => {
    // 1. Status Filter
    const statusMatch = filterStatus === 'All' || order.status?.toLowerCase() === filterStatus.toLowerCase();
    
    // 2. Type Filter
    const typeMatch = filterType === 'All Types' || order.order_type?.toLowerCase() === filterType.toLowerCase();
    
    // 3. Date Filter
    // Extract YYYY-MM-DD from the order's ISO string
    const orderDatePart = new Date(order.order_date).toISOString().split('T')[0];
    const dateMatch = orderDatePart === filterDate;

    return statusMatch && typeMatch && dateMatch;
  });

  const pendingCount = kitchenOrders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const preparingCount = kitchenOrders.filter(o => o.status?.toLowerCase() === 'preparing').length;
  const readyCount = kitchenOrders.filter(o => o.status?.toLowerCase() === 'ready').length;

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
        case 'pending': return 'bg-yellow-200 text-yellow-800';
        case 'preparing': return 'bg-blue-200 text-blue-800';
        case 'ready': return 'bg-green-200 text-green-800';
        default: return 'bg-gray-200 text-gray-800';
    }
  };

  const formatOrderTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return 'N/A';
    }
  };

  return (
    <>
    <InternalNavBar />
    <div className="kitchen-page">
      <div className="kitchen-container">
        <h1 className="kitchen-title">Kitchen Order Display (Live)</h1>

        {/* CLICKABLE SUMMARY CARDS */}
        <div className="summary-grid">
            {/* Pending Card */}
            <div 
                onClick={() => handleFilterClick('Pending')}
                className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Pending' ? 'ring-4 ring-amber-400 scale-105 bg-amber-100' : 'hover:scale-105'}`}
            >
                <div>
                    <h3 className="font-bold text-sm uppercase text-gray-700">Pending</h3>
                    <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Pending' ? 'bg-amber-600' : 'bg-amber-500'}`}>
                    <Clock size={24}/>
                </div>
            </div>

            {/* Preparing Card */}
            <div 
                onClick={() => handleFilterClick('Preparing')}
                className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Preparing' ? 'ring-4 ring-blue-400 scale-105 bg-blue-100' : 'hover:scale-105'}`}
            >
                <div>
                    <h3 className="font-bold text-sm uppercase text-gray-700">Preparing</h3>
                    <p className="text-3xl font-bold text-gray-900">{preparingCount}</p>
                </div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Preparing' ? 'bg-blue-600' : 'bg-blue-500'}`}>
                    <Package size={24}/>
                </div>
            </div>

            {/* Ready Card */}
            <div 
                onClick={() => handleFilterClick('Ready')}
                className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Ready' ? 'ring-4 ring-green-400 scale-105 bg-green-100' : 'hover:scale-105'}`}
            >
                <div>
                    <h3 className="font-bold text-sm uppercase text-gray-700">Ready</h3>
                    <p className="text-3xl font-bold text-gray-900">{readyCount}</p>
                </div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Ready' ? 'bg-green-600' : 'bg-green-500'}`}>
                    <CheckCircle size={24}/>
                </div>
            </div>

            {/* Served Card */}
            <div className="summary-box opacity-90">
                <div>
                    <h3 className="font-bold text-sm uppercase text-gray-700">Served</h3>
                    <p className="text-3xl font-bold text-gray-900">{servedCount}</p>
                </div>
                <div className="p-3 rounded-full bg-gray-500 text-white">
                    <CheckCircle2 size={24}/>
                </div>
            </div>
        </div>

        {/* Filters Row */}
        <div className="filter-container items-end">
            
            {/* Filter by Type */}
            <div className="flex-1">
                <label className="block text-sm font-bold mb-1 text-[#F9A825]">Filter by Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 rounded border border-gray-300">
                    <option value="All Types">All Types</option>
                    <option value="Dine-in">Dine-in</option>
                    <option value="Room Dining">Room Dining</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone Order">Phone Order</option>
                </select>
            </div>

            {/* Filter by Date */}
            <div className="flex-1">
                <label className="block text-sm font-bold mb-1 text-[#F9A825]">Filter by Date</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)} 
                        className="w-full p-2 pl-2 rounded border border-gray-300"
                    />
                </div>
            </div>
            
            {/* Reset Button */}
            <div className="flex-1 flex items-center justify-start pb-2">
               {filterStatus !== 'All' && (
                 <button 
                    onClick={() => setFilterStatus('All')}
                    className="text-sm text-gray-500 hover:text-[#F9A825] underline ml-2"
                 >
                    Reset Status Filter
                 </button>
               )}
            </div>
        </div>

        {loading ? (
            <div className="text-center text-white text-xl py-10">Loading active orders...</div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-400 text-lg py-10 flex flex-col items-center">
                <p>No orders found for {filterDate}.</p>
                {filterStatus !== 'All' && <p className="text-sm">Filter: {filterStatus}</p>}
                
                {/* Helper hint for user testing */}
                {new Date(filterDate).toDateString() === new Date().toDateString() && (
                     <p className="text-xs text-gray-500 mt-2 italic">(Tip: If you are testing with old sample data, try changing the date)</p>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOrders.map(order => {
                    return (
                        <div key={order.order_id} className="kitchen-card">
                            <div className="kitchen-card-header relative">
                                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">#{order.order_id}</h2>
                                <p className="text-sm text-gray-500">{formatOrderTime(order.order_date)}</p>
                            </div>
                            
                            <div className="kitchen-card-body">
                                <p><span className="info-label">Type:</span> {order.order_type}</p>
                                <p><span className="info-label">Loc:</span> {order.delivery_location}</p>
                                <p><span className="info-label">Name:</span> {order.first_name} {order.last_name}</p>
                                
                                <div className="mt-2 border-t pt-2">
                                    <p className="font-bold text-sm mb-1">Items:</p>
                                    {order.items?.map((item, idx) => (
                                        <div key={item.order_detail_id || idx} className="mb-2">
                                            {/* Item Name & Quantity */}
                                            <div className="item-text font-medium">
                                                {item.quantity} x {item.item_name}
                                            </div>
                                            
                                            {item.instructions && (
                                                <div className="text-xs text-red-600 italic ml-4 bg-red-50 px-1 rounded inline-block border border-red-100">
                                                    Note: {item.instructions}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="kitchen-card-footer">
                                {order.status?.toLowerCase() === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(order.order_id, 'Preparing')} className="kitchen-btn btn-green flex-1">Accept</button>
                                        <button onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')} className="kitchen-btn btn-red"><Trash2 size={18}/></button>
                                    </div>
                                )}
                                {order.status?.toLowerCase() === 'preparing' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(order.order_id, 'Ready')} className="kitchen-btn btn-blue flex-1">Ready</button>
                                        <button onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')} className="kitchen-btn btn-red"><Trash2 size={18}/></button>
                                    </div>
                                )}
                                {order.status?.toLowerCase() === 'ready' && (
                                    <button onClick={() => handleUpdateStatus(order.order_id, 'Served')} className="kitchen-btn btn-amber w-full">Served</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
    </>
  );
}

export default KitchenPage;