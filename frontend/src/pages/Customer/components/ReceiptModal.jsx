import React from 'react';
import { CheckCircle, Printer, Mail } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, orderDetails }) => {
  if (!isOpen || !orderDetails) return null;

  // --- THIS IS THE FIX ---
  // Destructure the new backend-provided financial data
  const {
    order_id,
    order_date,
    order_type,
    delivery_location,
    items,
    total_amount, // The final grand total paid
    payment_method,
    
    // Use the secure values from the backend
    items_total, 
    service_charge_amount,
    vat_amount
  } = orderDetails;

  // We no longer need to recalculate these.
  // We can derive the rates for display if needed, but it's safer to use the direct values.
  const subtotal = parseFloat(items_total || 0);
  const serviceCharge = parseFloat(service_charge_amount || 0);
  const vatAmount = parseFloat(vat_amount || 0);
  
  // Calculate service rate for display (e.g., "10%")
  // Handle division by zero if subtotal is 0
  const serviceChargeRate = subtotal > 0 ? (serviceCharge / subtotal) * 100 : 0;
  // Calculate VAT rate for display
  const vatRate = (subtotal + serviceCharge) > 0 ? (vatAmount / (subtotal + serviceCharge)) * 100 : 0;
  
  // --- END OF FIX ---

  // Placeholder for loyalty points
  const loyaltyPointsEarned = Math.floor(total_amount / 10); 

  // Format date nicely
  const formattedDate = new Date(order_date || Date.now()).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

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

        {/* --- 3. UPDATED BILLING SUMMARY --- */}
        {/* This now displays the accurate, backend-provided values */}
        <div className="border-t pt-4 space-y-2 text-sm text-gray-700">
           <div className="flex justify-between">
              <span>Subtotal (Items Total):</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge ({serviceChargeRate.toFixed(0)}%):</span>
              <span>₱{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({vatRate.toFixed(0)}%):</span>
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
        {/* --- END OF UPDATED BILLING --- */}


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