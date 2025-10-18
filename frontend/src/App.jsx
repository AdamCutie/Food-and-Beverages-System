import React, { useState } from "react";
import HeaderBar from "./components/HeaderBar";
import PromoBanner from "./components/PromoBanner";
import CategoryTabs from "./components/CategoryTabs";
import FoodGrid from "./components/FoodGrid";
import CartPanel from "./components/CartPanel";

export default function App() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [cart, setCart] = useState([]);

    const handleAddToCart = (item) => setCart((prev) => [...prev, item]);
    const handleRemove = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen bg-[#053a34] text-white">
      <HeaderBar />
      <PromoBanner />
      
      <CategoryTabs active={activeCategory} onChange={setActiveCategory}/>
      <FoodGrid activeCategory={activeCategory} onAddToCart={handleAddToCart}/>
      <CartPanel cartItems={cart} onRemove={handleRemove} />
    
      <main className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-center text-gray-300">Category tabs added successfully!</p>
      </main>
    </div>
  );
}
