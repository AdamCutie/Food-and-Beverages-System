import React, { useState } from "react";
import * as XLSX from "xlsx"; 
import { Download, Calendar } from "lucide-react"; 
import toast from "react-hot-toast"; 
import '../AdminTheme.css';

const OrderManagement = ({ orders }) => {
  // --- DATE HELPERS (Local Time) ---
  const getTodayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff)).toLocaleDateString('en-CA');
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
  };

  // --- TIMEZONE FIXER ---
  const fixDate = (dateInput) => {
      if (!dateInput) return new Date();
      const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
      if (dateStr.includes(' ') && !dateStr.includes('T')) return new Date(dateStr.replace(' ', 'T') + 'Z');
      if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) return new Date(dateStr + 'Z');
      return new Date(dateStr);
  };

  const getLocalDatePart = (dateObj) => {
      return new Date(dateObj).toLocaleDateString('en-CA');
  };

  // --- STATE ---
  const [quickFilter, setQuickFilter] = useState('Today');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  // --- HANDLER: Quick Filter Change ---
  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);

    const today = new Date();
    const endStr = getTodayStr();
    let startStr = endStr;

    if (filter === 'Today') {
        startStr = endStr;
    } else if (filter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startStr = yesterday.toLocaleDateString('en-CA');
        setStartDate(startStr);
        setEndDate(startStr);
        return;
    } else if (filter === 'This Week') {
        startStr = getStartOfWeek(today);
    } else if (filter === 'This Month') {
        startStr = getStartOfMonth(today);
    } else if (filter === 'Custom') {
        return; // Don't reset dates
    }

    if (filter !== 'Custom') {
        setStartDate(startStr);
        setEndDate(endStr);
    }
  };

  // --- LOGIC: Filter orders by Date Range ---
  const filteredOrders = orders.filter((order) => {
    if (!startDate && !endDate) return true;

    const orderDateObj = fixDate(order.order_date || order.created_at);
    const orderDateStr = getLocalDatePart(orderDateObj);

    return orderDateStr >= startDate && orderDateStr <= endDate;
  });

  // --- LOGIC: Export Filtered Orders ---
  const handleExportOrders = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export.");
      return;
    }

    const dataToExport = filteredOrders.map(order => ({
      'Order ID': order.order_id,
      'Customer Name': (order.first_name || order.last_name) ? `${order.first_name} ${order.last_name}` : 'Guest',
      'Order Type': order.order_type,
      'Location': order.delivery_location,
      'Date': fixDate(order.order_date).toLocaleString(),
      'Status': order.status,
      'Total Amount': Number(order.total_amount || 0)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { origin: "A4" });

    const title = [{ v: "ORDER MANAGEMENT REPORT", t: "s" }];
    const rangeText = `Filter: ${quickFilter} (${startDate} to ${endDate})`;
    const dateInfo = [{ v: `Generated: ${new Date().toLocaleString()} | ${rangeText}`, t: "s" }];
    
    XLSX.utils.sheet_add_aoa(worksheet, [title, dateInfo], { origin: "A1" });

    const totalRevenue = dataToExport.reduce((acc, curr) => acc + curr['Total Amount'], 0);
    const totalRow = { 'Order ID': "TOTALS:", 'Total Amount': totalRevenue };
    XLSX.utils.sheet_add_json(worksheet, [totalRow], { origin: -1, skipHeader: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `Order_Report_${getTodayStr()}.xlsx`);
    toast.success("Order report downloaded!");
  };

  return (
    <div className="admin-section-container">
      <h2 className="admin-page-title p-6">Order Management</h2>
      
      <div className="admin-table-container">

        {/* --- FILTER & EXPORT CONTROLS --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4 bg-[#fff2e0] p-4 mx-6 rounded-lg border border-[#D1C0B6]">
          
          {/* Date Filter Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#3C2A21]" />
                <span className="text-sm font-bold text-[#3C2A21]">Period:</span>
                
                {/* Dropdown */}
                <select 
                    value={quickFilter} 
                    onChange={handleQuickFilterChange} 
                    className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] h-[40px] bg-white cursor-pointer focus:outline-none focus:border-[#F9A825]"
                    style={{ minWidth: '130px' }}
                >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Custom">Custom</option>
                </select>
            </div>

            {/* Conditional Inputs for Custom Range ONLY */}
            {quickFilter === 'Custom' && (
                <div className="flex items-center gap-2 animate-fadeIn ml-2">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate}
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] bg-white text-sm h-[40px]"
                    />
                    <span className="text-gray-500 font-bold">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="p-2 rounded border border-[#D1C0B6] text-[#3C2A21] bg-white text-sm h-[40px]"
                    />
                </div>
            )}
            
            {/* REMOVED: The text span that showed the date range is gone. */}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportOrders}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-md hover:scale-105 transition-transform"
            style={{ backgroundColor: '#F9A825', color: '#3C2A21' }}
          >
            <Download size={18} />
            Export List
          </button>
        </div>

        {/* --- TABLE --- */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Type</th>
              <th>Location</th>
              <th className="text-center">Total</th>
              <th className="text-center">Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td className="font-medium">{order.order_id}</td>
                  <td>
                    {order.first_name || order.last_name ? `${order.first_name} ${order.last_name}` : 'Guest'}
                  </td>
                  <td>{order.order_type}</td>
                  <td>{order.delivery_location}</td>
                  <td className="text-center font-bold">
                    ₱{parseFloat(order.total_amount || 0).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`status-badge ${
                        order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        order.status === 'served' ? 'bg-green-200 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>{fixDate(order.order_date).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-8 text-gray-500">
                  <p className="text-lg">No orders found.</p>
                  <p className="text-sm">Filter: {quickFilter} ({startDate} - {endDate})</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;