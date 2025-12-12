import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext'; // ✅ Import
import apiClient from '../../utils/apiClient';
import toast from 'react-hot-toast';

import HeaderBar from './components/HeaderBar';
import CartPanel from './components/CartPanel';
import NotificationPanel from './components/NotificationPanel';
import './CustomerTheme.css';

const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  // ✅ Use Notification Hook
  const { 
    notifications, 
    deleteNotification, 
    clearAllNotifications, 
    markAllAsRead 
  } = useNotifications();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const getImageUrl = (imagePath) => {
    // 1. Check if empty
    if (!imagePath) return 'https://via.placeholder.com/400x300.png?text=No+Image';

    // 2. Check if already absolute (e.g., https://cloudinary...)
    if (imagePath.startsWith('http')) return imagePath;

    // 3. Define Base URL
    const BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:21917' 
        : 'https://food-and-beverages-system.onrender.com';

    // 4. ✅ AUTO-FIX SLASHES: Ensure exactly one slash connects them
    // Remove trailing slash from Base
    const cleanBase = BASE_URL.replace(/\/$/, '');
    // Ensure leading slash on Path
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${cleanBase}${cleanPath}`;
  };

  useEffect(() => {
     // ... (Your existing fetchDetails logic) ...
     // Keep this exactly as it was in previous step
     const fetchDetails = async () => {
        try {
            setLoading(true);
            const itemRes = await apiClient(`/items/${id}`);
            if (!itemRes.ok) throw new Error('Item not found');
            const itemData = await itemRes.json();
            setItem(itemData);

            const reviewRes = await apiClient(`/ratings/${id}`);
            if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                setReviews(reviewData.reviews || []);
            }
        } catch (error) {
            toast.error(error.message);
            navigate('/');
        } finally {
            setLoading(false);
        }
     };
     fetchDetails();
  }, [id, navigate]);

  // ❌ DELETE the old `useEffect` for polling notifications. The Context handles it now!

  const handleToggleNotifications = () => {
      const willOpen = !isNotificationPanelOpen;
      setIsNotificationPanelOpen(willOpen);
      if (willOpen) {
          markAllAsRead(); // ✅ Mark read when opening
      }
  };

  const handleAddToCart = () => { /* ... keep existing logic ... */ 
      if (!user) {
        if(window.confirm("You need to login to order. Go to login page?")) {
            navigate('/login');
        }
        return;
      }
      setAdding(true);
      setTimeout(() => {
        let finalPrice = item.price;
        if (item.is_promo) {
             const discount = parseFloat(item.promo_discount_percentage) / 100;
             finalPrice = parseFloat(item.price) * (1 - discount);
        }
        addToCart({ ...item, price: finalPrice, quantity: quantity });
        toast.success(`Added ${quantity}x ${item.item_name} to cart`);
        setAdding(false);
      }, 500);
  };

  if (loading) return <div className="min-h-screen bg-[#0B3D2E] flex items-center justify-center text-[#F9A825]">Loading...</div>;
  if (!item) return null;

  const isPromo = item.is_promo;
  const originalPrice = parseFloat(item.price);
  const discount = isPromo ? parseFloat(item.promo_discount_percentage) / 100 : 0;
  const displayPrice = isPromo ? originalPrice * (1 - discount) : originalPrice;

  return (
    <div className="customer-page-container">
      
      <HeaderBar 
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        showSearch={false} 
        onNotificationToggle={handleToggleNotifications} // ✅ Use new handler
      />

      {/* ... (Main Content: Back Button, Unified Card, Reviews - Keep exactly same) ... */}
      <main className="container mx-auto px-4 pb-20 pt-6">
         {/* Insert your existing Main Content JSX here... (I won't repeat it to save space unless you need it) */}
         <div className="max-w-5xl mx-auto mb-6">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#FFF8E1] hover:text-[#F9A825] transition-colors font-bold">
                <ArrowLeft size={24} /> Back to Menu
            </button>
         </div>
         <div className="max-w-5xl mx-auto bg-[#FFF8E1] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row" style={{ height: '550px' }}>
            <div className="w-full md:w-1/2 h-full relative">
    {/* ✅ DEBUG: Log the path to see what is breaking */}
    {console.log("Raw Path:", item.image_url, " | Final URL:", getImageUrl(item.image_url))}
    
    <img 
        src={getImageUrl(item.image_url)} 
        alt={item.item_name}
        className="w-full h-full object-cover"
        // ✅ SAFETY NET: If image fails, switch to placeholder automatically
        onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://via.placeholder.com/400x300.png?text=Image+Not+Found';
        }}
    />
    {isPromo && (
        <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
            {item.promo_discount_percentage}% OFF
        </span>
    )}
</div>
            <div className="w-full md:w-1/2 flex flex-col h-full">
                <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar">
                    <h1 className="text-4xl font-extrabold text-[#0B3D2E] mb-2 leading-tight">{item.item_name}</h1>
                    <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 border-b border-[#0B3D2E]/10 pb-6">
                        <div className="flex items-center gap-1 text-[#F9A825] font-bold">
                            <span className="text-lg underline decoration-1 underline-offset-4">{item.average_rating}</span>
                            <div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} size={16} fill={i < Math.round(item.average_rating) ? "#F9A825" : "#ddd"} color="none" />))}</div>
                        </div>
                        <div className="w-[1px] h-4 bg-gray-400"></div>
                        <div className="flex gap-1"><span className="font-bold text-[#0B3D2E] underline decoration-1 underline-offset-4">{item.total_reviews}</span><span>Ratings</span></div>
                        <div className="w-[1px] h-4 bg-gray-400"></div>
                        <div className="flex gap-1"><span className="font-bold text-[#0B3D2E]">{item.total_sold}</span><span className="text-gray-500">Sold</span></div>
                    </div>
                    <div className="mb-6">
                        {isPromo ? (
                            <div className="flex items-end gap-3"><span className="text-5xl font-bold text-[#F9A825]">₱{displayPrice.toFixed(2)}</span><span className="text-xl text-gray-400 line-through mb-2">₱{originalPrice.toFixed(2)}</span></div>
                        ) : (<span className="text-5xl font-bold text-[#F9A825]">₱{displayPrice.toFixed(2)}</span>)}
                    </div>
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                        <p className="text-[#0B3D2E] text-lg leading-relaxed opacity-90">{item.description || "No description available."}</p>
                    </div>
                </div>
                <div className="p-8 md:px-10 md:py-8 border-t border-[#0B3D2E]/5 bg-[#FFF8E1]">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center border-2 border-[#0B3D2E]/10 rounded-xl bg-white w-fit shadow-sm">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-4 text-[#0B3D2E] hover:bg-gray-50 rounded-l-xl transition-colors"><Minus size={20} /></button>
                            <span className="w-12 text-center font-bold text-xl text-[#0B3D2E]">{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} className="p-4 text-[#0B3D2E] hover:bg-gray-50 rounded-r-xl transition-colors"><Plus size={20} /></button>
                        </div>
                        {item.is_available ? (
                            <button onClick={handleAddToCart} disabled={adding} className="flex-1 bg-[#0B3D2E] text-[#FFF8E1] font-bold py-4 px-8 rounded-xl hover:bg-[#082a20] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"><ShoppingCart size={24} /> {adding ? 'Adding...' : 'Add To Cart'}</button>
                        ) : (<button disabled className="flex-1 bg-gray-200 text-gray-400 font-bold py-4 px-8 rounded-xl cursor-not-allowed">Currently Unavailable</button>)}
                    </div>
                </div>
            </div>
        </div>
        <div className="max-w-5xl mx-auto mt-12">
            <div className="bg-[#FFF8E1] rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-[#0B3D2E] mb-6">Product Ratings</h2>
                {reviews.length === 0 ? <p className="text-gray-500 italic">No reviews yet.</p> : (
                    <div className="space-y-6">{reviews.map((review) => (
                        <div key={review.rating_id} className="border-b border-[#0B3D2E]/10 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-[#0B3D2E] flex items-center justify-center text-[#FFF8E1] font-bold"><User size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-[#0B3D2E]">{review.customer_name || 'Customer'}</p>
                                    <div className="flex items-center gap-2"><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} size={12} fill={i < review.rating_value ? "#F9A825" : "#ddd"} color="none" />))}</div><span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span></div>
                                </div>
                            </div>
                            {review.review_text && <p className="text-[#0B3D2E]/80 mt-2 ml-14 leading-relaxed">{review.review_text}</p>}
                        </div>
                    ))}</div>
                )}
            </div>
        </div>
      </main>

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* ✅ CONNECTED NOTIFICATION PANEL */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={notifications}        // Data from Context
        onDeleteOne={deleteNotification}     // Fn from Context
        onClearAll={clearAllNotifications}   // Fn from Context
      />
    </div>
  );
};

export default ItemDetailsPage;