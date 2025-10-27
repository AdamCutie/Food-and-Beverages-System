import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All Types');

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);
      if (!response.ok) {
        console.error(`Failed to fetch details for order ${orderId}`);
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching details for order ${orderId}:`, err);
      return null;
    }
  };

  const fetchAndPopulateOrders = async (isInitialLoad = false) => {
      if (!isInitialLoad && isPolling) return;
      if (isInitialLoad) setLoading(true);
      setIsPolling(true);
      setError(null);

      try {
        const listResponse = await fetch('http://localhost:3000/api/orders/kitchen');
        if (!listResponse.ok) {
          throw new Error('Failed to fetch kitchen orders list');
        }
        const ordersList = await listResponse.json();

        if (!Array.isArray(ordersList)) {
            console.error("API did not return an array, received:", ordersList);
            throw new Error("Invalid data from server.");
        }

        const ordersWithDetails = await Promise.all(
          ordersList.map(order => fetchOrderDetails(order.order_id))
        );
        
        const newOrders = ordersWithDetails.filter(order => order !== null);
        
        if (Array.isArray(newOrders)) {
            setKitchenOrders(newOrders);
        } else {
            console.error("Error: newOrders is not an array.", newOrders);
            setKitchenOrders([]); 
        }
      } catch (err) {
        setError(err.message);
        setKitchenOrders([]);
      } finally {
        if (isInitialLoad) setLoading(false);
        setIsPolling(false);
      }
    };

  // --- THIS IS THE RESTORED FUNCTION ---
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      });

      if (!response.ok) {
        let errorMsg = `Failed to update status to ${newStatus}`;
        try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; } catch(e) {}
        throw new Error(errorMsg);
      }

      setKitchenOrders(currentOrders => {
        if (!Array.isArray(currentOrders)) {
            console.error("Error: kitchenOrders state was not an array during update.");
            return []; 
        }
        if (newStatus.toLowerCase() === 'served' || newStatus.toLowerCase() === 'cancelled') {
          return currentOrders.filter(order => order.order_id !== orderId);
        } else {
          return currentOrders.map(order =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          );
        }
      });
      toast.success(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.message);
    }
  };
  // --- END OF RESTORED FUNCTION ---

  useEffect(() => {
    fetchAndPopulateOrders(true);
    const intervalId = setInterval(() => {
      fetchAndPopulateOrders(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading active orders...</div>;
  }

  if (error && kitchenOrders.length === 0) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  const filteredOrders = Array.isArray(kitchenOrders) ? kitchenOrders.filter(order => {
    const statusMatch = filterStatus === 'All' || (order.status && order.status.toLowerCase() === filterStatus.toLowerCase());
    const typeMatch = filterType === 'All Types' || (order.order_type && order.order_type.toLowerCase() === filterType.toLowerCase());
    return statusMatch && typeMatch;
  }) : []; // Ensure filteredOrders is always an array
  return (
    <div className="bg-figma-cream min-h-screen px-4 py-8 text-figma-dark-green">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Kitchen Order Display</h1>
        
        {error && <p className="text-center text-red-500 text-sm mb-4">Error fetching updates: {error}</p>}

        {/* --- NEW: Dropdown Filters Container --- */}
        <div className="bg-figma-off-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row justify-around items-center gap-4">
          {/* Filter by Status Dropdown */}
          <div className="flex flex-col w-full md:w-1/2 lg:w-1/3">
            <label htmlFor="status-filter" className="text-sm font-semibold mb-1">Filter by Status</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm focus:ring-figma-dark-green focus:border-figma-dark-green"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              {/* Served orders are removed from kitchenOrders, so they won't appear here */}
            </select>
          </div>

          {/* Filter by Type Dropdown */}
          <div className="flex flex-col w-full md:w-1/2 lg:w-1/3">
            <label htmlFor="type-filter" className="text-sm font-semibold mb-1">Filter by Type</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm focus:ring-figma-dark-green focus:border-figma-dark-green"
            >
              <option value="All Types">All Types</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Room Service">Room Service</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No {filterStatus !== 'All' ? filterStatus.toLowerCase() + ' ' : ''}
            {filterType !== 'All Types' ? filterType.toLowerCase() + ' ' : ''}
            orders.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <div key={order.order_id} className="p-4 rounded-lg shadow-md bg-white flex flex-col h-full">
                <div className="mb-3 border-b pb-2">
                  <h2 className="font-bold text-lg">Order #{order.order_id}</h2>
                  <p className="text-xs text-gray-500">Time: {new Date(order.order_date).toLocaleTimeString()}</p>
                  <p className="text-sm">Type: <span className="font-medium">{order.order_type}</span></p>
                  <p className="text-sm">Location: <span className="font-medium">{order.delivery_location}</span></p>
                  <p className="text-sm">Customer: <span className="font-medium">{order.first_name} {order.last_name}</span></p>
                </div>

                <div className="space-y-2 mb-3 flex-grow overflow-y-auto max-h-48 pr-1">
                  <h3 className="font-semibold">Items:</h3>
                  {order.details && order.details.length > 0 ? (
                    order.details.map(item => (
                      <div key={item.detail_id} className="text-sm ml-2">
                        <span className="font-medium">{item.quantity} x</span> {item.item_name}
                        {item.instructions && <p className="text-xs text-gray-600 italic pl-4">- {item.instructions}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 ml-2">No item details found.</p>
                  )}
                </div>

                 <div className="text-center mb-3">
                   <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        order.status.toLowerCase() === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        order.status.toLowerCase() === 'preparing' ? 'bg-blue-200 text-blue-800' :
                        order.status.toLowerCase() === 'ready' ? 'bg-green-200 text-green-800' :
                        'bg-gray-200 text-gray-800'
                      }`}
                    >
                      Status: {order.status}
                    </span>
                 </div>

                <div className="mt-auto pt-4 border-t flex flex-col gap-2">
                  {order.status.toLowerCase() === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                      className="bg-green-900 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors w-full"
                    >
                      Accept (Prepare)
                    </button>
                  )}
                  {order.status.toLowerCase() === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-600 transition-colors w-full"
                    >
                      Mark as Ready
                    </button>
                  )}
                  {order.status.toLowerCase() === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Served')}
                      className="bg-orange-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors w-full"
                    >
                      Mark as Served
                    </button>
                  )}
                  {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'preparing' || order.status.toLowerCase() === 'ready') && (
                     <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')}
                      className="bg-red-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors w-full"
                    >
                      Cancel
                    </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
         <div className="mt-8 text-center">
           <Link to="/" className="text-blue-500 hover:underline">&larr; Back to Customer Menu</Link>
         </div>
      </div>
    </div>
  );
}

export default KitchenPage;