import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext'; 
import apiClient from '../../../utils/apiClient'; // This should be here

const InventoryLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  
  // --- 1. ADD NEW STATE FOR THE FILTER ---
  const [filterSource, setFilterSource] = useState('All'); // 'All', 'Staff', 'System'

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await apiClient('/inventory/logs', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch inventory logs.');
        }
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

    if (token) {
      fetchLogs();
    }
  }, [token]);

  // --- STYLING (with new styles for the filter) ---
  const tableStyle = {
    minWidth: '100%',
    lineHeight: 'normal',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  };
  
  const thStyle = {
    padding: '12px 24px',
    textAlign: 'left',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    textTransform: 'uppercase',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  };
  
  const tdStyle = {
    padding: '12px 24px',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #E5E7EB',
  };

  // --- NEW STYLES FOR THE DROPDOWN ---
  const filterContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const selectStyle = {
    border: '1px solid #D1D5DB', // gray-300
    borderRadius: '0.375rem', // rounded-md
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    padding: '8px 12px',
    fontSize: '0.875rem', // text-sm
  };
  // --- END OF NEW STYLES ---

  const getActionStyle = (action) => {
    // ... (This function is unchanged) ...
    let color = '#374151'; 
    let fontWeight = 'normal';
    if (action.includes('ADD') || action.includes('RESTOCK')) {
      color = '#059669';
      fontWeight = '600';
    } else if (action.includes('SUBTRACT') || action.includes('WASTE')) {
      color = '#DC2626';
      fontWeight = '600';
    } else if (action.includes('INITIAL')) {
      color = '#4B5563';
      fontWeight = '600';
    }
    return {
      color: color,
      fontWeight: fontWeight,
      textTransform: 'capitalize',
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      backgroundColor: {
        'ADD': '#D1FAE5',
        'RESTOCK': '#D1FAE5',
        'SUBTRACT': '#FEE2E2',
        'WASTE': '#FEE2E2',
        'INITIAL': '#F3F4F6'
      }[action] || '#F3F4F6',
    };
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading inventory logs...</div>;
  }

  if (error) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  }

  // --- 2. ADD FILTER LOGIC ---
  const filteredLogs = logs.filter(log => {
    if (filterSource === 'All') {
      return true;
    }
    // The backend query aliases system logs as 'System (Order)'
    const isSystemLog = log.staff_name === 'System (Order)';
    
    if (filterSource === 'Staff') {
      return !isSystemLog;
    }
    if (filterSource === 'System') {
      return isSystemLog;
    }
    return true;
  });

  return (
    <div style={{ marginTop: '48px' }}>
      
      {/* --- 3. ADD FILTER UI --- */}
      <div style={filterContainerStyle}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Inventory Logs</h2>
          <p style={{ color: '#4B5563' }}>Showing {filteredLogs.length} most recent stock changes.</p>
        </div>
        <div>
          <label htmlFor="log-filter" style={{ marginRight: '8px', fontSize: '0.875rem', fontWeight: '500' }}>
            Filter by source:
          </label>
          <select 
            id="log-filter"
            style={selectStyle}
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          >
            <option value="All">Show All</option>
            <option value="Staff">Staff Actions Only</option>
            <option value="System">System Actions Only</option>
          </select>
        </div>
      </div>
      {/* --- END OF FILTER UI --- */}

      <div style={tableStyle}>
        <table style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Ingredient</th>
              <th style={thStyle}>Staff Member</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>New Stock Level</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'white' }}>
            {/* --- 4. MAP THE FILTERED ARRAY --- */}
            {filteredLogs.map((log) => (
              <tr key={log.log_id}>
                <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={{ ...tdStyle, fontWeight: '500' }}>{log.ingredient_name}</td>
                <td style={tdStyle}>{log.staff_name}</td>
                <td style={tdStyle}>
                  <span style={getActionStyle(log.action_type)}>
                    {log.action_type.replace('_', ' ').toLowerCase()}
                  </span>
                </td>
                <td style={{
              ...tdStyle,
        fontWeight: '600',
         color: (log.action_type.includes('ADD') || log.action_type.includes('RESTOCK') || log.action_type === 'INITIAL') ? '#059669' : '#DC2626'
                }}>
             {(log.action_type.includes('ADD') || log.action_type.includes('RESTOCK') || log.action_type === 'INITIAL') ? '+' : '-'}{log.quantity_change}
                </td>
                <td style={{ ...tdStyle, fontWeight: '600' }}>{log.new_stock_level}</td>
                <td style={tdStyle}>{log.reason || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryLogsTable;