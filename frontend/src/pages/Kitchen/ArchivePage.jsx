import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ArchivePage() {
  const [servedOrders, setServedOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServedOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/orders/served'); // Use the new endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch served orders');
        }
        const data = await response.json();
        setServedOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServedOrders();
  }, []);

  if (loading) return <div className="p-8 text-center text-lg">Loading archive...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
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
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link to="/kitchen" className="text-blue-500 hover:underline">&larr; Back to Kitchen Display</Link>
        </div>
      </div>
    </div>
  );
}

export default ArchivePage;