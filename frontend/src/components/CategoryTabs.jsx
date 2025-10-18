import React from "react";

export default function CategoryTabs({ active, onChange }) {
  const categories = ["All", "Appetizer", "Main Course", "Dessert"];

  return (
    <div className="flex justify-center space-x-4 mt-8">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            active === cat
              ? "bg-[#F6B24B] text-[#053a34]"
              : "bg-[#053a34] text-white hover:bg-[#06594d]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
