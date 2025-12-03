import React, { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus, MessageSquare } from 'lucide-react';
import apiClient from '../../../utils/apiClient';
import '../CustomerTheme.css';
import { useSocket } from '../../../context/SocketContext';

const CartPanel = ({
  cartItems = [],
  onUpdateQuantity,
  onPlaceOrder,
  isOpen,
  onClose,
  orderType,
  setOrderType,
  onUpdateItemInstruction, 
  onRemoveItem,
  deliveryLocation,
  setDeliveryLocation,
  isPlacingOrder
}) => {
  const [tables, setTables] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const { socket } = useSocket();

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

  // Listen for Real-Time Table Updates
  useEffect(() => {
    if (socket) {
        socket.on('table-update', (data) => {
            console.log("🪑 Real-time Table Update:", data);
            
            // Update the tables list instantly
            setTables(prevTables => prevTables.map(table => {
                if (table.table_id === parseInt(data.table_id)) {
                    return { ...table, status: data.status };
                }
                return table;
            }));

            // Clear selection if the selected table becomes occupied
            if (data.status === 'Occupied' && parseInt(selectedTableId) === parseInt(data.table_id)) {
                 setSelectedTableId(''); 
                 setDeliveryLocation('');
            }
        });
    }

    return () => {
        if (socket) {
            socket.off('table-update');
        }
    };
  }, [socket, selectedTableId, setDeliveryLocation]);

  useEffect(() => {
    if (orderType === 'Dine-in') {
        setSelectedRoomId('');
        setDeliveryLocation('');
    } else if (orderType === 'Room Dining') {
        setSelectedTableId('');
        setDeliveryLocation('');
    }
  }, [orderType, setDeliveryLocation]);

  // ✅ FIX: Properly handle table selection
  const handleTableChange = (e) => {
    const tId = e.target.value;
    setSelectedTableId(tId);
    
    // Set deliveryLocation to table_id for backend
    setDeliveryLocation(tId); 
  };

  // ✅ FIX: Properly handle room selection
  const handleRoomChange = (e) => {
    const rId = e.target.value;
    setSelectedRoomId(rId);
    
    // Set deliveryLocation to room_id for backend
    setDeliveryLocation(rId);
  };

  const SERVICE_RATE = 0.10; 
  const VAT_RATE = 0.12;     
  const subtotal = cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  const serviceAmount = subtotal * SERVICE_RATE;
  const vatAmount = (subtotal + serviceAmount) * VAT_RATE;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? '' : 'hidden'}`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        
        {/* --- Header --- */}
        <div className="cart-header">
          <h2 className="cart-title">My Order</h2>
          <button onClick={onClose} className="cart-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="cart-content">
          
          {/* Order Type Selector */}
          <div className="order-type-container">
            <button
              onClick={() => setOrderType('Dine-in')}
              className={`order-type-btn ${orderType === 'Dine-in' ? 'active' : 'inactive'}`}
            >
              Dine-in
            </button>
            <button
              onClick={() => setOrderType('Room Dining')}
              className={`order-type-btn ${orderType === 'Room Dining' ? 'active' : 'inactive'}`}
            >
              Room Dining
            </button>
          </div>

          {/* Location Dropdown */}
          <div className="location-container">
            <label className="location-label">
              {orderType === 'Dine-in' ? 'Select Table' : 'Select Room'}
            </label>
            <div className="location-select-wrapper">
                {orderType === 'Dine-in' ? (
                    <select
                        value={selectedTableId}
                        onChange={handleTableChange}
                        className="location-select"
                    >
                        <option value="">-- Choose a Table --</option>
                        {tables.map(table => (
                            <option 
                                key={table.table_id} 
                                value={table.table_id} 
                                disabled={table.status !== 'Available'}
                                className={table.status !== 'Available' ? 'text-gray-400 bg-gray-100' : ''}
                            >
                                Table {table.table_number} ({table.capacity} pax) {table.status !== 'Available' ? '- Occupied' : ''}
                            </option>
                        ))}
                    </select>
                ) : (
                    <select
                        value={selectedRoomId}
                        onChange={handleRoomChange}
                        className="location-select"
                    >
                        <option value="">-- Choose a Room --</option>
                        {rooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>
                                Room {room.room_num} ({room.status})
                            </option>
                        ))}
                    </select>
                )}
                <div className="location-arrow">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <p>Your cart is empty</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemTotal = parseFloat(item.price) * item.quantity;

                return (
                  <div key={item.item_id} className="cart-item">
                      {/* Top Section: Details + Total */}
                      <div className="cart-item-top">
                          
                          {/* Details Column */}
                          <div className="cart-item-details w-full"> 
                              {/* Name/Price & Item Total Row */}
                              <div className="cart-item-header">
                                  <div>
                                      <h3 className="cart-item-name">{item.item_name}</h3>
                                      <p className="cart-item-price">
                                          ₱{parseFloat(item.price).toFixed(2)} <span>/ea</span>
                                      </p>
                                  </div>
                                  <div className="cart-item-total">
                                      ₱{itemTotal.toFixed(2)}
                                  </div>
                              </div>
                              
                              {/* Controls Row */}
                              <div className="cart-item-controls">
                                  <div className="qty-control">
                                      <button 
                                          onClick={() => onUpdateQuantity(item.item_id, item.quantity - 1)} 
                                          className="qty-btn"
                                      >
                                          <Minus size={14} strokeWidth={3} />
                                      </button>
                                      <span className="qty-display">{item.quantity}</span>
                                      <button 
                                          onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)} 
                                          className="qty-btn"
                                      >
                                          <Plus size={14} strokeWidth={3} />
                                      </button>
                                  </div>

                                  <button 
                                      onClick={() => onRemoveItem(item.item_id)} 
                                      className="remove-btn"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Specific Instruction Input */}
                      <div className="instruction-wrapper">
                          <div className="instruction-icon">
                              <MessageSquare size={14} />
                          </div>
                          <input
                              type="text"
                              placeholder="Add notes (e.g. No onions)"
                              value={item.instructions || ''}
                              onChange={(e) => onUpdateItemInstruction(item.item_id, e.target.value)}
                              className="instruction-input"
                          />
                      </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- Footer (Totals) --- */}
        <div className="cart-footer">
             <div className="space-y-2 mb-4">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Service Charge (10%)</span>
                    <span className="font-medium">₱{serviceAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>VAT (12%)</span>
                    <span className="font-medium">₱{vatAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                    <span>Total</span>
                    <span>₱{grandTotal.toFixed(2)}</span>
                </div>
             </div>
              
              <button
                onClick={() => onPlaceOrder({ 
                    table_id: orderType === 'Dine-in' ? selectedTableId : null,
                    room_id: orderType === 'Room Dining' ? selectedRoomId : null 
                })}
                disabled={
                    cartItems.length === 0 || 
                    (orderType === 'Dine-in' && !selectedTableId) || 
                    (orderType === 'Room Dining' && !selectedRoomId) ||
                    isPlacingOrder
                }
                className="place-order-btn"
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
              </button>
        </div>
      </div>
    </>
  );
};

export default CartPanel;