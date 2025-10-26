// frontend/src/pages/Kitchen/KitchenPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  // Function to fetch details for a single order
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

  // --- Function to fetch orders (extracted for reuse) ---
  const fetchAndPopulateOrders = async (isInitialLoad = false) => {
      // Prevent fetching if already polling
      if (!isInitialLoad && isPolling) return;

      if (isInitialLoad) setLoading(true); // Only show full loader on first load
      setIsPolling(true); // Mark as polling
      setError(null); // Clear previous errors on new fetch attempt

      try {
        const listResponse = await fetch('http://localhost:3000/api/orders/kitchen');
        if (!listResponse.ok) {
          throw new Error('Failed to fetch kitchen orders list');
        }
        const ordersList = await listResponse.json();

        const ordersWithDetails = await Promise.all(
          ordersList.map(order => fetchOrderDetails(order.order_id))
        );
        
        // Update state only if the data has changed (simple check based on order IDs and count)
        setKitchenOrders(prevOrders => {
            const currentIds = prevOrders.map(o => o.order_id).sort().join(',');
            const newIds = ordersWithDetails.filter(o => o !== null).map(o => o.order_id).sort().join(',');
            if (currentIds !== newIds) {
                return ordersWithDetails.filter(order => order !== null);
            }
            return prevOrders; // No change, return previous state
        });

      } catch (err) {
        setError(err.message); // Show error, but don't clear orders immediately on poll error
      } finally {
        if (isInitialLoad) setLoading(false); // Turn off initial loader
        setIsPolling(false); // Mark as finished polling
      }
    };

  // Function to handle status updates
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        let errorMsg = `Failed to update status to ${newStatus}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch(e) { /* Ignore parsing error */ }
        throw new Error(errorMsg);
      }

      setKitchenOrders(currentOrders => {
        if (newStatus === 'Completed' || newStatus === 'Cancelled') {
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

  useEffect(() => {
    // Fetch immediately on component mount
    fetchAndPopulateOrders(true);

    // Set up polling interval (e.g., every 15 seconds)
    const intervalId = setInterval(() => {
      fetchAndPopulateOrders(false); // Pass false for subsequent polls
    }, 5000); // 5000 milliseconds = 5 seconds

    // Cleanup function: Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this effect runs only once on mount

  // --- Render logic ---
  if (loading) {
    return <div className="p-8 text-center text-lg">Loading active orders...</div>;
  }

  // Show error prominently only if it happens on initial load or persists
  // Small polling errors might just log to console or show a subtle indicator later
  if (error && kitchenOrders.length === 0) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-figma-cream min-h-screen px-4 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-figma-dark-green">Kitchen Order Display</h1>

        {kitchenOrders.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No active orders.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {kitchenOrders.map(order => (
              <div key={order.order_id} className="p-4 rounded-lg shadow-md bg-white flex flex-col h-full">
                {/* Order Header */}
                <div className="mb-3 border-b pb-2">
                  <h2 className="font-bold text-lg text-figma-dark-green">Order #{order.order_id}</h2>
                  <p className="text-xs text-gray-500">Time: {new Date(order.order_date).toLocaleTimeString()}</p>
                  <p className="text-sm">Type: <span className="font-medium">{order.order_type}</span></p>
                  <p className="text-sm">Location: <span className="font-medium">{order.delivery_location}</span></p>
                  <p className="text-sm">Customer: <span className="font-medium">{order.first_name} {order.last_name}</span></p>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-3 flex-grow overflow-y-auto max-h-48 pr-1">
                  <h3 className="font-semibold text-figma-dark-green">Items:</h3>
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

                 {/* Current Status Display */}
                 <div className="text-center mb-3">
                   <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}
                    >
                      Status: {order.status}
                    </span>
                 </div>

                {/* --- THIS IS THE RESTORED ACTION BUTTONS SECTION --- */}
                <div className="mt-auto pt-4 border-t flex justify-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'preparing')}
                      className="bg-green-900 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors flex-1"
                    >
                      Accept (Prepare)
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                      className="bg-figma-orange text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors flex-1"
                    >
                      Ready (Complete)
                    </button>
                  )}
                  {/* Cancel Button */}
                   {(order.status === 'pending' || order.status === 'preparing') && (
                     <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')}
                      className="bg-red-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                   )}
                </div>
                {/* --- END OF RESTORED ACTION BUTTONS SECTION --- */}
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