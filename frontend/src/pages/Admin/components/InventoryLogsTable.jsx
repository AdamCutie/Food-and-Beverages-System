import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Filter, Calendar } from 'lucide-react'; // Added Calendar icon
import { useAuth } from '../../../context/AuthContext'; 
import apiClient from '../../../utils/apiClient';
import '../AdminTheme.css';

const InventoryLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token } = useAuth();

  // --- FILTERS STATE ---
  const [filterSource, setFilterSource] = useState('All');
  const [quickFilter, setQuickFilter] = useState('Today');
  
  // --- DATE HELPERS (Local Time) ---
  const getTodayStr = () => new Date().toLocaleDateString('en-CA');
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff)).toLocaleDateString('en-CA');
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
  };

  // Initial Dates
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

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

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await apiClient('/inventory/logs');
        if (!response.ok) throw new Error('Failed to fetch inventory logs.');
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        if (err.message !== 'Session expired') {
          setError(err.message);
          toast.error(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLogs();
  }, [token]);

  // --- HANDLERS ---
  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);
    const today = new Date();
    const endStr = getTodayStr();
    let startStr = endStr;

    if (filter === 'Today') { startStr = endStr; }
    else if (filter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startStr = yesterday.toLocaleDateString('en-CA');
        setStartDate(startStr); setEndDate(startStr); return;
    } else if (filter === 'This Week') { startStr = getStartOfWeek(today); }
    else if (filter === 'This Month') { startStr = getStartOfMonth(today); }
    else if (filter === 'Custom') { return; }

    if (filter !== 'Custom') { setStartDate(startStr); setEndDate(endStr); }
  };

  const getActionStyle = (action) => {
    if (action.includes('ADD') || action.includes('RESTOCK')) return { color: '#059669', backgroundColor: '#D1FAE5' };
    if (action.includes('SUBTRACT') || action.includes('WASTE')) return { color: '#DC2626', backgroundColor: '#FEE2E2' };
    return { color: '#4B5563', backgroundColor: '#E5E7EB' };
  };

  // --- FILTER LOGIC (Source + Date) ---
  const filteredLogs = logs.filter(log => {
    // 1. Source Check
    let sourceMatch = true;
    if (filterSource !== 'All') {
        const isSystemLog = log.staff_name === 'System (Order)';
        sourceMatch = filterSource === 'System' ? isSystemLog : !isSystemLog;
    }

    // 2. Date Range Check
    const logDateObj = fixDate(log.timestamp);
    const logDateStr = getLocalDatePart(logDateObj);
    const dateMatch = logDateStr >= startDate && logDateStr <= endDate;

    return sourceMatch && dateMatch;
  });

  if (loading) return <div className="p-8 text-center text-white text-lg">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="w-full">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
            <h2 className="admin-page-title mb-1">Inventory Logs</h2>
            <p className="text-sm text-gray-300">Recent Activity: {filteredLogs.length} entries</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 justify-end">
            
            {/* 1. Date Filter Dropdown */}
            <div className="relative">
                <select 
                    value={quickFilter} 
                    onChange={handleQuickFilterChange} 
                    className="admin-select-primary appearance-none pr-10"
                    style={{ minWidth: '150px' }}
                >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Custom">Custom</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Calendar size={18} />
                </div>
            </div>

            {/* Custom Range Inputs (Only show if Custom) */}
            {quickFilter === 'Custom' && (
                <div className="flex items-center gap-2 animate-fadeIn bg-[#fff2e0] p-1 rounded-lg border border-[#6e1a1a]">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate} className="admin-input-date h-10"/>
                    <span className="text-gray-700 font-bold">-</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="admin-input-date h-10"/>
                </div>
            )}

            {/* 2. Source Filter Dropdown */}
            <div className="relative">
                <select 
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="admin-select-primary appearance-none pr-10"
                    style={{ minWidth: '150px' }}
                >
                    <option value="All">All Sources</option>
                    <option value="Staff">Staff Actions</option>
                    <option value="System">System Actions</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Filter size={18} />
                </div>
            </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ingredient</th>
              <th>Staff Member</th>
              <th>Action</th>
              <th>Qty</th>
              <th>New Stock</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                <tr key={log.log_id}>
                    <td>{fixDate(log.timestamp).toLocaleString()}</td>
                    <td className="font-medium">{log.ingredient_name}</td>
                    <td>{log.staff_name}</td>
                    <td>
                    <span className="status-badge" style={getActionStyle(log.action_type)}>
                        {log.action_type.replace('_', ' ').toLowerCase()}
                    </span>
                    </td>
                    <td style={{
                        fontWeight: 'bold',
                        color: (log.action_type.includes('ADD') || log.action_type.includes('RESTOCK') || log.action_type === 'INITIAL') ? '#059669' : '#DC2626'
                    }}>
                    {(log.action_type.includes('ADD') || log.action_type.includes('RESTOCK') || log.action_type === 'INITIAL') ? '+' : '-'}{log.quantity_change}
                    </td>
                    <td className="font-bold">{log.new_stock_level}</td>
                    <td>{log.reason || 'N/A'}</td>
                </tr>
                ))
            ) : (
                <tr><td colSpan="7" className="text-center p-8 text-gray-500">No logs found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryLogsTable;