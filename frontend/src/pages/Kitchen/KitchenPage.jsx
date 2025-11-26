import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Clock, Package, CheckCircle, CheckCircle2 } from 'lucide-react';
import InternalNavBar from './components/InternalNavBar';
import apiClient from '../../utils/apiClient';

const pageContainerStyle = {
  backgroundColor: '#523a2eff', // The new dark brown background
  minHeight: 'calc(100vh - 84px)', // Full height minus the navbar
  padding: '32px 16px',
};

const pageTitleStyle = {
  fontSize: '1.875rem', // 30px
  fontWeight: 'bold',
  marginBottom: '24px',
  textAlign: 'center',
  color: '#F9A825', // Make the title white
};

const getStatusStyles = (status) => {
  const statusLower = status?.toLowerCase();
  let styles = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'capitalize',
  };

  if (statusLower === 'pending') {
    styles.backgroundColor = '#FEF3C7'; // yellow-200
    styles.color = '#B45309'; // yellow-800
  } else if (statusLower === 'preparing') {
    styles.backgroundColor = '#DBEAFE'; // blue-200
    styles.color = '#1E40AF'; // blue-800
  } else if (statusLower === 'ready') {
    styles.backgroundColor = '#D1FAE5'; // green-200
    styles.color = '#065F46'; // green-800
  } else {
    styles.backgroundColor = '#F3F4F6'; // gray-200
    styles.color = '#4B5563'; // gray-800
  }
  return styles;
};

const styles = {
  card: {
    backgroundColor: '#fff2e0',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative', // For the status tag
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #E5E7EB',
  },
  cardTitle: {
    fontSize: '1.5rem', // 24px
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: '100px', // Make space for the status tag
  },
  cardTime: {
    fontSize: '0.875rem', // 14px
    color: '#6B7280',
  },
  cardBody: {
    padding: '16px',
    flex: 1, // This pushes the footer to the bottom
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoLine: {
    fontSize: '0.875rem',
    color: '#374151',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#111827',
  },
  itemsListContainer: {
    marginTop: '8px',
  },
  itemsListTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#111827',
  },
  itemEntry: {
    marginTop: '4px',
    fontSize: '0.875rem',
  },
  itemName: {
    fontWeight: '500',
    color: '#1F2937',
  },
  itemInstructions: {
    fontSize: '0.875rem',
    color: '#EF4444', // Red to stand out
    fontStyle: 'italic',
    marginLeft: '16px',
  },
  cardFooter: {
    padding: '16px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
  },
  primaryButton: {
    flex: 1, // Makes the button grow
    backgroundColor: '#3B82F6', // blue-500
    color: 'white',
    padding: '10px 16px',
    borderRadius: '0.375rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
  },
  iconButton: {
    backgroundColor: '#EF4444', // red-500
    color: 'white',
    padding: '10px',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff2e0', // Dark brown background
    padding: '16px',
    borderRadius: '0.5rem',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: '16px',
  },
  filterBox: {
    display: 'flex',
    flexDirection: 'column',
    width: '33.33%', // Each filter takes up 1/3 of the container
  },
  filterLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '4px',
    color: 'brown', // Use the accent orange for the label
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ffffff', // A lighter brown border
    borderRadius: '0.375rem',
    backgroundColor: '#ffffff', // A slightly lighter brown for the box
    color: 'brown', // White text
    fontSize: '1rem',
    cursor: 'pointer',
  },
  summaryCardContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#FAEBD7', // The new light cream background
    borderRadius: '1rem', // 16px, for the high rounding
    padding: '16px',
    flex: 1, // Makes all 4 cards share the space equally
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  summaryCardContent: {

  },
  summaryCardTitle: {
    color: '#3C2A21', 
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryCardCount: {
    color: '#3C2A21', // Dark brown text
    fontSize: '2.25rem',
    fontWeight: 'bold',
  },
  summaryIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%', // Circle
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },

  iconPending: {
    backgroundColor: '#F59E0B', // Amber/Yellow
  },
  iconPreparing: {
    backgroundColor: '#3B82F6', // Blue
  },
  iconReady: {
    backgroundColor: '#10B981', // Green
  },
  iconServed: {
    backgroundColor: '#6B7280', // Gray
  },
};


function KitchenPage() {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All Types');

  const [servedCount, setServedCount] = useState(0);

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await apiClient(`/orders/${orderId}`); 
      if (!response.ok) {
        console.error(`Failed to fetch details for order ${orderId}`);
        return null;
      }
      return await response.json();
    } catch (err) {
      if (err.message !== 'Session expired') {
        console.error(`Error fetching details for order ${orderId}:`, err);
      }
      return null;
    }
  };

  const fetchAndPopulateOrders = async (isInitialLoad = false) => {
    if (!isInitialLoad && isPolling) return;
    if (isInitialLoad) setLoading(true);
    setIsPolling(true);
    setError(null);

    try {
      const [kitchenResponse, servedResponse] = await Promise.all([
        apiClient('/orders/kitchen'),
        apiClient('/orders/served') 
      ]);

      if (!kitchenResponse.ok) {
        throw new Error('Failed to fetch kitchen orders list');
      }
      if (!servedResponse.ok) {
        throw new Error('Failed to fetch served orders list');
      }

      const ordersList = await kitchenResponse.json();
      const servedList = await servedResponse.json(); 

      if (!Array.isArray(ordersList)) throw new Error("Invalid data from server (kitchen).");
      if (!Array.isArray(servedList)) throw new Error("Invalid data from server (served).");

      setServedCount(servedList.length);

      const ordersWithDetails = await Promise.all(
        ordersList.map(order => fetchOrderDetails(order.order_id))
      );

      const newOrders = ordersWithDetails.filter(order => order !== null);

      if (Array.isArray(newOrders)) {
          setKitchenOrders(newOrders);
      } else {
          setKitchenOrders([]); 
      }
    } catch (err) {
       if (err.message !== 'Session expired') {
        setError(err.message);
        setKitchenOrders([]);
      }
    } finally {
      if (isInitialLoad) setLoading(false);
      setIsPolling(false);
    }
  };


  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await apiClient(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      });

      if (!response.ok) {
        let errorMsg = `Failed to update status to ${newStatus}`;
        try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; } catch(e) {}
        throw new Error(errorMsg);
      }

      setKitchenOrders(currentOrders => {
        if (!Array.isArray(currentOrders)) return []; 
        
        if (newStatus.toLowerCase() === 'served' || newStatus.toLowerCase() === 'cancelled') {
          return currentOrders.filter(order => order.order_id !== orderId);
        } else {
          return currentOrders.map(order =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          );
        }
      });
      toast.success(`Order #${orderId} marked as ${newStatus}`);
    } catch (err) {
       if (err.message !== 'Session expired') {
        console.error("Status update error:", err);
        toast.error(err.message);
      }
    }
  };

  useEffect(() => {
    fetchAndPopulateOrders(true);
    const intervalId = setInterval(() => {
      fetchAndPopulateOrders(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Calculations moved here to be accessible in the main return ---
  const filteredOrders = Array.isArray(kitchenOrders) ? kitchenOrders.filter(order => {
    const statusMatch = filterStatus === 'All' || (order.status && order.status.toLowerCase() === filterStatus.toLowerCase());
    const typeMatch = filterType === 'All Types' || (order.order_type && order.order_type.toLowerCase() === filterType.toLowerCase());
    return statusMatch && typeMatch;
  }) : []; 

  const pendingCount = kitchenOrders.filter(o => o.status.toLowerCase() === 'pending').length;
  const preparingCount = kitchenOrders.filter(o => o.status.toLowerCase() === 'preparing').length;
  const readyCount = kitchenOrders.filter(o => o.status.toLowerCase() === 'ready').length;
  
  return (
    <>
    {/* Navbar always displays now */}
    <InternalNavBar />
    
    <div style={pageContainerStyle}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}> 
        <h1 style={pageTitleStyle}>Kitchen Order Display</h1>

        {/* === LOADING STATE === */}
        {loading ? (
            <div className="p-8 text-center text-lg" style={{ color: '#ffffff' }}>
                Loading active orders...
            </div>
        ) : (
            /* === CONTENT STATE === */
            <>
                {/* ERROR MESSAGE */}
                {error && kitchenOrders.length === 0 && (
                    <div className="p-8 text-center text-red-500 bg-white rounded-lg mb-6">
                        Error: {error}
                    </div>
                )}

                <div style={styles.summaryCardContainer}>
                    {/* Pending Card */}
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryCardContent}>
                        <h3 style={styles.summaryCardTitle}>Pending</h3>
                        <p style={styles.summaryCardCount}>{pendingCount}</p>
                        </div>
                        <div style={{...styles.summaryIconWrapper, ...styles.iconPending}}>
                        <Clock size={24} />
                        </div>
                    </div>

                    {/* Preparing Card */}
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryCardContent}>
                        <h3 style={styles.summaryCardTitle}>Preparing</h3>
                        <p style={styles.summaryCardCount}>{preparingCount}</p>
                        </div>
                        <div style={{...styles.summaryIconWrapper, ...styles.iconPreparing}}>
                        <Package size={24} />
                        </div>
                    </div>

                    {/* Ready Card */}
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryCardContent}>
                        <h3 style={styles.summaryCardTitle}>Ready</h3>
                        <p style={styles.summaryCardCount}>{readyCount}</p>
                        </div>
                        <div style={{...styles.summaryIconWrapper, ...styles.iconReady}}>
                        <CheckCircle size={24} />
                        </div>
                    </div>

                    {/* Served Card */}
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryCardContent}>
                        <h3 style={styles.summaryCardTitle}>Served</h3>
                        <p style={styles.summaryCardCount}>{servedCount}</p>
                        </div>
                        <div style={{...styles.summaryIconWrapper, ...styles.iconServed}}>
                        <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>
                        
                {/* Soft Error (Polling failure) */}
                {error && kitchenOrders.length > 0 && (
                    <p className="text-center text-red-400 text-sm mb-4">
                        Connection lost. Retrying...
                    </p>
                )}

                <div style={styles.filterContainer}>
                    <div style={styles.filterBox}>
                        <label htmlFor="status-filter" style={styles.filterLabel}>Filter by Status</label>
                        <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={styles.filterSelect}
                        >
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        </select>
                    </div>

                    <div style={styles.filterBox}>
                        <label htmlFor="type-filter" style={styles.filterLabel}>Filter by Type</label>
                        <select
                        id="type-filter"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={styles.filterSelect}
                        >
                        <option value="All Types">All Types</option>
                        <option value="Dine-in">Dine-in</option>
                        <option value="Room Dining">Room Dining</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Phone Order">Phone Order</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <p className="text-center text-gray-400 mt-10 text-lg">
                        No {filterStatus !== 'All' ? filterStatus.toLowerCase() + ' ' : ''}
                        {filterType !== 'All Types' ? filterType.toLowerCase() + ' ' : ''}
                        orders.
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {filteredOrders.map(order => {
                            const orderInstructions = order.items && order.items.length > 0 ? order.items[0].instructions : null;

                            return (
                            <div key={order.order_id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={getStatusStyles(order.status)}>
                                        {order.status}
                                    </span>
                                    <h2 style={styles.cardTitle}>Order #{order.order_id}</h2>
                                    <p style={styles.cardTime}>
                                        Time: {new Date(order.order_date).toLocaleTimeString()}
                                    </p>
                                </div>

                                <div style={styles.cardBody}>
                                    <div>
                                        <p style={styles.infoLine}>
                                            <span style={styles.infoLabel}>Type: </span>{order.order_type}
                                        </p>
                                        <p style={styles.infoLine}>
                                            <span style={styles.infoLabel}>Location: </span>{order.delivery_location}
                                        </p>
                                        <p style={styles.infoLine}>
                                            <span style={styles.infoLabel}>Customer: </span>{order.first_name} {order.last_name}
                                        </p>
                                    </div>

                                    <div style={styles.itemsListContainer}>
                                        <h3 style={styles.itemsListTitle}>Items:</h3>
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map(item => (
                                            <div key={item.detail_id} style={styles.itemEntry}>
                                                <span style={styles.itemName}>{item.quantity} x {item.item_name}</span>
                                            </div>
                                            ))
                                        ) : (
                                            <p style={styles.infoLine}>No item details found.</p>
                                        )}
                                    </div>

                                    {orderInstructions && (
                                        <div style={{ marginTop: '8px', borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                                            <h3 style={styles.itemsListTitle}>Instructions:</h3>
                                            <p style={{...styles.itemInstructions, marginLeft: 0, fontSize: '0.875rem', color: '#EF4444'}}>
                                            {orderInstructions}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.cardFooter}>
                                    {order.status.toLowerCase() === 'pending' && (
                                        <div style={styles.buttonRow}>
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                                            style={{...styles.primaryButton, backgroundColor: '#16A34A'}} 
                                        >
                                            Accept (Prepare)
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')}
                                            style={styles.iconButton}
                                            title="Cancel Order"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        </div>
                                    )}

                                    {order.status.toLowerCase() === 'preparing' && (
                                        <div style={styles.buttonRow}>
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                                            style={{...styles.primaryButton, backgroundColor: '#3B82F6'}} 
                                        >
                                            Mark as Ready
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')}
                                            style={styles.iconButton}
                                            title="Cancel Order"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        </div>
                                    )}

                                    {order.status.toLowerCase() === 'ready' && (
                                        <div style={styles.buttonRow}>
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'Served')}
                                            style={{...styles.primaryButton, backgroundColor: '#F59E0B'}} 
                                        >
                                            Mark as Served
                                        </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )
                        })}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
    </>
  );
}

export default KitchenPage;