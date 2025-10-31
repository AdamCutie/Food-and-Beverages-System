import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ArchiveHeader from '../../components/ArchiveHeader'; 

function ArchivePage() {
    const navigate = useNavigate();

    // --- DESIGN PALETTE (MATCHING Theme) ---
    const PAGE_BG_COLOR = '#352721'; // Dark page background
    const PANEL_COLOR = '#FFF2E0'; // Cream/Off-White (Card BG)
    const TEXT_COLOR = 'text-gray-100'; 
    const ACCENT_COLOR = 'text-[#FFA237]'; // Gold accent
    const ACCENT_BUTTON_BG = 'bg-[#FFA237]';
    const CARD_TEXT_COLOR = 'text-gray-800';
    const CARD_BG_COLOR = 'bg-white'; // Item background color (though unused now)

    const [servedOrders, setServedOrders] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- FUNCTIONALITY: Fetch Served Orders ---
    useEffect(() => {
        const fetchServedOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/orders/served'); 
                if (!response.ok) {
                    throw new Error('Failed to fetch served orders');
                }
                const data = await response.json();
                setServedOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchServedOrders();
    }, []);

    // --- FUNCTIONALITY: Header Back Button Handler ---
    const handleGoBack = () => {
        // Explicitly links to the Kitchen Display
        navigate('/kitchen');
    };

    // --- CONDITIONAL RENDERS (Including Header and Design) ---
    if (loading) {
        return (
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen ${TEXT_COLOR} p-8 text-center text-lg`}>
                <ArchiveHeader onBack={handleGoBack} />
                <p className="mt-8">Loading archive...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen ${TEXT_COLOR} p-8 text-center text-red-400`}>
                <ArchiveHeader onBack={handleGoBack} />
                <p className="mt-8">Error: {error}</p>
            </div>
        );
    }

    // --- MAIN RENDER (Content + Final Design) ---
    return (
        <>
            <ArchiveHeader onBack={handleGoBack} />
            
            <div style={{ backgroundColor: PAGE_BG_COLOR }} className={`min-h-screen px-6 py-8 ${TEXT_COLOR}`}>
                <div className="container mx-auto max-w-7xl">
                    
                    {/* H1: Title with matching style */}
                    <h1 className={`text-3xl font-extrabold mb-10 text-center ${ACCENT_COLOR} tracking-wider uppercase`}>
                        SERVED ORDERS ARCHIVE
                    </h1>

                    {servedOrders.length === 0 ? (
                        <p className={`text-center text-xl mt-16 ${TEXT_COLOR} opacity-70`}>
                            📦 No served orders found in the archive.
                        </p>
                    ) : (
                        /* Order Grid: Matches KitchenPage layout (3 columns on large screens) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {servedOrders.map(order => (
                                /* Order Card: Matching styling */
                                <div 
                                    key={order.order_id} 
                                    style={{ backgroundColor: PANEL_COLOR }} 
                                    className={`p-6 rounded-xl shadow-2xl flex flex-col ${CARD_TEXT_COLOR} border-l-4 border-r-4 border-gray-400`}
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
                                        {/* Location Details */}
                                        <p className="text-xs text-gray-600 font-medium mt-1">
                                            Location: <span className="font-bold">{order.delivery_location}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 font-medium">
                                            Served: {new Date(order.order_date).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Item List Section REMOVED */}
                                    
                                    {/* Status (Now immediately follows Header/Details for a clean format) */}
                                    <div className="text-center mt-6"> 
                                        <span className="py-2 px-4 rounded-full text-base font-extrabold tracking-wider uppercase shadow-md bg-green-700 text-white">
                                            {order.status}
                                        </span>
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

export default ArchivePage;
