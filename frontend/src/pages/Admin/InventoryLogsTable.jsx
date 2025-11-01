import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const InventoryLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/inventory/logs', {
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
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLogs();
    }
  }, [token]);

  // --- STYLING (to avoid Tailwind issues) ---
  const tableStyle = {
    minWidth: '100%',
    lineHeight: 'normal', // from leading-normal
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    borderRadius: '0.5rem', // rounded-lg
    overflow: 'hidden',
  };
  
  const thStyle = {
    padding: '12px 24px',
    textAlign: 'left',
    backgroundColor: '#F3F4F6', // gray-100
    color: '#4B5563', // gray-600
    textTransform: 'uppercase',
    fontSize: '0.875rem', // text-sm
    lineHeight: '1.25rem',
  };
  
  const tdStyle = {
    padding: '12px 24px',
    fontSize: '0.875rem', // text-sm
    color: '#374151', // gray-600
    borderBottom: '1px solid #E5E7EB', // border-b border-gray-200
  };

  const getActionStyle = (action) => {
    let color = '#374151'; // Default text
    let fontWeight = 'normal';
    
    if (action.includes('ADD') || action.includes('RESTOCK')) {
      color = '#059669'; // green-700
      fontWeight = '600';
    } else if (action.includes('SUBTRACT') || action.includes('WASTE')) {
      color = '#DC2626'; // red-600
      fontWeight = '600';
    } else if (action.includes('INITIAL')) {
      color = '#4B5563'; // gray-600
      fontWeight = '600';
    }
    
    return {
      color: color,
      fontWeight: fontWeight,
      textTransform: 'capitalize',
      padding: '4px 8px',
      borderRadius: '9999px',
      fontSize: '0.75rem', // text-xs
      backgroundColor: {
        'ADD': '#D1FAE5', // green-100
        'RESTOCK': '#D1FAE5',
        'SUBTRACT': '#FEE2E2', // red-100
        'WASTE': '#FEE2E2',
        'INITIAL': '#F3F4F6' // gray-100
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

  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Inventory Logs</h2>
        <p style={{ color: '#4B5563' }}>Showing the 100 most recent stock changes made by staff.</p>
      </div>

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
            {logs.map((log) => (
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
                  color: (log.action_type.includes('ADD') || log.action_type.includes('RESTOCK')) ? '#059669' : '#DC2626'
                }}>
                  {(log.action_type.includes('ADD') || log.action_type.includes('RESTOCK')) ? '+' : '-'}{log.quantity_change}
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