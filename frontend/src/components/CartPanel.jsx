import React from "react";

export default function CartPanel({ cartItems, onRemove }) {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed right-4 top-4 w-80 bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
      <h2 className="text-lg font-semibold text-[#053a34] mb-3">🛒 Your Cart</h2>

      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-sm">Your cart is empty</p>
      ) : (
        <>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center text-sm border-b pb-2"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-xs">₱{item.price}</p>
                </div>
                <button
                  className="text-red-500 hover:text-red-700 text-xs"
                  onClick={() => onRemove(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between font-semibold text-[#053a34]">
            <span>Total:</span>
            <span>₱{total}</span>
          </div>

          <button className="w-full mt-3 bg-[#F6B24B] text-[#053a34] py-2 rounded-lg font-semibold hover:bg-[#f7c36e] transition">
            Checkout
          </button>
        </>
      )}
    </div>
  );
}
