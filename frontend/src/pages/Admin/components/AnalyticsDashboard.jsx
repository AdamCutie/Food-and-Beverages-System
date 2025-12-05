import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Printer, Filter } from "lucide-react"; // Added Filter icon for visual flair
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import '../AdminTheme.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount || 0);

const THEME_COLORS = ["#3C2A21", "#F9A825", "#8D6E63", "#D1C0B6", "#EF4444"];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const { token } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const queryParam = filterType === "All" ? "" : `?order_type=${filterType}`;
        const response = await apiClient(`/analytics${queryParam}`);
        
        if (!response.ok) throw new Error("Failed to fetch analytics data.");
        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err.message !== "Session expired") {
          setError(err.message);
          toast.error(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token, filterType]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-white text-lg">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-white">No data available.</div>;

  const salesTrendData = [
    { name: "Today", sales: data.salesTrends.today?.sales || 0 },
    { name: "Yesterday", sales: data.salesTrends.yesterday?.sales || 0 },
    { name: "This Week", sales: data.salesTrends.thisWeek?.sales || 0 },
    { name: "This Month", sales: data.salesTrends.thisMonth?.sales || 0 },
  ];

  const orderTypeData = data.orderTypeDistribution.map((o) => ({
    name: o.order_type,
    value: o.orders,
  }));

  const paymentMethodData = (data.paymentMethods || []).map((method) => ({
    name: method.payment_method,
    value: Number(method.total_value) || 0,
  }));

  const topItemsData = data.topSellingItems.map((i) => ({
    name: i.item_name,
    sold: i.total_sold,
    sales: i.total_sales,
  }));

  return (
    <div className="w-full">
      
      {/* --- CONTROLS AREA (Upper Right) --- */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 no-print">
        
        {/* Filter Dropdown (Styled like button) */}
        <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none px-6 py-3 pr-10 rounded-lg font-bold shadow-lg outline-none cursor-pointer transition-transform hover:scale-105"
              style={{ 
                backgroundColor: '#F9A825', 
                color: '#3C2A21',
                border: 'none',
                textAlign: 'center'
              }}
            >
              <option value="All">All Orders</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Room Service">Room Service</option>
              <option value="Walk-in">Walk-in</option>
            </select>
            {/* Custom Arrow Icon for Dropdown */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                <Filter size={18} />
            </div>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-transform hover:scale-105 shadow-lg"
          style={{ backgroundColor: '#F9A825', color: '#3C2A21' }}
        >
          <Printer size={20} />
          Print Report
        </button>
      </div>

      {/* --- PRINTABLE DASHBOARD --- */}
      <div id="printable-dashboard" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: Sales Trends */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#3C2A21' }}>Sales Trends</h3>
            {/* Dropdown removed from here */}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1C0B6" />
              <XAxis dataKey="name" stroke="#3C2A21" />
              <YAxis stroke="#3C2A21" />
              <Tooltip
                formatter={(val) => formatCurrency(val)}
                contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                name="Total Sales"
                stroke="#F9A825"
                strokeWidth={3}
                activeDot={{ r: 8, fill: '#3C2A21' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CARD 2: Order Type Distribution */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a] flex flex-col">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3C2A21' }}>Order Type Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {orderTypeData.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: '#3C2A21', color: '#F9A825' }}>
            <span className="text-2xl font-bold block">{data.peakHour}</span>
            <span className="text-sm opacity-90 text-white">Peak Hours</span>
          </div>
        </div>

        {/* CARD 3: Top Selling Items */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3C2A21' }}>Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItemsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1C0B6" />
              <XAxis dataKey="name" stroke="#3C2A21" />
              <YAxis stroke="#3C2A21" />
              <Tooltip
                formatter={(val) => formatCurrency(val)}
                contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }}
              />
              <Bar dataKey="sales" fill="#3C2A21" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CARD 4: Payment Methods */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3C2A21' }}>Payment Methods</h3>
          {paymentMethodData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No payment data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {paymentMethodData.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₱${val.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;