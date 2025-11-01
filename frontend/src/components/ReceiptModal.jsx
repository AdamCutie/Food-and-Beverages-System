import React from 'react';
import { CheckCircle, Printer, Mail } from 'lucide-react'; // Icons for visual flair

const ReceiptModal = ({ isOpen, onClose, orderDetails }) => {
  if (!isOpen || !orderDetails) return null;

  // Destructure details for easier access
  const {
    order_id,
    order_date, // Assuming this comes from the backend order creation response
    order_type,
    delivery_location,
    items, // The cartItems array passed at the time of order
    total_amount, // The final grand total paid
    payment_method // The simulated method selected
  } = orderDetails;

  // Recalculate billing summary components (could also be passed in orderDetails if available)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceChargeRate = 0.10;
  const vatRate = 0.12;
  const serviceCharge = subtotal * serviceChargeRate;
  const vatAmount = (subtotal + serviceCharge) * vatRate;
  // const grandTotal = subtotal + serviceCharge + vatAmount; // Should match total_amount

  // Placeholder for loyalty points - you'd calculate this based on your rules
  const loyaltyPointsEarned = Math.floor(total_amount / 10); // Example: 1 point per 10 PHP

  // Format date nicely
  const formattedDate = new Date(order_date || Date.now()).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Placeholder for Receipt No - could be same as order_id or generated separately
  const receiptNo = `OR-${String(order_id).padStart(6, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto p-6 relative">

        {/* Header */}
        <div className="text-center mb-5">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-gray-800">Payment Successful</h2>
          <p className="text-xs text-gray-500 mt-1">Your official receipt for this transaction</p>
        </div>

        {/* Hotel/Brand Info (Optional) */}
        <div className="text-center mb-5 border-b pb-4">
           {/* You can add your logo here if you have it */}
           {/* <img src="/path/to/your/logo.png" alt="Hotel Logo" className="h-10 mx-auto mb-1"/> */}
           <h3 className="font-bold text-gray-700">THE CELESTIA HOTEL</h3>
           <p className="text-xs text-gray-500">VAT Reg TIN: 123-456-789-000</p>
        </div>


        {/* Receipt Details */}
        <div className="space-y-2 text-sm text-gray-700 mb-5">
          <div className="flex justify-between">
            <span>Receipt No:</span>
            <span className="font-medium">{receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Date / Time:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          {/* Add Guest Name here if you fetch it based on customer_id */}
          {/* <div className="flex justify-between"><span>Guest Name:</span><span className="font-medium">{guestName}</span></div> */}
          <div className="flex justify-between">
            <span>Order Type:</span>
            <span className="font-medium">{order_type} {delivery_location ? `(${delivery_location})` : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium">{payment_method || 'Simulated'}</span>
          </div>
        </div>

        {/* Items Ordered */}
        <div className="mb-4 border-t pt-4">
          <h4 className="font-semibold mb-2 text-gray-800">Items Ordered:</h4>
          <div className="space-y-1 text-sm text-gray-700 max-h-32 overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div key={item.item_id || index} className="flex justify-between items-center">
                <span>{item.quantity} x {item.item_name}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="border-t pt-4 space-y-2 text-sm text-gray-700">
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
            <div className="flex justify-between font-bold text-lg text-black pt-2 border-t mt-2">
            <span>Total Amount Paid:</span>
            <span>₱{parseFloat(total_amount).toFixed(2)}</span>
            </div>
             <div className="flex justify-between text-green-600 font-semibold pt-2">
              <span>Loyalty Points Earned:</span>
              <span>+{loyaltyPointsEarned} points</span>
            </div>
        </div>

         {/* Email/Print Note */}
         <div className="text-center mt-5 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <Mail className="inline-block w-4 h-4 mr-1"/> A copy has been sent to your registered email address.
            <br />
            <Printer className="inline-block w-4 h-4 mr-1"/> You may print this page for your records.
         </div>

        {/* Thank You & Close Button */}
        <p className="text-center text-xs text-gray-500 mt-4">Thank you for dining at The Celestia Hotel!</p>
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Done
          </button>
        </div>

        {/* Optional Close X Button */}
         <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ReceiptModal;