import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Load cart from localStorage so it survives page refreshes
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('customerCart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('customerCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.item_id === item.item_id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.item_id === item.item_id
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prevCart, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) return;
    setCart((prev) => prev.map(i => i.item_id === itemId ? { ...i, quantity: newQty } : i));
  };

  const updateInstruction = (itemId, instruction) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.item_id === itemId ? { ...item, instructions: instruction } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateInstruction, 
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
  
};

export const useCart = () => useContext(CartContext);