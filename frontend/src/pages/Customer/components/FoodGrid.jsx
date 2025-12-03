import React from 'react';
import '../CustomerTheme.css';

// --- HELPER FUNCTION TO FIX IMAGE URLS ---
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/400x300.png?text=No+Image';

  // If it's already a full URL (like cloudinary), return it
  if (imagePath.startsWith('http')) {
     return imagePath.replace('http://localhost:21917', 'https://food-and-beverages-system.onrender.com');
  }

  // Otherwise, append the correct base URL
  // If we are in development (localhost), use localhost.
  // If we are in production (Render), use the Render URL.
  const BASE_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:21917' 
      : 'https://food-and-beverages-system.onrender.com';

  return `${BASE_URL}${imagePath}`;
};

const FoodGrid = ({ items, onAddToCart, onImageClick, layoutStyle, theme = "customer" }) => {

  if (!items || items.length === 0) {
    return <p className="no-items-message">No items match your search.</p>;
  }

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
    <div className={`menu-grid-layout ${theme === 'customer' ? 'customer-theme' : ''}`} style={layoutStyle}>
      {items.map((item) => {
        
        const { isActive, displayPrice, originalPrice, discountPercent } = getPromoPrice(item);
        
        const itemForCart = {
          ...item,
          price: displayPrice 
        };

        return (
          <div key={item.item_id} className={`food-card ${!item.is_available ? 'unavailable' : ''}`}>
            <div className="card-image-container">
              {/* ✅ UPDATED IMAGE TAG */}
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
              <h3 className="item-name">{item.item_name}</h3>
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