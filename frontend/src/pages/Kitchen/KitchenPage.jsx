import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Clock, Package, CheckCircle, CheckCircle2, Calendar } from 'lucide-react';
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
  // ✅ FIX 1: Get Local Date String (YYYY-MM-DD) instead of UTC
  const getLocalTodayStr = () => {
      const now = new Date();
      return now.toLocaleDateString('en-CA'); // Returns "2025-12-08" in local time
  };

  const todayStr = getLocalTodayStr();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [quickFilter, setQuickFilter] = useState('Today'); 

  const [servedCount, setServedCount] = useState(0);

  const { socket } = useSocket();

  // 🌍 TIMEZONE FIXER (For Display)
  // This helps render the time correctly (e.g. 2:00 PM)
  const fixDate = (dateInput) => {
      if (!dateInput) return new Date();
      const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
      if (dateStr.includes(' ') && !dateStr.includes('T')) {
          return new Date(dateStr.replace(' ', 'T') + 'Z');
      }
      if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
          return new Date(dateStr + 'Z');
      }
      return new Date(dateStr);
  };

  // 📅 LOCAL DATE HELPER (For Filtering)
  // Extracts "2025-12-08" from a date object based on LOCAL time, not UTC
  const getLocalDatePart = (dateObj) => {
      return new Date(dateObj).toLocaleDateString('en-CA');
  };

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
      
      // ✅ UPDATED LOGIC: Count only items served TODAY
      const todayDate = getLocalTodayStr(); // Get "2025-12-08"
      
      const todayServedCount = servedList.filter(o => {
          // 1. Must be served
          const isServed = o.status === 'served';
          
          // 2. Must be from today (using our timezone helpers)
          const orderDatePart = getLocalDatePart(fixDate(o.order_date));
          const isToday = orderDatePart === todayDate;
          
          return isServed && isToday;
      }).length;

      setServedCount(todayServedCount);

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
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- HELPERS (Updated to use Local Time) ---
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    // Calculate difference to get to Monday (if day is Sunday (0), go back 6 days)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    return monday.toLocaleDateString('en-CA');
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date);
    // Create new date for 1st of month
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    return firstDay.toLocaleDateString('en-CA');
  };

  const getTotalItems = (order) => {
      return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  // --- HANDLERS ---
  const handleFilterClick = (status) => {
    if (filterStatus === status) {
        setFilterStatus('All');
    } else {
        setFilterStatus(status);
    }
  };

  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);

    const today = new Date();
    // Use local time string for Today
    const endStr = today.toLocaleDateString('en-CA'); 
    let startStr = endStr;

    if (filter === 'Today') {
        startStr = endStr;
    } else if (filter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startStr = yesterday.toLocaleDateString('en-CA');
        setEndDate(startStr);
        setStartDate(startStr);
        return;
    } else if (filter === 'This Week') {
        startStr = getStartOfWeek(today);
        setEndDate(endStr);
    } else if (filter === 'This Month') {
        startStr = getStartOfMonth(today);
        setEndDate(endStr);
    } else if (filter === 'Custom') {
        return; 
    }

    if (filter !== 'Custom') {
        setStartDate(startStr);
        setEndDate(endStr);
    }
  };

  // 1. FILTER LOGIC
  const filteredOrders = kitchenOrders.filter(order => {
    const statusMatch = filterStatus === 'All' || order.status?.toLowerCase() === filterStatus.toLowerCase();
    const typeMatch = filterType === 'All Types' || order.order_type?.toLowerCase() === filterType.toLowerCase();
    
    // ✅ FIX 2: Compare LOCAL dates, not UTC ISO strings
    // Convert order date (which might be UTC or Local from DB) to a proper Date object first
    const orderDateObj = fixDate(order.order_date);
    // Then extract the Local YYYY-MM-DD part
    const orderDatePart = getLocalDatePart(orderDateObj);
    
    // String comparison works safely for YYYY-MM-DD
    const dateMatch = orderDatePart >= startDate && orderDatePart <= endDate;

    return statusMatch && typeMatch && dateMatch;
  });

  // 2. SORT LOGIC
  const sortedOrders = [...filteredOrders].sort((a, b) => {
      switch (sortBy) {
          case 'Newest':
              return new Date(b.order_date) - new Date(a.order_date);
          case 'Oldest':
              return new Date(a.order_date) - new Date(b.order_date);
          case 'Most Items':
              return getTotalItems(b) - getTotalItems(a);
          case 'Least Items':
              return getTotalItems(a) - getTotalItems(b);
          default:
              return 0;
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
            <div 
                onClick={() => navigate('/kitchen/archive')} 
                className="summary-box cursor-pointer hover:scale-105 transition-transform duration-200 hover:ring-4 hover:ring-gray-300"
                title="View Archive"
            >
                <div><h3 className="font-bold text-sm uppercase text-gray-700">Served Today</h3><p className="text-3xl font-bold text-gray-900">{servedCount}</p></div>
                <div className="p-3 rounded-full bg-gray-500 text-white"><CheckCircle2 size={24}/></div>
            </div>
        </div>

        {/* FILTERS ROW */}
        <div className="filter-container flex flex-wrap items-end gap-4 justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            
            {/* 1. Filter by Type */}
            <div className="w-full md:w-auto flex-1 min-w-[150px] max-w-xs">
                <label className="block text-sm font-bold mb-1 text-gray-700">Filter by Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-white">
                    <option value="All Types">All Types</option>
                    <option value="Dine-in">Dine-in</option>
                    <option value="Room Dining">Room Dining</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone Order">Phone Order</option>
                </select>
            </div>

            {/* 2. Sort Orders */}
            <div className="w-full md:w-auto flex-1 min-w-[150px] max-w-xs">
                <label className="block text-sm font-bold mb-1 text-gray-700">Sort Orders</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-white">
                    <option value="Oldest">Oldest First (Default)</option>
                    <option value="Newest">Newest First</option>
                    <option value="Most Items">Most Items First</option>
                    <option value="Least Items">Least Items First</option>
                </select>
            </div>

            {/* 3. Reset Filter Link */}
            <div className="flex-1 flex items-center justify-center pb-2">
               {filterStatus !== 'All' && (
                 <button onClick={() => setFilterStatus('All')} className="text-sm text-gray-500 hover:text-[#F9A825] underline">
                    Reset Status Filter ({filterStatus})
                 </button>
               )}
            </div>

            {/* 4. Date Filter */}
            <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500"/>
                    <label className="block text-sm font-bold text-[#F9A825]">Date Period</label>
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                    <select 
                        value={quickFilter} 
                        onChange={handleQuickFilterChange} 
                        className="p-2 rounded border border-gray-300 bg-white font-medium text-sm focus:ring-2 focus:ring-[#F9A825] outline-none"
                    >
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="Custom">Custom Range</option>
                    </select>

                    {quickFilter === 'Custom' && (
                        <div className="flex gap-2 animate-fadeIn">
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="p-2 rounded border border-gray-300 text-sm"
                                max={endDate} 
                            />
                            <span className="text-gray-400 self-center">to</span>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="p-2 rounded border border-gray-300 text-sm"
                                min={startDate} 
                            />
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