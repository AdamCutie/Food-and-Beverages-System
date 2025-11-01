import React from 'react';
import { X, Trash2 } from 'lucide-react';

// This is a simplified version of your CartPanel, designed to be a fixed panel.
const PosCart = ({
  cartItems = [],
  onUpdateQuantity,
  onPlaceOrder, // This is our handleCashOrder function
  orderType,
  setOrderType,
  instructions,
  setInstructions,
  onRemoveItem,
  deliveryLocation,
  setDeliveryLocation,
}) => {
  // Calculations (FOR DISPLAY ONLY)
  const SERVICE_RATE = 0.10; 
  const VAT_RATE = 0.12;     

  const subtotal = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );
  const serviceAmount = subtotal * SERVICE_RATE;
  const vatAmount = (subtotal + serviceAmount) * VAT_RATE;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  return (
    // This is no longer a modal. It's just a flex column.
    <div className="p-6 flex flex-col h-full bg-white shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">New Order</h2>
      </div>

      {/* Order Type Buttons */}
      <div className="flex gap-2 mb-4" >
        <button
          onClick={() => {
            setOrderType('Walk-in');
            setDeliveryLocation('Counter');
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
            orderType === 'Walk-in' ? 'bg-green-900 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Walk-in
        </button>
        <button
          onClick={() => {
            setOrderType('Phone Order');
            setDeliveryLocation('');
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
            orderType === 'Phone Order' ? 'bg-green-900 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Phone Order
        </button>
      </div>

      {/* Delivery Location Input */}
      <div className="mb-4">
        <label htmlFor="delivery_location" className="text-sm font-semibold text-gray-700">
          {orderType === 'Walk-in' ? 'Customer Name' : 'Phone/Notes'}
        </label>
        <input
          id="delivery_location"
          type="text" 
          value={deliveryLocation}
          onChange={(e) => setDeliveryLocation(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
          placeholder={orderType === 'Walk-in' ? 'e.g., "John D."' : 'e.g., "For pickup at 5PM"'}
          required
        />
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-2 mb-4 border-t border-b py-4">
        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.item_id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.item_name}</p>
                  <p className="text-sm text-gray-500">₱{parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => onUpdateQuantity(item.item_id, item.quantity - 1)} className="bg-gray-200 w-6 h-6 rounded-md font-bold hover:bg-gray-300">-</button>
                  <span className="w-4 text-center">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)} className="bg-gray-200 w-6 h-6 rounded-md font-bold hover:bg-gray-300">+</button>
                  <button onClick={() => onRemoveItem(item.item_id)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div>
        {/* Instructions */}
        <div className="mt-4">
          <label htmlFor="instructions" className="text-sm font-semibold text-gray-700">Special Instructions</label>
          <textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows="3" className="mt-1 w-full border border-gray-300 rounded-md p-2" placeholder="e.g. allergies, extra spicy, etc."></textarea>
        </div>

        {/* Footer with DISPLAY-ONLY calculations */}
        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Service Charge ({ (SERVICE_RATE * 100).toFixed(0) }%)</span>
            <span>₱{serviceAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>VAT ({ (VAT_RATE * 100).toFixed(0) }%)</span>
            <span>₱{vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
            <span>Total amount</span>
            <span>₱{grandTotal.toFixed(2)}</span>
          </div>
         <button
            onClick={() => onPlaceOrder(grandTotal)} // Pass the total to the handler
            disabled={cartItems.length === 0 || !deliveryLocation} // Remove isPlacingOrder
            className="w-full mt-4 bg-green-900 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:bg-gray-400"
          >
            Submit Cash Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosCart;