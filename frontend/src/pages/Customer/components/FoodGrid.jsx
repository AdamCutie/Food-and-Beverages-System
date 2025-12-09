import React from 'react';
import { Star } from 'lucide-react'; // ✅ Import Star Icon
import '../CustomerTheme.css';

// Helper to handle image URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/400x300.png?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  
  const BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:21917' 
      : 'https://food-and-beverages-system.onrender.com';
  return `${BASE_URL}${imagePath}`;
};

const FoodGrid = ({ items, onAddToCart, onImageClick, layoutStyle, theme = "customer" }) => {

  if (!items || items.length === 0) {
    return <p className="no-items-message">No items match your search.</p>;
  }

  // Helper to calculate promo prices
  const getPromoPrice = (item) => {
    if (!item.is_promo || !item.promo_discount_percentage || !item.promo_expiry_date) {
      return { isActive: false, displayPrice: item.price };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const expiryDate = new Date(item.promo_expiry_date);
    
    if (expiryDate < today) {
      return { isActive: false, displayPrice: item.price };
    }
    
    const discount = parseFloat(item.promo_discount_percentage) / 100;
    const discountedPrice = parseFloat(item.price) * (1 - discount);
    
    return {
      isActive: true,
      displayPrice: discountedPrice,
      originalPrice: item.price,
      discountPercent: item.promo_discount_percentage,
    };
  };

  return (
    <div 
        className={`menu-grid-layout ${theme === 'customer' ? 'customer-theme' : 'kitchen-theme'}`} 
        style={layoutStyle}
    >
      {items.map((item) => {
        
        const { isActive, displayPrice, originalPrice, discountPercent } = getPromoPrice(item);
        const itemForCart = { ...item, price: displayPrice };
        
        // ✅ NEW: Parse Rating Data
        const rating = parseFloat(item.average_rating || 0);
        const reviewCount = item.total_reviews || 0;

        return (
          <div key={item.item_id} className={`food-card ${!item.is_available ? 'unavailable' : ''}`}>
            <div className="card-image-container">
              <img
                src={getImageUrl(item.image_url)}
                alt={item.item_name}
                className="card-image"
                onClick={() => onImageClick(getImageUrl(item.image_url))}
              />
              
              {isActive && (
                <span className="promo-badge">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="card-content">
              <div className="flex justify-between items-start">
                  <h3 className="item-name">{item.item_name}</h3>
                  
                  {/* ✅ NEW: Rating Display Badge */}
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                        <Star size={12} fill="#F9A825" color="#F9A825" />
                        <span className="text-xs font-bold text-[#3C2A21]">{rating.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-500">({reviewCount})</span>
                    </div>
                  )}
              </div>

              <p className="item-description">
                {item.description || 'No description available.'}
              </p>

              <div className="card-footer">
                <div className="price-container">
                  {isActive ? (
                    <>
                      <p className="price-text">₱{parseFloat(displayPrice).toFixed(2)}</p>
                      <p className="original-price">₱{parseFloat(originalPrice).toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="price-text">₱{parseFloat(displayPrice).toFixed(2)}</p>
                  )}
                </div>
                
                {item.is_available ? (
                  <button onClick={() => onAddToCart(itemForCart)} className="btn-add-cart">Add</button>
                ) : (
                  <button disabled className="btn-unavailable">Unavailable</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FoodGrid;