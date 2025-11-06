import React, { useEffect, useState } from "react";
import { CircleDollarSign, ShoppingCart, Box, Users } from "lucide-react";
import apiClient from "../../../utils/apiClient";

const AdminDashboard = () => {
  const [data, setData] = useState({
    summary: {
      totalSales: 0,
      salesGrowth: 0,
      activeOrders: 0,
      ordersGrowth: 0,
      lowStock: 0,
      lowStockGrowth: 0,
      totalStaff: 0,
    },
    recentOrders: [],
    stockAlerts: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient("/dashboard/summary");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  const { summary, recentOrders, stockAlerts } = data;

  return (
    <div className="min-h-screen bg-[#4b0a0a] text-white p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Sales */}
        <div className="bg-[#5c0e0e] rounded-xl p-5 shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-2">
            <CircleDollarSign className="text-orange-400" size={28} />
            <span
              className={`text-xs font-semibold ${
                summary.salesGrowth >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {summary.salesGrowth >= 0
                ? `+${summary.salesGrowth}%`
                : `${summary.salesGrowth}%`}
            </span>
          </div>
          <h3 className="text-sm text-gray-300">Total Sales Today</h3>
          <p className="text-3xl font-bold mt-1">
            ₱{summary.totalSales.toLocaleString()}
          </p>
        </div>

        {/* Active Orders */}
        <div className="bg-[#5c0e0e] rounded-xl p-5 shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-2">
            <ShoppingCart className="text-blue-400" size={28} />
            <span
              className={`text-xs font-semibold ${
                summary.ordersGrowth >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {summary.ordersGrowth >= 0
                ? `+${summary.ordersGrowth}%`
                : `${summary.ordersGrowth}%`}
            </span>
          </div>
          <h3 className="text-sm text-gray-300">Active Orders</h3>
          <p className="text-3xl font-bold mt-1">{summary.activeOrders}</p>
        </div>

        {/* Low Stock */}
        {/* --- MODIFICATION 1: Added conditional "Action needed" label --- */}
        <div className="bg-[#5c0e0e] rounded-xl p-5 shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-2">
            <Box className="text-red-400" size={28} />
            
            {/* This logic checks if count is 3 or more */}
            {summary.lowStock >= 3 ? (
              <span className="text-xs font-semibold text-red-300 animate-pulse">
                Action needed
              </span>
            ) : (
              // If not, it shows the original growth %
              <span className="text-red-300 text-xs font-semibold">
                {summary.lowStockGrowth >= 0
                  ? `+${summary.lowStockGrowth}%`
                  : `${summary.lowStockGrowth}%`}
              </span>
            )}
            
          </div>
          <h3 className="text-sm text-gray-300">Low Stock Items</h3>
          <p className="text-3xl font-bold mt-1">{summary.lowStock}</p>
        </div>

        {/* Total Customers */}
        <div className="bg-[#5c0e0e] rounded-xl p-5 shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-2">
            <Users className="text-green-400" size={28} />
          </div>
          <h3 className="text-sm text-gray-300">Total Staff</h3>
          <p className="text-3xl font-bold mt-1">{summary.totalStaff}</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-[#fff2e0] text-black rounded-xl shadow-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
          </div>
          {recentOrders.length > 0 ? (
            <ul>
              {recentOrders.map((order) => (
                <li
                  key={order.order_id}
                  className="flex justify-between items-center border-b border-gray-300 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">ORD-{order.order_id}</p>
                    
                    {/* --- MODIFICATION 2: Fixed to use real data --- */}
                    {/* This now uses data from the API (order_type and delivery_location) */}
                    <p className="text-gray-600">
                      {order.order_type === 'Dine-in'
                        ? `Table: ${order.delivery_location}`
                        : `Order Type: ${order.order_type}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>₱{order.total_amount}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "preparing"
                          ? "bg-blue-200 text-blue-800"
                          : order.status === "ready"
                          ? "bg-green-200 text-green-800"
                          : order.status === "delivered"
                          ? "bg-purple-200 text-purple-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-center">No recent orders</p>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-[#fff2e0] text-black rounded-xl shadow-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Stock Alerts</h2>
          {stockAlerts.length > 0 ? (
            <ul>
              {stockAlerts.map((item) => (
                <li
                  key={item.ingredient_id}
                  className="flex justify-between items-center border-b border-gray-300 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-gray-600">{item.supplier_name}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.stock === 0
                        ? "bg-red-200 text-red-800"
                        : "bg-orange-200 text-orange-800"
                    }`}
                  >
                    {item.stock === 0 ? "out-of-stock" : "low-stock"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-center">No low-stock items</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-10 text-amber-400 font-semibold">
        Celestia Hotel • Quezon City
      </div>
    </div>
  );
};

export default AdminDashboard;