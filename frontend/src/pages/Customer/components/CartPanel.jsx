import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import apiClient from '../../../utils/apiClient';

const CartPanel = ({
  cartItems = [],
  onUpdateQuantity,
  onPlaceOrder,
  isOpen,
  onClose,
  orderType,
  setOrderType,
  instructions,
  setInstructions,
  onRemoveItem,
  deliveryLocation,
  setDeliveryLocation,
  isPlacingOrder
}) => {
  const [tables, setTables] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // We need local state to control the inputs properly
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tableRes, roomRes] = await Promise.all([
            apiClient('/tables'),
            apiClient('/rooms')
        ]);

        if (tableRes.ok) setTables(await tableRes.json());
        if (roomRes.ok) setRooms(await roomRes.json());
      } catch (error) {
        console.error("Failed to load location data", error);
      }
    };
    fetchData();
  }, []);

  // --- RESET LOGIC ---
  // When order type changes, reset selections
  useEffect(() => {
    if (orderType === 'Dine-in') {
        setSelectedRoomId('');
        setDeliveryLocation(''); // Clear any old room data
    } else if (orderType === 'Room Dining') {
        setSelectedTableId('');
        setDeliveryLocation(''); // Clear any old table data
    }
  }, [orderType, setDeliveryLocation]);


  // --- HANDLERS ---

  const handleTableChange = (e) => {
    const tId = e.target.value;
    setSelectedTableId(tId);
    // Important: Pass this ID up to the parent via setDeliveryLocation so validation passes
    setDeliveryLocation(tId); 
  };

  const handleRoomChange = (e) => {
    const rId = e.target.value;
    setSelectedRoomId(rId);
    setDeliveryLocation(rId);
  };

  // Calculations
  const SERVICE_RATE = 0.10; 
  const VAT_RATE = 0.12;     
  const subtotal = cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  const serviceAmount = subtotal * SERVICE_RATE;
  const vatAmount = (subtotal + serviceAmount) * VAT_RATE;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/75 z-20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#fff2e0] shadow-lg z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#3C2A21]">My Order</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          {/* Order Type Buttons */}
          <div className="flex gap-2 mb-4" >
            <button
              onClick={() => setOrderType('Dine-in')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                orderType === 'Dine-in' ? 'bg-[#0B3D2E] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Dine-in
            </button>
            <button
              onClick={() => setOrderType('Room Dining')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                orderType === 'Room Dining' ? 'bg-[#0B3D2E] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Room Dining
            </button>
          </div>

          {/* Location Selector */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              {orderType === 'Dine-in' ? 'Select Table' : 'Select Room'}
            </label>

            {orderType === 'Dine-in' ? (
                <select
                    value={selectedTableId} // Controlled component
                    onChange={handleTableChange}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-[#3C2A21]"
                >
                    <option value="">-- Choose a Table --</option>
                    {tables.map(table => (
                        <option 
                            key={table.table_id} 
                            value={table.table_id}
                            disabled={table.status !== 'Available'} // Optional: Disable occupied tables?
                        >
                            Table {table.table_number} ({table.capacity} pax) {table.status !== 'Available' ? '- Occupied' : ''}
                        </option>
                    ))}
                </select>
            ) : (
                <select
                    value={selectedRoomId} // Controlled component
                    onChange={handleRoomChange}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white text-[#3C2A21]"
                >
                    <option value="">-- Choose a Room --</option>
                    {rooms.map(room => (
                        <option key={room.room_id} value={room.room_id}>
                            Room {room.room_num} ({room.status})
                        </option>
                    ))}
                </select>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 block mb-1">Special Instructions</label>
            <textarea
              rows="2"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g. No onions, extra sauce..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.item_id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#3C2A21]">{item.item_name}</p>
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

          {/* Footer */}
          <div className="border-t pt-4 mt-4 space-y-2 text-[#3C2A21]">
             <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Charge ({ (SERVICE_RATE * 100).toFixed(0) }%)</span>
                <span>₱{serviceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT ({ (VAT_RATE * 100).toFixed(0) }%)</span>
                <span>₱{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total amount</span>
                <span>₱{grandTotal.toFixed(2)}</span>
              </div>
              
              <button
                onClick={() => onPlaceOrder({ 
                    table_id: orderType === 'Dine-in' ? selectedTableId : null,
                    room_id: orderType === 'Room Dining' ? selectedRoomId : null 
                })}
                disabled={
                    cartItems.length === 0 || 
                    (orderType === 'Dine-in' && !selectedTableId) || 
                    (orderType === 'Room Dining' && !selectedRoomId)
                }
                className="w-full mt-4 bg-[#0B3D2E] text-white font-bold py-3 rounded-lg hover:bg-[#082f23] transition-colors disabled:bg-gray-400"
              >
                {isPlacingOrder ? 'Processing...' : 'Proceed to Payment'}
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPanel;