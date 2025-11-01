import React, { useState } from 'react';

const PaymentModal = ({
  isOpen,
  onClose,
  totalAmount, // This is now just for display
  onConfirmPayment, // This function no longer expects totalAmount
  deliveryLocation,
  orderType,
  cartItems
}) => {
  if (!isOpen) return null;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('GCash'); // Default

  // Calculations for Billing Summary display (FOR DISPLAY ONLY)
  // The backend will perform its own secure calculation.
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceChargeRate = 0.10; // 10%
  const vatRate = 0.12;           // 12%
  const serviceCharge = subtotal * serviceChargeRate;
  const vatAmount = (subtotal + serviceCharge) * vatRate;
  const grandTotal = subtotal + serviceCharge + vatAmount;

  // --- THIS IS THE FIX ---
  const handleConfirm = () => {
    // We only pass the payment method. The backend calculates the total.
    onConfirmPayment({ selectedPaymentMethod });
  };
  // --- END OF FIX ---

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 relative">
        <h2 className="text-2xl font-bold mb-4 text-center">Payment & Billing Information</h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          Please select payment method and confirm
        </p>

        {/* Payment Method */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Payment Method</h3>
          <div className="space-y-3">
            {['GCash', 'Debit Card', 'Credit Card'].map((method) => (
              <label key={method} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={selectedPaymentMethod === method}
                  onChange={() => setSelectedPaymentMethod(method)}
                  className="form-radio h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">{method}</span>
                {method === 'GCash' && <span className="text-xs text-gray-500">- Mobile wallet payment - instant confirmation</span>}
                {method === 'Debit Card' && <span className="text-xs text-gray-500">- Visa, Mastercard, BancNet, Megalink</span>}
                {method === 'Credit Card' && <span className="text-xs text-gray-500">- Visa, Mastercard, JCB, American Express</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Billing Summary (FOR DISPLAY ONLY) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Billing Summary</h3>
          <div className="space-y-2 text-sm text-gray-700">
             <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="font-medium">{orderType} {deliveryLocation ? `(${deliveryLocation})` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge ({serviceChargeRate * 100}%):</span>
              <span>₱{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({vatRate * 100}%):</span>
              <span>₱{vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-green-700 pt-2 border-t border-gray-200">
              <span>Total Amount Due:</span>
              {/* We use grandTotal (display) but totalAmount (prop) is also passed just in case */}
              <span>₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Confirm Payment
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;