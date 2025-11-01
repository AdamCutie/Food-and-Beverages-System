import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Helper function to format as PHP Peso
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount || 0);
};

const PosPaymentModal = ({ isOpen, onClose, totalDue, onConfirmPayment }) => {
  const [amountTendered, setAmountTendered] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  // Recalculate change whenever the amount tendered changes
  useEffect(() => {
    const tendered = parseFloat(amountTendered);
    if (!isNaN(tendered) && tendered >= totalDue) {
      setChangeAmount(tendered - totalDue);
    } else {
      setChangeAmount(0);
    }
  }, [amountTendered, totalDue]);

  // Reset the form when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setAmountTendered('');
      setChangeAmount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const tendered = parseFloat(amountTendered);
    if (isNaN(tendered) || tendered < totalDue) {
      alert('Amount tendered must be equal to or greater than the total due.');
      return;
    }
    // Pass the new data back to the parent page
    onConfirmPayment({
      amount_tendered: tendered,
      change_amount: changeAmount,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary">
            Cash Payment
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        
        <div className="space-y-4">
          {/* Total Due */}
          <div className="text-center bg-gray-100 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-700">Total Amount Due</label>
            <p className="text-4xl font-bold text-green-700">{formatCurrency(totalDue)}</p>
          </div>

          {/* Amount Tendered Input */}
          <div>
            <label htmlFor="amountTendered" className="block text-sm font-medium text-gray-700">
              Amount Tendered (Cash)
            </label>
            <input
              type="number"
              id="amountTendered"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              required
              min={totalDue}
              className="mt-1 block w-full text-2xl p-3 border border-gray-300 rounded-md shadow-sm"
              placeholder="0.00"
            />
          </div>

          {/* Change */}
          <div className="text-center bg-blue-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-blue-700">Change Due</label>
            <p className="text-3xl font-bold text-blue-800">{formatCurrency(changeAmount)}</p>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="py-2 px-6 bg-green-700 text-white rounded-md hover:bg-green-800"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosPaymentModal;