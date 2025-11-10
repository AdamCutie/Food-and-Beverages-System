import React from 'react';

// --- All styles are defined here ---

const cardStyle = {
  backgroundColor: '#fff2e0', // Your 'secondaryColor'
  borderRadius: '0.5rem', // 8px
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const cardImageStyle = {
  width: '100%',
  height: '224px', // 14rem
  objectFit: 'cover',
  cursor: 'pointer',
};

const promoBadgeStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  backgroundColor: '#DC2626', // red-600
  color: 'white',
  fontWeight: 'bold',
  fontSize: '0.75rem', // 12px
  padding: '4px 12px',
  borderBottomRightRadius: '0.5rem', // 8px
};

const contentStyle = {
  padding: '24px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const itemNameStyle = {
  fontSize: '1.5rem', // 24px
  fontWeight: 'bold',
  color: '#0B3D2E', // Dark green text
  marginBottom: '16px',
};

const itemDescriptionStyle = {
  fontSize: '1rem', // 16px
  color: '#053a34', // Dark green text
  marginBottom: '8px',
  flex: 1, // Pushes price/button to bottom
};

const footerStyle = {
  marginTop: 'auto', // Pushes this to the bottom
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end', // Aligns price (which is taller) and button
};

const priceContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'baseline', 
  gap: '8px',
};

const priceStyle = {
  fontSize: '1.5rem', // 24px
  fontWeight: '600',
  color: '#053a34',
};

const originalPriceStyle = {
  fontSize: '1rem', // 16px
  fontWeight: 'normal',
  color: '#6B7280', // gray-500
  textDecoration: 'line-through',
};

// --- REMOVED availableTagStyle and buttonContainerStyle ---

const baseButtonStyle = {
  backgroundColor: '#0B3D2E', // Your 'primaryColor'
  color: 'white',
  fontWeight: 'bold',
  padding: '8px 24px',
  borderRadius: '0.375rem', // 6px (matches design)
  border: 'none',
  cursor: 'pointer',
};

const unavailableButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: '#6B7280', // gray-500
  opacity: 0.7,
  cursor: 'not-allowed',
};

// --- End of styles ---

const FoodGrid = ({ items, onAddToCart, onImageClick, layoutStyle }) => {
  if (!items || items.length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '48px', color: 'white' }}>No items match your search.</p>;
  }

  // Helper function (no changes)
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
    <div style={layoutStyle}>
      {items.map((item) => {
        
        const { isActive, displayPrice, originalPrice, discountPercent } = getPromoPrice(item);
        
        const itemForCart = {
          ...item,
          price: displayPrice 
        };
        
        const dynamicCardStyle = {
          ...cardStyle,
          opacity: !item.is_available ? 0.8 : 1,
        };

        return (
          <div
            key={item.item_id}
            style={dynamicCardStyle}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={
                  item.image_url
                    ? `http://localhost:3000${item.image_url}`
                    : 'https://via.placeholder.com/400x300.png?text=No+Image'
                }
                alt={item.item_name}
                style={cardImageStyle}
                onClick={() =>
                  onImageClick(
                    item.image_url ? `http://localhost:3000${item.image_url}` : null
                  )
                }
              />
              
              {isActive && (
                <span style={promoBadgeStyle}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div style={contentStyle}>
              <h3 style={itemNameStyle}>{item.item_name}</h3>
              <p style={itemDescriptionStyle}>
                {item.description || 'No description available.'}
              </p>

              {/* --- UPDATED FOOTER --- */}
              <div style={footerStyle}>
                
                {/* Price Display Logic */}
                <div style={priceContainerStyle}>
                  {isActive ? (
                    <>
                      <p style={priceStyle}>
                        ₱{parseFloat(displayPrice).toFixed(2)}
                      </p>
                      <p style={originalPriceStyle}>
                        ₱{parseFloat(originalPrice).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p style={priceStyle}>
                      ₱{parseFloat(displayPrice).toFixed(2)}
                    </p>
                  )}
                </div>
                
                {/* --- CONDITIONAL BUTTON (NO TAG) --- */}
                {item.is_available ? (
                  <button
                    onClick={() => onAddToCart(itemForCart)}
                    style={baseButtonStyle}
                  >
                    Add
                  </button>
                ) : (
                  <button
                    disabled
                    style={unavailableButtonStyle}
                  >
                    Unavailable
                  </button>
                )}
                {/* --- END OF CONDITIONAL BUTTON --- */}

              </div>
              {/* --- END OF UPDATED FOOTER --- */}

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FoodGrid;