import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../utils/apiClient';
import toast from 'react-hot-toast';

// Helper function to format as PHP Peso
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount || 0);
};

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
        const response = await apiClient('/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data.');
        }
        const result = await response.json();
        setData(result);
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
      fetchAnalytics();
    }
  }, [token]);

  // --- Loading and Error States ---
  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }
  if (error) {
    return <div style={styles.error}>Error: {error}</div>;
  }
  if (!data) {
    return <div style={styles.loading}>No data available.</div>;
  }

  // --- Calculate Percentages for Charts ---
  const totalPayments = data.paymentMethods.reduce((sum, p) => sum + p.total_value, 0) || 1;
  const totalOrders = data.orderTypeDistribution.reduce((sum, o) => sum + o.orders, 0) || 1;
  
  // --- NEW: Calculate Max Sales for Sales Trend bar ---
  const maxSales = data.salesTrends.thisMonth.sales || 1; // Use "This Month" as the 100% mark

  // --- Render UI ---
  return (
    <div style={styles.grid}>
      
      {/* Card 1: Sales Trends (Column 1, Row 1) */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Sales Trends</h3>
        {/* --- 1. USE THE NEW SalesTrendBar COMPONENT --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <SalesTrendBar title="Today" data={data.salesTrends.today} max={maxSales} />
          <SalesTrendBar title="Yesterday" data={data.salesTrends.yesterday} max={maxSales} />
          <SalesTrendBar title="This Week" data={data.salesTrends.thisWeek} max={maxSales} />
          <SalesTrendBar title="This Month" data={data.salesTrends.thisMonth} max={maxSales} />
        </div>
      </div>

      {/* Card 2: Order Type (Column 2, Row 1) */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Order Type Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.orderTypeDistribution.map((type) => (
             <ProgressBar
              key={type.order_type}
              title={type.order_type}
              transactions={type.orders}
              value={type.total_value}
              percent={(type.orders / totalOrders) * 100}
            />
          ))}
        </div>
        <div style={styles.peakBox}>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.peakHour}</span>
            <br />
          <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', opacity: 0.8 }}>Peak Hours</span>
        </div>
      </div>

      {/* Card 3: Top Selling Items (Column 1, Row 2) */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Top Selling Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.topSellingItems.map((item, index) => (
            <TopItemRow 
              key={index} 
              rank={index + 1} 
              name={item.item_name}
              sold={item.total_sold}
              sales={item.total_sales}
            />
          ))}
        </div>
      </div>

      {/* Card 4: Payment Methods (Column 2, Row 2) */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Payment Methods</h3>
        {/* --- 2. USE THE ProgressBar COMPONENT --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.paymentMethods.map((method) => (
            <ProgressBar
              key={method.payment_method}
              title={method.payment_method}
              transactions={method.transactions} // Pass the number of transactions
              value={method.total_value}
              percent={(method.total_value / totalPayments) * 100}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

// --- Sub-Components ---

// --- 3. NEW: Component for Sales Trend bars ---
const SalesTrendBar = ({ title, data, max }) => {
  const sales = data.sales || 0;
  const percent = (sales / max) * 100;

  return (
    <div>
      <div style={styles.progressHeader}>
        <span style={{ fontWeight: '600' }}>{title}</span>
        <span style={{ fontWeight: 'bold' }}>{formatCurrency(sales)}</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{...styles.progressFg, width: `${percent}%`}}></div>
      </div>
      <div style={styles.progressFooter}>
        <span style={styles.textMuted}>{data.orders || 0} orders</span>
        <span style={styles.textMuted}>Avg. {formatCurrency(data.avg_sale)}</span>
      </div>
    </div>
  );
};

const TopItemRow = ({ rank, name, sold, sales }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <span style={styles.rankCircle}>{rank}</span>
    <div>
      <p style={{ fontWeight: '600' }}>{name}</p>
      <p style={styles.textMuted}>{sold} sold</p>
    </div>
    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
      <p style={{ fontWeight: 'bold', color: '#0B3D2E' }}>{formatCurrency(sales)}</p>
    </div>
  </div>
);

// --- 4. FIXED: ProgressBar now shows 'transactions' text ---
const ProgressBar = ({ title, transactions, value, percent }) => (
  <div>
    <div style={styles.progressHeader}>
      <span style={{ fontWeight: '600' }}>{title}</span>
      <span style={{ fontWeight: 'bold' }}>{percent.toFixed(0)}%</span>
    </div>
    <div style={styles.progressBg}>
      <div style={{...styles.progressFg, width: `${percent}%`}}></div>
    </div>
    <div style={styles.progressFooter}>
      <span style={styles.textMuted}>{transactions} transactions</span>
      <span style={styles.textMuted}>{formatCurrency(value)}</span>
    </div>
  </div>
);

// --- Styles (Unchanged) ---
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr', 
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#0B3D2E', // primary
    marginBottom: '1.5rem',
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: '1rem',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '1.25rem',
    color: '#6B7280',
  },
  error: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '1.25rem',
    color: '#DC2626', // Red
    backgroundColor: '#FEF2F2',
    borderRadius: '0.5rem',
  },
  salesRow: { // This style is no longer used, but safe to keep
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #F3F4F6',
  },
  textMuted: {
    fontSize: '0.875rem',
    color: '#6B7280', // Gray
  },
  rankCircle: {
    flexShrink: 0,
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '9999px',
    backgroundColor: '#F9A825', // accent
    color: '#0B3D2E', // primary
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  progressFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  progressBg: {
    width: '100%',
    backgroundColor: '#E5E7EB', // Gray-200
    borderRadius: '9999px',
    height: '0.75rem',
  },
  progressFg: {
    backgroundColor: '#0B3D2E', // primary
    borderRadius: '9999px',
    height: '0.75rem',
  },
  peakBox: {
    backgroundColor: '#0B3D2E', // primary
    color: 'white',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1.5rem',
    textAlign: 'center',
  },
};

export default AnalyticsDashboard;