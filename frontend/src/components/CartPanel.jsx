import React from 'react';
import { X } from 'lucide-react';

const CartPanel = ({ cartItems = [], onUpdateQuantity, onPlaceOrder, isOpen, onClose }) => {
  const totalPrice = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );

  return (
    <>
      {/* Overlay: Dims the background when the cart is open */}
      <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-white/50 z-20 transition-opacity duration-300 ${ // <-- CHANGE a
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose} 
      />
      </>

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Order</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto pr-2">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
            ) : (
              // This div was missing
              <div className="space-y-4"> 
                {cartItems.map((item) => (
                  <div key={item.item_id} className="flex justify-between items-center">
                    <div>
                      {/* FIX: Changed item.name to item.item_name */}
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity - 1)}
                        className="bg-gray-200 w-6 h-6 rounded-md font-bold hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                        className="bg-gray-200 w-6 h-6 rounded-md font-bold hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={onPlaceOrder}
              disabled={cartItems.length === 0}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPanel;