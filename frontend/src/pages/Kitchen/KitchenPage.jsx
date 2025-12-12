import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Clock, Package, CheckCircle, CheckCircle2, Calendar, AlertTriangle, X } from 'lucide-react';
import InternalNavBar from './components/InternalNavBar';
import apiClient from '../../utils/apiClient';
import './KitchenTheme.css'; 
import { useSocket } from '../../context/SocketContext';

function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // --- FILTERS & SORTING ---
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Oldest'); 

  // --- DATE FILTER STATE ---
  const getLocalTodayStr = () => new Date().toLocaleDateString('en-CA');
  const todayStr = getLocalTodayStr();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [quickFilter, setQuickFilter] = useState('Today'); 

  const [servedCount, setServedCount] = useState(0);

  // --- MODAL STATE (For Cancellation) ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderIdToCancel, setOrderIdToCancel] = useState(null);

  const { socket } = useSocket();

  // --- HELPERS ---
  const fixDate = (dateInput) => {
      if (!dateInput) return new Date();
      const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
      if (dateStr.includes(' ') && !dateStr.includes('T')) return new Date(dateStr.replace(' ', 'T') + 'Z');
      if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) return new Date(dateStr + 'Z');
      return new Date(dateStr);
  };

  const getLocalDatePart = (dateObj) => new Date(dateObj).toLocaleDateString('en-CA');

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await apiClient(`/orders/${orderId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      return null;
    }
  };

const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. OPTIMIZATION: Only fetch today's served orders for the counter
      // This prevents downloading thousands of old orders just to count today's.
      const today = new Date().toLocaleDateString('en-CA'); // Formats as YYYY-MM-DD
      const servedQueryParams = new URLSearchParams({ startDate: today, endDate: today }).toString();

      const [kitchenResponse, servedResponse] = await Promise.all([
        apiClient('/orders/kitchen'),
        apiClient(`/orders/served?${servedQueryParams}`) 
      ]);

      // 2. FAST LOAD: The backend now sends items inside the order!
      // We can use the response directly. No more looping.
      const ordersList = await kitchenResponse.json();
      setKitchenOrders(ordersList);

      // 3. Set Served Count
      const servedList = await servedResponse.json();
      setServedCount(servedList.length);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
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
                toast.success(`New Order #${data.order_id} Received!`, { duration: 3000, position: 'top-right' });
            }
        });

        socket.on('order-status-updated', (data) => {
            setKitchenOrders(prev => {
                const { order_id, status } = data;
                if (status === 'served' || status === 'cancelled') {
                    if (status === 'served') setServedCount(c => c + 1);
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
      if (!response.ok) throw new Error('Failed to update status');
      toast.success(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- CANCELLATION HANDLERS ---
  const handlePromptCancel = (orderId) => {
      setOrderIdToCancel(orderId);
      setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
      if (orderIdToCancel) {
          handleUpdateStatus(orderIdToCancel, 'Cancelled');
          setShowCancelModal(false);
          setOrderIdToCancel(null);
      }
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff)).toLocaleDateString('en-CA');
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
  };

  const getTotalItems = (order) => {
      return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  const handleFilterClick = (status) => {
    if (filterStatus === status) { setFilterStatus('All'); } else { setFilterStatus(status); }
  };

  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);
    const today = new Date();
    const endStr = today.toLocaleDateString('en-CA'); 
    let startStr = endStr;

    if (filter === 'Today') { startStr = endStr; }
    else if (filter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startStr = yesterday.toLocaleDateString('en-CA');
        setEndDate(startStr); setStartDate(startStr); return;
    } else if (filter === 'This Week') { startStr = getStartOfWeek(today); setEndDate(endStr); }
    else if (filter === 'This Month') { startStr = getStartOfMonth(today); setEndDate(endStr); }
    else if (filter === 'Custom') { return; }

    if (filter !== 'Custom') { setStartDate(startStr); setEndDate(endStr); }
  };

  const filteredOrders = kitchenOrders.filter(order => {
    const statusMatch = filterStatus === 'All' || order.status?.toLowerCase() === filterStatus.toLowerCase();
    const typeMatch = filterType === 'All Types' || order.order_type?.toLowerCase() === filterType.toLowerCase();
    const orderDateObj = fixDate(order.order_date);
    const orderDatePart = getLocalDatePart(orderDateObj);
    const dateMatch = orderDatePart >= startDate && orderDatePart <= endDate;
    return statusMatch && typeMatch && dateMatch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
      switch (sortBy) {
          case 'Newest': return new Date(b.order_date) - new Date(a.order_date);
          case 'Oldest': return new Date(a.order_date) - new Date(b.order_date);
          case 'Most Items': return getTotalItems(b) - getTotalItems(a);
          case 'Least Items': return getTotalItems(a) - getTotalItems(b);
          default: return 0;
      }
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
      return fixDate(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) { return 'N/A'; }
  };

  return (
    <>
    <InternalNavBar />
    <div className="kitchen-page">
      <div className="kitchen-container">
        <h1 className="kitchen-title">Kitchen Order Display (Live)</h1>

        {/* SUMMARY CARDS */}
        <div className="summary-grid">
            <div onClick={() => handleFilterClick('Pending')} className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Pending' ? 'ring-4 ring-amber-400 scale-105 bg-amber-100' : 'hover:scale-105'}`}>
                <div><h3 className="font-bold text-sm uppercase text-gray-700">Pending</h3><p className="text-3xl font-bold text-gray-900">{pendingCount}</p></div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Pending' ? 'bg-amber-600' : 'bg-amber-500'}`}><Clock size={24}/></div>
            </div>
            <div onClick={() => handleFilterClick('Preparing')} className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Preparing' ? 'ring-4 ring-blue-400 scale-105 bg-blue-100' : 'hover:scale-105'}`}>
                <div><h3 className="font-bold text-sm uppercase text-gray-700">Preparing</h3><p className="text-3xl font-bold text-gray-900">{preparingCount}</p></div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Preparing' ? 'bg-blue-600' : 'bg-blue-500'}`}><Package size={24}/></div>
            </div>
            <div onClick={() => handleFilterClick('Ready')} className={`summary-box cursor-pointer transition-all duration-200 ${filterStatus === 'Ready' ? 'ring-4 ring-green-400 scale-105 bg-green-100' : 'hover:scale-105'}`}>
                <div><h3 className="font-bold text-sm uppercase text-gray-700">Ready</h3><p className="text-3xl font-bold text-gray-900">{readyCount}</p></div>
                <div className={`p-3 rounded-full text-white ${filterStatus === 'Ready' ? 'bg-green-600' : 'bg-green-500'}`}><CheckCircle size={24}/></div>
            </div>
            <div onClick={() => navigate('/kitchen/archive')} className="summary-box cursor-pointer hover:scale-105 transition-transform duration-200 hover:ring-4 hover:ring-gray-300" title="View Archive">
                <div><h3 className="font-bold text-sm uppercase text-gray-700">Served</h3><p className="text-3xl font-bold text-gray-900">{servedCount}</p></div>
                <div className="p-3 rounded-full bg-gray-500 text-white"><CheckCircle2 size={24}/></div>
            </div>
        </div>

       
        <div className="filter-container flex flex-wrap items-end gap-4 justify-between p-4 rounded-lg shadow-md border border-[#D1C0B6] mb-6" style={{ backgroundColor: '#fff2e0' }}>
            <div className="w-full md:w-auto flex-1 min-w-[150px] max-w-xs">  
                <label className="block text-sm font-bold mb-1 text-[#3C2A21]">Filter by Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="kitchen-select w-full">
                    <option value="All Types">All Types</option>
                    <option value="Dine-in">Dine-in</option>
                    <option value="Room Dining">Room Dining</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone Order">Phone Order</option>
                </select>
            </div>
            <div className="w-full md:w-auto flex-1 min-w-[150px] max-w-xs">
                {/* ✅ FIX: Label color */}
                <label className="block text-sm font-bold mb-1 text-[#3C2A21]">Sort Orders</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="kitchen-select w-full">
                    <option value="Oldest">Oldest First (Default)</option>
                    <option value="Newest">Newest First</option>
                    <option value="Most Items">Most Items First</option>
                    <option value="Least Items">Least Items First</option>
                </select>
            </div>
            <div className="flex-1 flex items-center justify-center pb-2">
               {filterStatus !== 'All' && (
               
                 <button onClick={() => setFilterStatus('All')} className="text-sm text-[#3C2A21] hover:text-[#F9A825] underline font-medium">
                    Reset Status Filter ({filterStatus})
                 </button>
               )}
            </div>
            <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#F9A825]"/>
                    <label className="block text-sm font-bold text-[#F9A825]">Date Period</label>
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                    <select value={quickFilter} onChange={handleQuickFilterChange} className="kitchen-select text-sm font-medium" style={{height: '38px'}}>
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Custom">Custom Range</option>
                    </select>
                    {quickFilter === 'Custom' && (
                        <div className="flex gap-2 animate-fadeIn bg-white p-1 rounded border border-[#D1C0B6]">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-1 text-sm outline-none" max={endDate} />
                            <span className="text-gray-400 self-center">-</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-1 text-sm outline-none" min={startDate} />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {loading ? (
            <div className="text-center text-white text-xl py-10">Loading active orders...</div>
        ) : sortedOrders.length === 0 ? (
            <div className="text-center text-gray-400 text-lg py-10 flex flex-col items-center">
                <p>No orders found for {startDate === endDate ? startDate : `${startDate} to ${endDate}`}.</p>
                {filterStatus !== 'All' && <p className="text-sm">Filter: {filterStatus}</p>}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedOrders.map(order => {
                    return (
                        <div key={order.order_id} className="kitchen-card">
                            <div className="kitchen-card-header relative">
                                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">#{order.order_id}</h2>
                                <p className="text-sm font-bold text-gray-700">{order.first_name ? `${order.first_name} ${order.last_name || ''}` : 'Guest'}</p>
                                <p className="text-sm text-gray-500">{formatOrderTime(order.order_date)}</p>
                            </div>
                            
                            <div className="kitchen-card-body">
                                <p><span className="info-label">Type:</span> {order.order_type}</p>
                                <p><span className="info-label">Loc:</span> {order.delivery_location}</p>
                                <p><span classname="info-label">Name: </span>{order.first_name}</p>
                                <div className="mt-2 border-t pt-2">
                                    <p className="font-bold text-sm mb-1">Items:</p>
                                    {order.items?.map((item, idx) => (
                                        <div key={item.order_detail_id || idx} className="mb-2">
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
                                        <button onClick={() => handlePromptCancel(order.order_id)} className="kitchen-btn btn-red"><Trash2 size={18}/></button>
                                    </div>
                                )}
                                {order.status?.toLowerCase() === 'preparing' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(order.order_id, 'Ready')} className="kitchen-btn btn-blue flex-1">Ready</button>
                                        <button onClick={() => handlePromptCancel(order.order_id)} className="kitchen-btn btn-red"><Trash2 size={18}/></button>
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

      {/* ✅ CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl relative border-t-4 border-red-500">
                <button 
                    onClick={() => setShowCancelModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-red-100 p-3 rounded-full mb-3">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Cancel Order?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Are you sure you want to cancel <span className="font-bold text-gray-800">Order #{orderIdToCancel}</span>? 
                        This action cannot be undone.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowCancelModal(false)}
                        className="flex-1 py-2 rounded-lg font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Keep Order
                    </button>
                    <button 
                        onClick={handleConfirmCancel}
                        className="flex-1 py-2 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors"
                    >
                        Yes, Cancel it
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
    </>
  );
}

export default KitchenPage;