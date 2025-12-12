import React from 'react';
import { Printer, CheckCircle, X } from 'lucide-react';

const PosReceiptModal = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const { 
    order_id, order_date, customer_name, order_type, delivery_location,
    items, items_total, service_charge, vat_amount, total_amount,
    amount_tendered, change_amount 
  } = receiptData;

  // Print Function using Native Window Print
  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (num) => parseFloat(num || 0).toFixed(2);
  const formattedDate = new Date(order_date || Date.now()).toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:inset-auto print:static">
      
      {/* Print Styles injected directly */}
      <style>
  {`
    @media print {
      /* 1. Paper Size Simulation (use 'auto' height for real printer) */
      @page {
        size: 80mm 200mm; /* Fixed height for PDF simulation */
        margin: 0;        /* Vital: Tells printer not to add margins */
      }

      /* 2. Reset Body */
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 80mm !important; 
      }

      /* 3. Hide everything else */
      body * {
        visibility: hidden;
      }

      /* 4. Target the Receipt Container */
      #printable-receipt-content, #printable-receipt-content * {
        visibility: visible;
      }

      /* 5. Position and Stretch the Receipt */
      #printable-receipt-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important; /* Force it to touch the edges */
        margin: 0 !important;
        padding: 2mm !important; /* Tiny padding so text isn't cut off */
        font-family: 'Courier New', monospace; /* Classic receipt font */
        font-size: 12px; /* Make text readable */
      }
      
      /* Optional: Center headers if needed */
      #printable-receipt-content h2, 
      #printable-receipt-content h3 {
        text-align: center;
      }

      .no-print {
        display: none !important;
      }
    }
  `}
</style>

      {/* WRAPPER (White Box) */}
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-auto">
        
        {/* MODAL HEADER (Hidden on Print) */}
        <div className="p-4 bg-green-600 text-white flex justify-between items-center shrink-0 no-print">
            <div className="flex items-center gap-2">
                <CheckCircle size={24} />
                <h2 className="font-bold text-lg">Payment Successful!</h2>
            </div>
            <button onClick={onClose} className="hover:bg-green-700 p-1 rounded transition">
                <X size={20} />
            </button>
        </div>

        {/* SCROLLABLE PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center print:p-0 print:overflow-visible print:bg-white">
            
            {/* === ACTUAL RECEIPT CONTENT === */}
            {/* We give this an ID to target it in the CSS above */}
            <div 
                id="printable-receipt-content"
                className="bg-white p-4 shadow-sm text-xs font-mono text-black leading-tight"
                style={{ width: '80mm', minHeight: '100mm' }} 
            >
                {/* Header */}
                <div className="text-center mb-4 border-b border-black pb-2">
                    <h1 className="text-lg font-bold uppercase mb-1">Celestia Hotel Food and Beverages</h1>
                    <p>The Celestia Hotel • 100 Pasado St. Villa Celestia, Flat Uno, Palawan, Philippines</p>
                    <p>Tel: (02) 8123-4567</p>
                    <p className="mt-2 font-bold">OFFICIAL RECEIPT</p>
                </div>

                {/* Info */}
                <div className="mb-4">
                    <div className="flex justify-between"><span>Order #:</span> <span className="font-bold">{order_id}</span></div>
                    <div className="flex justify-between"><span>Date:</span> <span>{formattedDate}</span></div>
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
                            <span className="text-right">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="flex justify-between font-bold"><span>Subtotal:</span> <span>{formatPrice(items_total)}</span></div>
                <div className="flex justify-between"><span>Service Charge:</span> <span>{formatPrice(service_charge)}</span></div>
                <div className="flex justify-between border-b border-black pb-2 mb-2"><span>VAT (12%):</span> <span>{formatPrice(vat_amount)}</span></div>
                
                <div className="flex justify-between text-base font-bold mb-2"><span>TOTAL:</span> <span>P {formatPrice(total_amount)}</span></div>
                
                <div className="flex justify-between"><span>Cash Tendered:</span> <span>{formatPrice(amount_tendered)}</span></div>
                <div className="flex justify-between font-bold"><span>Change:</span> <span>{formatPrice(change_amount)}</span></div>

                {/* Footer */}
                <div className="text-center mt-6 pt-2 border-t border-black">
                    <p>Thank you for dining with us!</p>
                    <p>This serves as your official receipt.</p>
                </div>
            </div>
        </div>

        {/* MODAL FOOTER (Hidden on Print) */}
        <div className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0 no-print">
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