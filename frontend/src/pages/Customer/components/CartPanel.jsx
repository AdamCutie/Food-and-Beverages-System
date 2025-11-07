import React from 'react';
import { X, Trash2 } from 'lucide-react';

//temporary color objects
const primaryColor = {
  backgroundColor: '#0B3D2E'
}

const secondaryColor = {
  backgroundColor: '#fff2e0'
}

const CartPanel = ({
  cartItems = [],
  onUpdateQuantity,
  onPlaceOrder, // This function no longer receives any arguments
  isOpen,
  onClose,
  orderType,
  setOrderType,
  instructions,
  setInstructions,
  onRemoveItem,
  deliveryLocation,
  setDeliveryLocation
}) => {
  // --- CALCULATIONS (FOR DISPLAY ONLY) ---
  // These rates are for display in the cart. The backend has its own secure rates.
  const SERVICE_RATE = 0.10; 
  const VAT_RATE = 0.12;     

  const subtotal = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity,
    0
  );
  const serviceAmount = subtotal * SERVICE_RATE;
  // --- FIX: Corrected VAT calculation (should be on subtotal + service) ---
  const vatAmount = (subtotal + serviceAmount) * VAT_RATE;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  // --- THIS IS THE FIX ---
  // We no longer pass the total. The backend calculates it.
  const handlePlaceOrderClick = () => {
    onPlaceOrder(); 
  };
  // --- END OF FIX ---

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/75 z-20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-orange-50 shadow-lg z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Order</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          {/* Order Type Buttons */}
          <div className="flex gap-2 mb-4" >
            <button
              onClick={() => setOrderType('Dine-in')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                orderType === 'Dine-in' ? 'bg-green-900 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Dine-in
            </button>
            <button
              onClick={() => setOrderType('Room Dining')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                orderType === 'Room Dining' ? 'bg-green-900 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Room Dining
            </button>
          </div>

          {/* Delivery Location Input */}
          <div className="mb-4">
            <label htmlFor="delivery_location" className="text-sm font-semibold text-gray-700">
              {orderType === 'Dine-in' ? 'Table Number' : 'Room Number'}
            </label>
            <input
              id="delivery_location"
              type="text" 
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder={orderType === 'Dine-in' ? 'Example: 5' : 'Example: 101'}
              required
            />
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
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

            {/* --- Footer with DISPLAY-ONLY calculations --- */}
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
                onClick={handlePlaceOrderClick} // Use the new handler
                disabled={cartItems.length === 0 || !deliveryLocation}
                className="w-full mt-4 bg-green-900 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:bg-gray-400"
              >
                Place Order
              </button>
            </div>
            {/* --- END OF UPDATED FOOTER --- */}
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPanel;