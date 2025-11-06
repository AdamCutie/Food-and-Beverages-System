import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../utils/apiClient";
import toast from "react-hot-toast";
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

// Helper: PHP currency format
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount || 0);

const COLORS = ["#0B3D2E", "#F9A825", "#10B981", "#3B82F6", "#EF4444"];

// --- Main Component ---
const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await apiClient("/analytics");
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
  }, [token]);

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!data) return <div style={styles.loading}>No data available.</div>;

  // --- Derived totals ---
  const totalPayments =
    data.paymentMethods.reduce((sum, p) => sum + p.total_value, 0) || 1;
  const totalOrders =
    data.orderTypeDistribution.reduce((sum, o) => sum + o.orders, 0) || 1;

  // --- Chart Data Preparation ---
  const salesTrendData = [
    {
      name: "Today",
      sales: data.salesTrends.today.sales,
    },
    {
      name: "Yesterday",
      sales: data.salesTrends.yesterday.sales,
    },
    {
      name: "This Week",
      sales: data.salesTrends.thisWeek.sales,
    },
    {
      name: "This Month",
      sales: data.salesTrends.thisMonth.sales,
    },
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
    <div style={styles.grid}>
      {/* Sales Trend Chart */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Sales Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={salesTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(val) => formatCurrency(val)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#0B3D2E"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Order Type Distribution */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Order Type Distribution</h3>
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
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div style={styles.peakBox}>
          <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {data.peakHour}
          </span>
          <br />
          <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>
            Peak Hours
          </span>
        </div>
      </div>

      {/* Top Selling Items */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Top Selling Items</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topItemsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(val) => formatCurrency(val)} />
            <Bar dataKey="sales" fill="#F9A825" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods */}
        <div style={styles.card}>
      <h3 style={styles.cardTitle}>Payment Methods</h3>

      {paymentMethodData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6B7280" }}>
          No payment data available.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={paymentMethodData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {paymentMethodData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `₱${val.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
    </div>
  );
};

// --- Styles ---
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#0B3D2E",
    marginBottom: "1rem",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.25rem",
    color: "#6B7280",
  },
  error: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.25rem",
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    borderRadius: "0.5rem",
  },
  peakBox: {
    backgroundColor: "#0B3D2E",
    color: "white",
    borderRadius: "0.5rem",
    padding: "1rem",
    marginTop: "1.5rem",
    textAlign: "center",
  },
};

export default AnalyticsDashboard;
