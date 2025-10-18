import React from "react";

const foods = [
  {
    id: 1,
    name: "Crispy Calamari",
    desc: "Golden fried rings served with aioli",
    price: 249,
    image: "https://images.unsplash.com/photo-1601924582971-b0f74e0fcd36?w=400",
    category: "Appetizer",
  },
  {
    id: 2,
    name: "Grilled Salmon",
    desc: "Served with lemon butter sauce",
    price: 499,
    image: "https://images.unsplash.com/photo-1606851094281-63b9f2dc80b3?w=400",
    category: "Main Course",
  },
  {
    id: 3,
    name: "Chocolate Lava Cake",
    desc: "Warm cake with molten chocolate center",
    price: 199,
    image: "https://images.unsplash.com/photo-1605470201698-9c64e4a9b661?w=400",
    category: "Dessert",
  },
  {
    id: 4,
    name: "Caesar Salad",
    desc: "Crisp romaine lettuce with creamy dressing",
    price: 179,
    image: "https://images.unsplash.com/photo-1565958011705-44e211b6c9f7?w=400",
    category: "Appetizer",
  },
];


export default function FoodGrid({ activeCategory, onAddToCart }) {
  const filteredFoods =
    activeCategory === "All"
      ? foods
      : foods.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 px-4">
      {filteredFoods.map((food) => (
        <div
          key={food.id}
          className="bg-white text-[#053a34] rounded-2xl shadow-lg overflow-hidden"
        >
          <img
            src={food.image}
            alt={food.name}
            className="h-48 w-full object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg">{food.name}</h3>
            <p className="text-sm text-gray-600">{food.desc}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="font-bold text-[#F6B24B]">₱{food.price}</span>
              <button
                onClick={() => onAddToCart(food)}
                className="bg-[#F6B24B] text-[#053a34] px-3 py-1 rounded-lg font-semibold hover:bg-[#f7c36e] transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
