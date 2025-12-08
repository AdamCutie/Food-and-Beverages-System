import React, { useRef } from 'react';
import { Printer, CheckCircle, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PosReceiptModal = ({ isOpen, onClose, receiptData }) => {
  const componentRef = useRef();

  // Print Handler
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Receipt-${receiptData?.order_id || 'New'}`,
    onAfterPrint: () => onClose() // Optional: Close modal after printing
  });

  if (!isOpen || !receiptData) return null;

  const { 
    order_id, order_date, customer_name, order_type, delivery_location,
    items, items_total, service_charge, vat_amount, total_amount,
    amount_tendered, change_amount 
  } = receiptData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      
      {/* WRAPPER (White Box) */}
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER (Screen Only) */}
        <div className="p-4 bg-green-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <CheckCircle size={24} />
                <h2 className="font-bold text-lg">Payment Successful!</h2>
            </div>
            <button onClick={onClose} className="hover:bg-green-700 p-1 rounded transition">
                <X size={20} />
            </button>
        </div>

        {/* SCROLLABLE PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center">
            
            {/* === ACTUAL RECEIPT (What gets printed) === */}
            <div 
                ref={componentRef}
                className="bg-white p-4 shadow-sm text-xs font-mono text-black leading-tight"
                style={{ width: '80mm', minHeight: '100mm' }} // Thermal Paper Width Standard
            >
                {/* Header */}
                <div className="text-center mb-4 border-b border-black pb-2">
                    <h1 className="text-lg font-bold uppercase mb-1">Celestia Hotel Food and Beverages</h1>
                    <p>123 Culinary Ave, Food City</p>
                    <p>Tel: (02) 8123-4567</p>
                    <p className="mt-2 font-bold">OFFICIAL RECEIPT</p>
                </div>

                {/* Info */}
                <div className="mb-4">
                    <div className="flex justify-between"><span>Order #:</span> <span className="font-bold">{order_id}</span></div>
                    <div className="flex justify-between"><span>Date:</span> <span>{new Date(order_date).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Customer:</span> <span>{customer_name}</span></div>
                    <div className="flex justify-between"><span>Type:</span> <span>{order_type}</span></div>
                    {delivery_location && <div className="flex justify-between"><span>Loc:</span> <span>{delivery_location}</span></div>}
                </div>

                {/* Items */}
                <div className="border-b border-black pb-2 mb-2">
                    <div className="flex font-bold mb-1 border-b border-dashed border-black pb-1">
                        <span className="w-8">Qty</span>
                        <span className="flex-1">Item</span>
                        <span className="text-right">Price</span>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex mb-1">
                            <span className="w-8">{item.quantity}</span>
                            <span className="flex-1">{item.item_name || 'Item'}</span>
                            <span className="text-right">{Number(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="flex justify-between font-bold"><span>Subtotal:</span> <span>{Number(items_total).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Service Charge:</span> <span>{Number(service_charge).toFixed(2)}</span></div>
                <div className="flex justify-between border-b border-black pb-2 mb-2"><span>VAT (12%):</span> <span>{Number(vat_amount).toFixed(2)}</span></div>
                
                <div className="flex justify-between text-base font-bold mb-2"><span>TOTAL:</span> <span>P {Number(total_amount).toFixed(2)}</span></div>
                
                <div className="flex justify-between"><span>Cash Tendered:</span> <span>{Number(amount_tendered).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Change:</span> <span>{Number(change_amount).toFixed(2)}</span></div>

                {/* Footer */}
                <div className="text-center mt-6 pt-2 border-t border-black">
                    <p>Thank you for dining with us!</p>
                    <p>This serves as your official receipt.</p>
                </div>
            </div>
        </div>

        {/* MODAL FOOTER (Actions) */}
        <div className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
            >
                Close (No Print)
            </button>
            <button 
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#F9A825] rounded-lg font-bold text-[#3C2A21] hover:bg-[#e0961f] flex items-center justify-center gap-2 shadow-lg"
            >
                <Printer size={20} /> Print Receipt
            </button>
        </div>
      </div>
    </div>
  );
};

export default PosReceiptModal;