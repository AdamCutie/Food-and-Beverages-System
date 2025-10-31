// frontend/src/components/PromoBanner.jsx

import React from "react";
// Import the CSS file if you can edit it, otherwise, the <style> block below is the workaround.
// import "../../index.css"; 

export default function PromoBanner() {
  const marqueeDuration = '30s'; 

  // The long string of repeated promotions
  const promoText = "🎁 Active Promos: Seafood Week 15% OFF | Happy Hour Wings 20% OFF | Weekend Paella Special 10% OFF | Loyalty Points: 1250 ✨";
  
  // Repeat the text 4 times to ensure the banner is long enough for the marquee effect.
  const repeatedPromoText = promoText.repeat(4);

  return (
    <>
      {/* Workaround: Use <style> block if you cannot edit index.css to define @keyframes */}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .marquee-content-wrap {
            display: inline-block;
            animation: marquee ${marqueeDuration} linear infinite;
          }
        `}
      </style>

      {/* 🛑 Background and Text Colors Updated to match the Green Theme */}
      {/* Background is a complementary green, text is set to the bright accent orange/gold */}
      <div className="bg-[#FFA237] text-[#352721] text-sm font-semibold py-2 px-4 overflow-hidden shadow-inner">
        <span className="marquee-content-wrap whitespace-nowrap">
          {repeatedPromoText}
        </span>
      </div>
    </>
  );
}