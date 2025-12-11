import React, { useState, useEffect } from 'react';
import InternalNavBar from './components/InternalNavBar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/apiClient';
import './KitchenTheme.css'; // Import CSS

function ArchivePage() {
  const [servedOrders, setServedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- Date Filter State ---
  // UPDATED: Default startDate to todayStr for performance
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr); 
  const [endDate, setEndDate] = useState(todayStr);
  const [quickFilter, setQuickFilter] = useState('Today'); // Default to Today
  
  // --- NEW: Status Filter State ---
  const [statusFilter, setStatusFilter] = useState('All');

  const { token } = useAuth();

//   const fetchOrderDetails = async (orderId) => {
//     try {
//       const response = await apiClient(`/orders/${orderId}`); 
//       if (!response.ok) return null;
//       return await response.json();
//     } catch (err) {
//       return null;
//     }
//   };

useEffect(() => {
    const fetchServedOrders = async () => {
      try {
        setLoading(true);
        
        // Pass the dates to the backend
        const queryParams = new URLSearchParams({
            startDate: startDate,
            endDate: endDate
        }).toString();

        const response = await apiClient(`/orders/served?${queryParams}`); 
        if (!response.ok) throw new Error('Failed to fetch served orders');
        
        const data = await response.json();
        
        // Set data directly (No extra looping needed!)
        setServedOrders(data);
        
      } catch (err) {
        if (err.message !== 'Session expired') setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchServedOrders();
  }, [token, startDate, endDate]); // Added dates to dependency

  // --- Quick Filter Logic ---
  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);

    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = '';

    if (filter === 'Today') {
        startStr = endStr;
    } else if (filter === 'This Week') {
        // Set to start of the week (Sunday)
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); 
        startStr = firstDay.toISOString().split('T')[0];
    } else if (filter === 'This Month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startStr = firstDay.toISOString().split('T')[0];
    } else if (filter === 'This Year') {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        startStr = firstDay.toISOString().split('T')[0];
    } else {
        return; 
    }

    setStartDate(startStr);
    setEndDate(endStr);
  };

  // --- Filtering Logic ---
  const filteredOrders = servedOrders.filter(order => {
    // 1. Date Check
    if (startDate || endDate) {
        const orderDate = new Date(order.order_date);
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
    }

    // 2. Status Check
    if (statusFilter !== 'All') {
        if (order.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    
    return true;
  });

  // Helper for status colors
  const getStatusBadgeStyle = (status) => {
      if (status === 'cancelled') return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }; // Red-ish
      return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }; // Green-ish
  };

  return (
    <>
      <InternalNavBar />
      <div className="kitchen-page">
        <div className="kitchen-container">
            
            {/* --- HEADER ROW --- */}
            <div className="kitchen-header-row" style={{ alignItems: 'flex-end', margin: '0 0 1.5rem 0', maxWidth: '100%' }}>
            <h1 className="kitchen-title" style={{ marginBottom: 0, textAlign: 'left' }}>
                Archive Section
            </h1>

            {/* --- FILTER CONTAINER --- */}
            <div 
                className="kitchen-card" 
                style={{ 
                    flexDirection: 'row', 
                    padding: '1rem', 
                    gap: '1rem', 
                    alignItems: 'flex-end', 
                    width: 'auto',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                }}
            >
                {/* NEW: Status Filter */}
                <div>
                    <label className="block text-xs font-bold mb-1 text-[#F9A825]">Status</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] h-[40px] cursor-pointer bg-transparent focus:bg-white transition-colors"
                        style={{ minWidth: '100px' }}
                    >  
                        <option value="All">All</option>
                        <option value="Served">Served</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Quick Filter Dropdown */}
                <div>
                    <label className="block text-xs font-bold mb-1 text-[#F9A825]">Quick Filter</label>
                    <select 
                        value={quickFilter}
                        onChange={handleQuickFilterChange}
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] h-[40px] cursor-pointer bg-transparent focus:bg-white transition-colors"
                        style={{ minWidth: '120px' }}
                    >  
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="This Year">This Year</option>
                        <option value="Custom">Custom</option>
                    </select>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-xs font-bold mb-1 text-[#F9A825]">Start Date</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setQuickFilter('Custom'); }}
                        max={todayStr} 
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] h-[40px] bg-transparent focus:bg-white transition-colors"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-xs font-bold mb-1 text-[#F9A825]">End Date</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setQuickFilter('Custom'); }}
                        max={todayStr} 
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] h-[40px] bg-transparent focus:bg-white transition-colors"
                    />
                </div>

                <button 
                    onClick={() => { setStartDate(todayStr); setEndDate(todayStr); setQuickFilter('Today'); setStatusFilter('All'); }}
                    className="kitchen-btn btn-amber h-[40px]"
                    title="Reset Filters"
                >
                    Reset
                </button>
            </div>
            </div>

            {/* --- CONTENT --- */}
            {loading ? (
                <div className="text-center text-white text-xl py-10">Loading archive...</div>
            ) : error ? (
                <div className="text-center text-red-500 text-xl py-10">Error: {error}</div>
            ) : filteredOrders.length === 0 ? (
                <p className="text-center text-gray-400 text-lg py-10">
                    {servedOrders.length === 0 ? "No archive data found." : "No orders found for this period."}
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredOrders.map(order => (  
                    <div key={order.order_id} className="kitchen-card">
                        <div className="kitchen-card-header flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-[#3C2A21]">#{order.order_id}</h2>
                                
                                <p className="text-xs text-gray-600">{new Date(order.order_date).toLocaleString()}</p>
                            </div>
                            {/* STATUS BADGE */}
                            <span 
                                style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontWeight: 'bold', 
                                    textTransform: 'uppercase',
                                    ...getStatusBadgeStyle(order.status)
                                }}
                            >
                                {order.status}
                            </span>
                        </div>

                        <div className="kitchen-card-body overflow-y-auto max-h-48">
                            <p><span className="info-label">Type:</span> {order.order_type}</p>
                            <p><span className="info-label">Loc:</span> {order.delivery_location}</p>
                            <p><span className="info-label">Name:</span> {order.first_name ? `${order.first_name} ${order.last_name || ''}` : 'Guest'}</p>
                            
                            <div className="mt-2 border-t pt-2 border-gray-300">
                                <h3 className="font-bold text-sm">Items:</h3>
                                {order.items?.map((item, idx) => (
                                    <div key={item.detail_id || idx} className="text-sm">
                                        <span className="font-bold">{item.quantity}x</span> {item.item_name}
                                        {item.instructions && <span className="block text-xs italic text-red-500 ml-4">{item.instructions}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>
    </>
  );
}

export default ArchivePage;