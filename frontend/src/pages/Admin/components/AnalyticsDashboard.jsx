import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { Filter, Download, FileSpreadsheet, Printer } from "lucide-react"; // ✅ Added Printer Icon
import * as XLSX from "xlsx";
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

  const createSheet = (dataToExport, reportTitle) => {
    if (!dataToExport || dataToExport.length === 0) return XLSX.utils.json_to_sheet([]);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { origin: "A4" });
    const title = [{ v: reportTitle.toUpperCase(), t: "s" }];
    const date = [{ v: `Generated: ${new Date().toLocaleString()}`, t: "s" }];
    XLSX.utils.sheet_add_aoa(worksheet, [title, date], { origin: "A1" });
    
    const totalRow = {};
    const firstItem = dataToExport[0];
    Object.keys(firstItem).forEach(key => {
      if (key === Object.keys(firstItem)[0]) {
        totalRow[key] = "TOTALS:";
      } else if (typeof firstItem[key] === 'number') {
        const sum = dataToExport.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        totalRow[key] = sum;
      } else {
        totalRow[key] = "";
      }
    });
    XLSX.utils.sheet_add_json(worksheet, [totalRow], { origin: -1, skipHeader: true });
    return worksheet;
  };

  const handleExportAll = () => {
    if (!data) return;
    const salesData = [
      { name: "Today", sales: data.salesTrends.today?.sales || 0, orders: data.salesTrends.today?.fb_orders || 0 },
      { name: "Yesterday", sales: data.salesTrends.yesterday?.sales || 0, orders: data.salesTrends.yesterday?.fb_orders || 0 },
      { name: "This Week", sales: data.salesTrends.thisWeek?.sales || 0, orders: data.salesTrends.thisWeek?.fb_orders || 0 },
      { name: "This Month", sales: data.salesTrends.thisMonth?.sales || 0, orders: data.salesTrends.thisMonth?.fb_orders || 0 },
    ].map(d => ({ Period: d.name, 'Total Sales (PHP)': d.sales, 'Total Orders': d.orders }));

const orderData = data.orderTypeDistribution
      .filter(o => o.order_type !== "Phone Order") // ✅ FILTER HERE TOO
      .map((o) => ({
        'Order Type': o.order_type,
        'Order Count': o.orders,
        'Total Revenue': Number(o.total_value) || 0
      }));

    const itemsData = data.topSellingItems.map((i, index) => ({
      Rank: index + 1,
      'Item Name': i.item_name,
      'Quantity Sold': i.total_sold,
      'Total Sales (PHP)': i.total_sales
    }));

    const paymentData = (data.paymentMethods || []).map((method) => ({
      'Payment Method': method.payment_method,
      'Transactions': method.transactions,
      'Total Value (PHP)': Number(method.total_value) || 0
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, createSheet(salesData, "Sales Trends Report"), "Sales Trends");
    XLSX.utils.book_append_sheet(workbook, createSheet(orderData, "Order Type Report"), "Order Types");
    XLSX.utils.book_append_sheet(workbook, createSheet(itemsData, "Top Selling Items"), "Top Items");
    XLSX.utils.book_append_sheet(workbook, createSheet(paymentData, "Payment Methods"), "Payments");

    XLSX.writeFile(workbook, `Daily_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Full Daily Report Downloaded!");
  };

  const exportToExcel = (dataToExport, fileName, sheetName) => {
    const worksheet = createSheet(dataToExport, fileName.replace(/_/g, " "));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success(`${fileName}.xlsx downloaded!`);
  };

  if (loading) return <div className="p-8 text-center text-white text-lg">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-white">No data available.</div>;

  const salesTrendData = [
    { name: "Today", sales: data.salesTrends.today?.sales || 0, orders: data.salesTrends.today?.fb_orders || 0 },
    { name: "Yesterday", sales: data.salesTrends.yesterday?.sales || 0, orders: data.salesTrends.yesterday?.fb_orders || 0 },
    { name: "This Week", sales: data.salesTrends.thisWeek?.sales || 0, orders: data.salesTrends.thisWeek?.fb_orders || 0 },
    { name: "This Month", sales: data.salesTrends.thisMonth?.sales || 0, orders: data.salesTrends.thisMonth?.fb_orders || 0 },
  ];

const orderTypeData = (data.orderTypeDistribution || [])
    .filter((o) => o.order_type !== "Phone Order") // ✅ FILTER: Remove Phone Order
    .map((o) => ({
      name: o.order_type,
      value: o.orders,
      revenue: o.total_value
    }));

  const paymentMethodData = (data.paymentMethods || []).map((method) => ({
    name: method.payment_method,
    value: Number(method.total_value) || 0,
    count: method.transactions
  }));

  const topItemsData = data.topSellingItems.map((i) => ({
  name: i.item_name,
  sold: Number(i.total_sold), 
  sales: Number(i.total_sales),
}));

  return (
    <div className="w-full">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 no-print"> {/* Added 'no-print' class */}
        <div>
            <h2 className="admin-page-title">Analytics Dashboard</h2>
            <p className="text-sm text-gray-300">Overview of sales and performance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none px-6 py-3 pr-10 rounded-lg font-bold shadow-lg outline-none cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: '#F9A825', color: '#3C2A21', border: 'none', textAlign: 'center' }}
                >
                  <option value="All">All Orders</option>
                  <option value="Dine-in">Dine-in</option>
                  <option value="Room Dining">Room Dining</option>
                  <option value="Walk-in">Walk-in</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Filter size={18} />
                </div>
            </div>

            {/* ✅ NEW: Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-transform hover:scale-105 shadow-lg bg-white text-[#3C2A21] hover:bg-gray-100"
            >
              <Printer size={20} />
              Print PDF
            </button>

            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#F9A825', color: '#3C2A21' }}
            >
              <FileSpreadsheet size={20} />
              Export Report
            </button>
        </div>
      </div>

      {/* ✅ ID for Print Layout Targeting */}
      <div id="printable-dashboard" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: Sales Trends */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#3C2A21' }}>Sales Trends</h3>
            <button 
              onClick={() => exportToExcel(
                salesTrendData.map(d => ({ Period: d.name, 'Total Sales (PHP)': d.sales, 'Total Orders': d.orders })), 
                'Sales_Trends_Report'
              )}
              className="text-[#3C2A21] hover:text-[#F9A825] transition-colors no-print"
            >
              <Download size={20} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1C0B6" />
              <XAxis dataKey="name" stroke="#3C2A21" />
              <YAxis stroke="#3C2A21" />
              <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }} />
              <Legend />
              <Line type="monotone" dataKey="sales" name="Total Sales" stroke="#F9A825" strokeWidth={3} activeDot={{ r: 8, fill: '#3C2A21' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CARD 2: Order Type Distribution */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#3C2A21' }}>Order Type Distribution</h3>
            <button 
              onClick={() => exportToExcel(
                orderTypeData.map(d => ({ 'Order Type': d.name, 'Order Count': d.value, 'Total Revenue': Number(d.revenue) })), 
                'Order_Type_Report'
              )}
              className="text-[#3C2A21] hover:text-[#F9A825] transition-colors no-print"
            >
              <Download size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={orderTypeData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {orderTypeData.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 3: Top Selling Items */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#3C2A21' }}>Top Selling Items</h3>
            <button 
              onClick={() => exportToExcel(
                topItemsData.map((d, index) => ({ Rank: index + 1, 'Item Name': d.name, 'Quantity Sold': d.sold, 'Total Sales (PHP)': d.sales })), 
                'Top_Selling_Items_Report'
              )}
              className="text-[#3C2A21] hover:text-[#F9A825] transition-colors no-print"
            >
              <Download size={20} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItemsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1C0B6" />
              <XAxis dataKey="name" stroke="#3C2A21" />
              <YAxis stroke="#3C2A21" />
              <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }} />
              <Bar dataKey="sold" fill="#3C2A21" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CARD 4: Payment Methods */}
        <div className="admin-card bg-[#fff2e0] p-6 rounded-xl shadow-md border border-[#6e1a1a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" style={{ color: '#3C2A21' }}>Payment Methods</h3>
            <button 
              onClick={() => exportToExcel(
                paymentMethodData.map(d => ({ 'Payment Method': d.name, 'Transactions': d.count, 'Total Value (PHP)': d.value })), 
                'Payment_Methods_Report'
              )}
              className="text-[#3C2A21] hover:text-[#F9A825] transition-colors no-print"
            >
              <Download size={20} />
            </button>
          </div>
          {(data.paymentMethods && data.paymentMethods.length > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentMethodData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {paymentMethodData.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₱${val.toLocaleString()}`} contentStyle={{ backgroundColor: '#fff2e0', borderColor: '#D1C0B6', color: '#3C2A21' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No payment data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;