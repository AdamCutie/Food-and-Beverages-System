    import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import InternalNavBar from './components/InternalNavBar';
    import { useAuth } from '../../context/AuthContext';
    import apiClient from '../../utils/apiClient'; // <-- 1. IMPORT

    function ArchivePage() {
      const [servedOrders, setServedOrders] = useState([]);
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true);
      const { token } = useAuth();

      const fetchOrderDetails = async (orderId) => {
      try {
        const response = await apiClient(`/orders/${orderId}`); // No headers
        if (!response.ok) {
          console.error(`Failed to fetch details for order ${orderId}`);
          return null;
        }
        return await response.json();
      } catch (err) {
        if (err.message !== 'Session expired') {
          console.error(`Error fetching details for order ${orderId}:`, err);
        }
        return null;
      }
    };

    useEffect(() => {
        const fetchServedOrders = async () => {
          try {
            setLoading(true);
            setError(null);
            
            // 1. Fetch the list of served orders
            const listResponse = await apiClient('/orders/served'); 
            if (!listResponse.ok) {
              throw new Error('Failed to fetch served orders list');
            }
            const ordersList = await listResponse.json();

            if (!Array.isArray(ordersList)) {
                console.error("API did not return an array", ordersList);
                throw new Error("Invalid data from server.");
            }

            // 2. Fetch details for each order in parallel
            const ordersWithDetails = await Promise.all(
              ordersList.map(order => fetchOrderDetails(order.order_id))
            );
            
            // 3. Filter out any failed requests and set the state
            const newOrders = ordersWithDetails.filter(order => order !== null);
            setServedOrders(newOrders);

          } catch (err) {
            if (err.message !== 'Session expired') {
              setError(err.message);
            }
          } finally {
            setLoading(false);
          }
        };
        
        if (token) {
            fetchServedOrders();
        }
      }, [token]);

      // ... (Rest of component JSX is unchanged) ...
      if (loading) return (
        <>
          <InternalNavBar /> 
          <div className="p-8 text-center text-lg">Loading archive...</div>
        </>
      );
      
      if (error) return (
        <>
          <InternalNavBar />
          <div className="p-8 text-center text-red-500">Error: {error}</div>
        </>
      );

      return (
        <>
          <InternalNavBar />
          <div className="bg-figma-cream min-h-screen px-4 py-8">
            <div className="container mx-auto">
              <h1 className="text-3xl font-bold mb-6 text-center text-figma-dark-green">Served Orders Archive</h1>

              {servedOrders.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">No served orders found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {servedOrders.map(order => (  
                    <div key={order.order_id} className="p-4 rounded-lg shadow-md bg-white">
                      <div className="mb-3 border-b pb-2">
                        <h2 className="font-bold text-lg text-figma-dark-green">Order #{order.order_id}</h2>
                        <p className="text-xs text-gray-500">Time: {new Date(order.order_date).toLocaleString()}</p>
                        <p className="text-sm">Type: <span className="font-medium">{order.order_type}</span></p>
                        <p className="text-sm">Location: <span className="font-medium">{order.delivery_location}</span></p>
                        <p className="text-sm">Status: <span className="font-medium">{order.status}</span></p>
                      </div>
                      <div className="space-y-2 mb-3 grow overflow-y-auto max-h-48 pr-1">
                  <h3 className="font-semibold text-sm">Items:</h3>
                  {order.items && order.items.length > 0 ? (
                    order.items.map(item => (
                      <div key={item.detail_id} className="text-sm ml-2">
                        <span className="font-medium">{item.quantity} x</span> {item.item_name}
                        {item.instructions && <p className="text-xs text-gray-600 italic pl-4">- {item.instructions}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 ml-2">No item details found.</p>
                  )}
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