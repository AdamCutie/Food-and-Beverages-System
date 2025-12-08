import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingCart, User, CreditCard, ShoppingBag, Utensils } from 'lucide-react';

const PosCart = ({
  cartItems = [],
  availableTables = [], // ✅ NEW: List of available tables from parent
  onUpdateQuantity,
  onPlaceOrder,
  instructions,
  setInstructions,
  onRemoveItem,
}) => {
  // Local State
  const [customerName, setCustomerName] = useState('');
  const [serviceMode, setServiceMode] = useState('Take Out'); // Default
  const [selectedTableId, setSelectedTableId] = useState(''); // Store ID

  // Calculations
  const SERVICE_RATE = 0.10; 
  const VAT_RATE = 0.12;     

  const subtotal = cartItems.reduce(
    (total, item) => total + parseFloat(item.price || 0) * item.quantity,
    0
  );
  const serviceAmount = subtotal * SERVICE_RATE;
  const vatAmount = (subtotal + serviceAmount) * VAT_RATE;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  // Reset when cart clears
  useEffect(() => {
    if (cartItems.length === 0) {
      setCustomerName('');
      setServiceMode('Take Out');
      setSelectedTableId('');
    }
  }, [cartItems]);

  const handleProceed = () => {
      // Validate Table Selection if "For Here"
      if (serviceMode === 'For Here' && !selectedTableId) {
          alert("Please select a table for Dine-in orders.");
          return;
      }

      // Find Table Number for display
      const tableObj = availableTables.find(t => t.table_id === parseInt(selectedTableId));
      const tableNumber = tableObj ? tableObj.table_number : 'Unknown';

      // Bundle all data for the parent
      const orderMeta = {
          totalAmount: grandTotal,
          customerName: customerName || 'Guest',
          serviceMode: serviceMode,
          tableId: serviceMode === 'For Here' ? selectedTableId : null,
          tableNumber: serviceMode === 'For Here' ? tableNumber : null
      };

      onPlaceOrder(orderMeta);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg border-l border-gray-200">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-100">
        <h2 className="text-2xl font-bold text-[#3C2A21]">New Order</h2>
        <span className="text-xs font-bold text-[#F9A825] uppercase tracking-wider">Walk-in Service</span>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
        
        {/* Service Mode Buttons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Service Mode
          </label>
          <div className="flex gap-2">
            <button
                onClick={() => setServiceMode('Take Out')}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                serviceMode === 'Take Out' ? 'bg-[#F9A825] text-[#3C2A21]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <ShoppingBag size={18}/> Take Out
            </button>
            <button
                onClick={() => setServiceMode('For Here')}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                serviceMode === 'For Here' ? 'bg-[#F9A825] text-[#3C2A21]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                <Utensils size={18}/> For Here
            </button>
           </div>
        </div>

        {/* CONDITIONAL: Table Dropdown (Only if For Here) */}
        {serviceMode === 'For Here' && (
            <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Table</label>
                <select 
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#F9A825] bg-white"
                >
                    <option value="">-- Choose a Table --</option>
                    {availableTables.length > 0 ? (
                        availableTables.map(t => (
                            <option key={t.table_id} value={t.table_id}>
                                Table {t.table_number} (Cap: {t.capacity})
                            </option>
                        ))
                    ) : (
                        <option disabled>No tables available</option>
                    )}
                </select>
            </div>
        )}

        {/* Customer Name Input */}
        <div>
          <label htmlFor="cus_name" className="block text-sm font-semibold text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            id="cus_name"
            type="text" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent"
            placeholder='e.g., "Nicole"'
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto pr-2 border-t border-gray-100 pt-4">
           {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.item_id} className="flex justify-between items-center group">
                  <div>
                    <p className="font-semibold text-[#3C2A21]">{item.item_name}</p>
                    <p className="text-sm text-gray-500">₱{parseFloat(item.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => onUpdateQuantity(item.item_id, item.quantity - 1)} className="bg-gray-100 w-8 h-8 rounded-full font-bold text-gray-600 hover:bg-[#F9A825] hover:text-white transition-colors">-</button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)} className="bg-gray-100 w-8 h-8 rounded-full font-bold text-gray-600 hover:bg-[#F9A825] hover:text-white transition-colors">+</button>
                    <button onClick={() => onRemoveItem(item.item_id)} className="text-gray-400 hover:text-red-500 ml-2 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-2">
          <textarea 
            id="instructions" 
            value={instructions} 
            onChange={(e) => setInstructions(e.target.value)} 
            rows="2" 
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent" 
            placeholder="Special instructions..."
          ></textarea>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-[#3C2A21] font-bold text-xl pt-2 mt-2">
            <span>Total amount</span>
            <span>₱{grandTotal.toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleProceed} 
            disabled={cartItems.length === 0}
            className="w-full mt-4 font-bold py-4 rounded-xl transition-all shadow-md bg-[#F9A825] text-[#3C2A21] hover:bg-[#e0961f] disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosCart;