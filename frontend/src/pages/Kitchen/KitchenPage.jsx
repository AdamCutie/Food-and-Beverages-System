import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import toast from 'react-hot-toast';
import EmployeeHeader from '../../components/EmployeeHeader'; 

function KitchenPage() {
    const navigate = useNavigate(); // Hook for navigating

    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All Types');

    // --- DESIGN PALETTE (Refined) ---
    const BG_COLOR = '#352721'; // Dark Coffee/Brown (Header BG)
    const PAGE_BG_COLOR = '#352721'; // Using the same dark color for consistency
    const PANEL_COLOR = '#FFF2E0'; // Cream/Off-White (Card/Filter BG)
    const TEXT_COLOR = 'text-gray-100'; // Light text for dark background
    const ACCENT_COLOR = 'text-[#FFA237]'; // Gold accent (from EmployeeHeader)
    const ACCENT_BUTTON_BG = 'bg-[#FFA237]';
    const CARD_BG_COLOR = 'bg-white'; 

    // --- FUNCTIONAL LOGIC (UNTOUCHED) ---
    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);
            if (!response.ok) {
                console.error(`Failed to fetch details for order ${orderId}`);
                return null;
            }
            return await response.json();
        } catch (err) {
            console.error(`Error fetching details for order ${orderId}:`, err);
            return null;
        }
    };

    const fetchAndPopulateOrders = async (isInitialLoad = false) => {
        if (!isInitialLoad && isPolling) return;
        if (isInitialLoad) setLoading(true);
        setIsPolling(true);
        setError(null);

        try {
            const listResponse = await fetch('http://localhost:3000/api/orders/kitchen');
            if (!listResponse.ok) {
                throw new Error('Failed to fetch kitchen orders list');
            }
            const ordersList = await listResponse.json();

            if (!Array.isArray(ordersList)) {
                console.error("API did not return an array, received:", ordersList);
                throw new Error("Invalid data from server.");
            }

            const ordersWithDetails = await Promise.all(
                ordersList.map(order => fetchOrderDetails(order.order_id))
            );

            const newOrders = ordersWithDetails.filter(order => order !== null);

            if (Array.isArray(newOrders)) {
                setKitchenOrders(newOrders);
            } else {
                console.error("Error: newOrders is not an array.", newOrders);
                setKitchenOrders([]);
            }
        } catch (err) {
            setError(err.message);
            setKitchenOrders([]);
        } finally {
            if (isInitialLoad) setLoading(false);
            setIsPolling(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus.toLowerCase() }),
            });

            if (!response.ok) {
                let errorMsg = `Failed to update status to ${newStatus}`;
                try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }

            setKitchenOrders(currentOrders => {
                if (!Array.isArray(currentOrders)) {
                    console.error("Error: kitchenOrders state was not an array during update.");
                    return [];
                }
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
            console.error("Status update error:", err);
            toast.error(err.message);
        }
    };
    // --- END OF FUNCTIONAL LOGIC ---

    useEffect(() => {
        fetchAndPopulateOrders(true);
        const intervalId = setInterval(() => {
            fetchAndPopulateOrders(false);
        }, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // Function for Back Button on EmployeeHeader
    const handleGoBack = () => {
        navigate(-1); // Use navigate to go back one step
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen ${TEXT_COLOR} p-8 text-center text-lg`}>
                <EmployeeHeader onBack={handleGoBack} />
                <p>Loading active orders...</p>
            </div>
        );
    }

    if (error && kitchenOrders.length === 0) {
        return (
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen ${TEXT_COLOR} p-8 text-center text-red-400`}>
                <EmployeeHeader onBack={handleGoBack} />
                <p>Error: {error}</p>
            </div>
        );
    }

    const filteredOrders = Array.isArray(kitchenOrders) ? kitchenOrders.filter(order => {
        const statusMatch = filterStatus === 'All' || (order.status && order.status.toLowerCase() === filterStatus.toLowerCase());
        const typeMatch = filterType === 'All Types' || (order.order_type && order.order_type.toLowerCase() === filterType.toLowerCase());
        return statusMatch && typeMatch;
    }) : [];

    // --- START OF DESIGN CHANGES ---
    return (
        <>
            <EmployeeHeader onBack={handleGoBack} /> 
            {/* Main Page Container: Use a slightly darker background for better contrast */}
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen px-6 py-8 ${TEXT_COLOR}`}>
                <div className="container mx-auto max-w-7xl">
                    {/* H1: Smaller font size (text-3xl) and centered */}
                    <h1 className={`text-3xl font-extrabold mb-8 text-center ${ACCENT_COLOR} tracking-wider uppercase`}>
                        KITCHEN ORDER DISPLAY
                    </h1>
                    
                    {error && <p className="text-center text-red-400 text-sm mb-6">Error fetching updates: {error}</p>}

                    {/* LINKS & FILTERS SECTION: Now one cohesive, full-width panel */}
                    <div 
                        style={{ backgroundColor: PANEL_COLOR }} 
                        className={`p-5 rounded-xl shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 text-gray-800 w-full`}
                    >
                        
                        {/* 1. GO TO ARCHIVE Button (Left side) */}
                        <div className="w-full lg:w-auto">
                            <Link 
                                to="/kitchen/archive" 
                                className={`
                                    py-3 px-6 rounded-xl font-bold transition-colors shadow-md text-center inline-block w-full sm:w-auto
                                    ${ACCENT_BUTTON_BG} text-gray-900 hover:bg-yellow-600
                                `}
                            >
                                GO TO ARCHIVE
                            </Link>
                        </div>
                        
                        {/* 2. Filters Container (Right side, takes remaining space) */}
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 w-full lg:w-2/3">
                            
                            {/* Filter by Status Dropdown */}
                            <div className="flex flex-col w-full sm:w-1/2">
                                <label htmlFor="status-filter" className="text-sm font-bold mb-1">STATUS</label>
                                <select
                                    id="status-filter"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-800 shadow-inner focus:ring-[#FFA237] focus:border-[#FFA237] text-base"
                                >
                                    <option value="All">All</option>
                                    <option value="Pending">Pending (New)</option>
                                    <option value="Preparing">Preparing</option>
                                    <option value="Ready">Ready for Pick-up</option>
                                </select>
                            </div>

                            {/* Filter by Type Dropdown */}
                            <div className="flex flex-col w-full sm:w-1/2">
                                <label htmlFor="type-filter" className="text-sm font-bold mb-1">TYPE</label>
                                <select
                                    id="type-filter"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-800 shadow-inner focus:ring-[#FFA237] focus:border-[#FFA237] text-base"
                                >
                                    <option value="All Types">All Types</option>
                                    <option value="Dine-in">Dine-in</option>
                                    <option value="Room Service">Room Service</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* END OF LINKS & FILTERS SECTION */}


                    {filteredOrders.length === 0 ? (
                        <p className={`text-center text-xl mt-16 ${TEXT_COLOR} opacity-70`}>
                            No active {filterStatus !== 'All' ? filterStatus.toLowerCase() + ' ' : ''}
                            {filterType !== 'All Types' ? filterType.toLowerCase() + ' ' : ''}
                            orders currently in the queue. 👨‍🍳
                        </p>
                    ) : (
                        /* Order Grid: Remains 2 columns */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Changed to 3 columns on large screens */}
                            {filteredOrders.map(order => (
                                /* Order Card */
                                <div 
                                    key={order.order_id} 
                                    style={{ backgroundColor: PANEL_COLOR }} 
                                    className={`p-6 rounded-xl shadow-2xl flex flex-col transition-shadow duration-300 hover:shadow-2xl text-gray-800 border-t-8 
                                        ${order.status.toLowerCase() === 'pending' ? 'border-yellow-500' :
                                            order.status.toLowerCase() === 'preparing' ? 'border-blue-500' :
                                                order.status.toLowerCase() === 'ready' ? 'border-green-500' :
                                                'border-gray-500'
                                        }
                                    `}
                                >
                                    {/* Header Section */}
                                    <div className="mb-4 pb-3 border-b border-gray-400">
                                        <h2 className="font-extrabold text-3xl mb-1 flex items-center justify-between">
                                            <span className="text-gray-900">Order #{order.order_id}</span>
                                            <span 
                                                className={`text-sm font-bold tracking-wider px-3 py-1 rounded-full 
                                                    ${order.order_type.toLowerCase() === 'dine-in' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}
                                                `}
                                            >
                                                {order.order_type.toUpperCase()}
                                            </span>
                                        </h2>
                                        <p className="text-xs text-gray-600 font-medium">
                                            {new Date(order.order_date).toLocaleTimeString()}
                                            {' '}| Location: **{order.delivery_location}**
                                        </p>
                                    </div>

                                    {/* Items Section */}
                                    <div className="space-y-3 mb-4 flex-grow overflow-y-auto max-h-60 pr-2">
                                        <h3 className="font-extrabold text-base uppercase text-gray-700 border-b pb-2">Items:</h3>
                                        {order.details && order.details.length > 0 ? (
                                            order.details.map(item => (
                                                <div key={item.detail_id} className={`text-base flex justify-between items-start p-2 rounded ${CARD_BG_COLOR} shadow-sm border-l-4 border-gray-400`}>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800">{item.item_name}</span>
                                                        {item.instructions && <p className="text-xs text-red-700 italic mt-1 pl-1"> NOTE: {item.instructions}</p>}
                                                    </div>
                                                    <span className="font-extrabold text-lg text-red-600 ml-4">x{item.quantity}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 ml-2">No item details found.</p>
                                        )}
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="text-center mb-5 border-t pt-4 border-gray-400">
                                        <span className={`py-2 px-4 rounded-full text-base font-extrabold tracking-wider uppercase shadow-md ${
                                            order.status.toLowerCase() === 'pending' ? 'bg-yellow-500 text-gray-900' :
                                                order.status.toLowerCase() === 'preparing' ? 'bg-blue-500 text-white' :
                                                    order.status.toLowerCase() === 'ready' ? 'bg-green-500 text-white' :
                                                        'bg-gray-400 text-gray-800'
                                            }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto pt-4 border-t border-gray-400 flex flex-col gap-3">
                                        {order.status.toLowerCase() === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                                                className="bg-green-700 text-white py-3 rounded-xl text-lg font-bold hover:bg-green-800 transition-colors w-full shadow-lg"
                                            >
                                                ACCEPT AND PREPARE
                                            </button>
                                        )}
                                        {order.status.toLowerCase() === 'preparing' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                                                className="bg-orange-500 text-white py-3 rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors w-full shadow-lg"
                                            >
                                                MARK AS READY
                                            </button>
                                        )}
                                        {order.status.toLowerCase() === 'ready' && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.order_id, 'Served')}
                                                className="bg-red-700 text-white py-3 rounded-xl text-lg font-bold hover:bg-red-800 transition-colors w-full shadow-lg"
                                            >
                                                MARK AS SERVED
                                            </button>
                                        )}
                                        {/* Cancel Button */}
                                        {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'preparing' || order.status.toLowerCase() === 'ready') && (
                                            <button
                                                onClick={() => handleUpdateStatus(order.order_id, 'Cancelled')}
                                                className="bg-gray-400 text-gray-800 py-2 rounded-xl text-base font-semibold hover:bg-gray-500 transition-colors w-full mt-2"
                                            >
                                                CANCEL ORDER
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default KitchenPage;
