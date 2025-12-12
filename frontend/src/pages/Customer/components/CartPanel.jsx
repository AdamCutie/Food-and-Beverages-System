import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { X, Trash2, Minus, Plus, MessageSquare, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../../utils/apiClient';
import '../CustomerTheme.css';
import { useSocket } from '../../../context/SocketContext';
import { useCart } from '../../../context/CartContext'; 
import { useAuth } from '../../../context/AuthContext'; 
import toast from 'react-hot-toast';

const CartPanel = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, updateInstruction, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('Dine-in');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Location Data
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  
  // Internal State for Room Check
  const [activeRoom, setActiveRoom] = useState(null);
  const [isFetchingRoom, setIsFetchingRoom] = useState(false);

  const { socket } = useSocket();

  // ✅ REF TRICK: Keeps 'currentCart' always fresh for the Payment function
  const cartRef = useRef(cart);
  useEffect(() => {
      cartRef.current = cart;
  }, [cart]);

  // 1. Fetch Location Data (Tables Only)
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tableRes = await apiClient('/tables');
        if (tableRes.ok) setTables(await tableRes.json());
      } catch (error) {
        console.error("Failed to load tables", error);
      }
    };
    fetchTables();
  }, []);

  // 2. Fetch Active Room when "Room Dining" is selected
  useEffect(() => {
    if (orderType === 'Room Dining') {
        const checkRoom = async () => {
            setIsFetchingRoom(true);
            try {
                const res = await apiClient('/rooms/my-active-room');
                if (res.ok) {
                    const data = await res.json();
                    setActiveRoom(data.room);
                } else {
                    setActiveRoom(null);
                }
            } catch (error) {
                console.error("Room check failed", error);
                setActiveRoom(null);
            } finally {
                setIsFetchingRoom(false);
            }
        };
        checkRoom();
    }
  }, [orderType]);

  // 3. Real-time Table Updates
  useEffect(() => {
    if (socket) {
        socket.on('table-update', (data) => {
            setTables(prevTables => prevTables.map(table => {
                if (table.table_id === parseInt(data.table_id)) {
                    return { ...table, status: data.status };
                }
                return table;
            }));
            if (data.status === 'Occupied' && parseInt(selectedTableId) === parseInt(data.table_id)) {
                 setSelectedTableId(''); 
            }
        });
    }
    return () => socket && socket.off('table-update');
  }, [socket, selectedTableId]);

  // 4. Calculations
  const subtotal = cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  const serviceAmount = subtotal * 0.10;
  const vatAmount = (subtotal + serviceAmount) * 0.12;
  const grandTotal = subtotal + serviceAmount + vatAmount;

  // 5. Checkout Logic (With Save Delay)
  const handlePlaceOrder = async () => {
    if (!user) {
        toast.error("Please login to place an order.");
        navigate('/login');
        return;
    }
    
    setIsPlacingOrder(true);
    
    // ✅ TIMEOUT: Gives the input field 0.1s to save the note before we send it
    setTimeout(async () => {
        const toastId = toast.loading('Connecting to PayMongo...');

        try {
            let tableIdToSend = null;
            let roomIdToSend = null;

            if (orderType === 'Dine-in') {
                tableIdToSend = selectedTableId; 
            } else if (orderType === 'Room Dining') {
                roomIdToSend = activeRoom?.room_id;
            }

            // ✅ USE REF: Grabs the live data (with the note we just saved)
            const currentCart = cartRef.current;

            const checkoutData = {
                cart_items: currentCart.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    instructions: item.instructions || '' 
                })),
                
                table_id: tableIdToSend, 
                room_id: roomIdToSend,

                special_instructions: currentCart
                    .filter(item => item.instructions)
                    .map(item => `${item.item_name}: ${item.instructions}`)
                    .join('; ') || null
            };

            const response = await apiClient('/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to initialize payment');
            }

            if (result.checkout_url) {
                toast.success('Redirecting to payment...', { id: toastId });
                clearCart(); 
                window.location.href = result.checkout_url;
            } else {
                throw new Error("No checkout URL received");
            }
            
        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error(error.message, { id: toastId });
        } finally {
            setIsPlacingOrder(false);
        }
    }, 100); 
  };

  return (
    <>
      <div className={`cart-overlay ${isOpen ? '' : 'hidden'}`} onClick={onClose} />
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        
        <div className="cart-header">
          <h2 className="cart-title">My Order</h2>
          <button onClick={onClose} className="cart-close-btn"><X size={24} /></button>
        </div>

        <div className="cart-content">
          <div className="order-type-container">
            {['Dine-in', 'Room Dining'].map(type => (
                <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`order-type-btn ${orderType === type ? 'active' : 'inactive'}`}
                >
                    {type}
                </button>
            ))}
          </div>

          <div className="location-container">
            <label className="location-label">
              {orderType === 'Dine-in' ? 'Select Table' : 'Delivery Location'}
            </label>
            <div className="location-select-wrapper">
                {orderType === 'Dine-in' ? (
                    <select 
                        value={selectedTableId} 
                        onChange={(e) => setSelectedTableId(e.target.value)} 
                        className="location-select"
                    >
                        <option value="">-- Choose a Table --</option>
                        {tables.map(table => (
                            <option key={table.table_id} value={table.table_id} disabled={table.status !== 'Available'} className={table.status !== 'Available' ? 'text-gray-400 bg-gray-100' : ''}>
                                Table {table.table_number} ({table.capacity} pax) {table.status !== 'Available' ? '- Occupied' : ''}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className={`p-3 rounded-lg border flex items-center gap-3 w-full transition-colors ${
                        isFetchingRoom ? 'bg-gray-50 border-gray-200' :
                        activeRoom ? 'bg-green-50 border-green-200 text-green-800' : 
                        'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        {isFetchingRoom ? (
                             <span className="text-sm italic text-gray-500 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                Detecting room...
                             </span>
                        ) : activeRoom ? (
                             <div className="flex items-center justify-between w-full">
                                <span className="font-bold flex items-center gap-2">
                                    <MapPin size={18} className="text-green-700" />
                                    Room {activeRoom.room_num}
                                </span>
                                <span className="text-[10px] bg-green-200 px-2 py-0.5 rounded-full text-green-900 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle size={10} />
                                    Verified
                                </span>
                             </div>
                        ) : (
                             <span className="text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={18} />
                                No active check-in found.
                             </span>
                        )}
                    </div>
                )}
                {orderType === 'Dine-in' && (
                    <div className="location-arrow">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-4 pb-4">
            {cart.length === 0 ? (
              <div className="cart-empty-state"><p>Your cart is empty</p></div>
            ) : (
              cart.map((item) => (
                  <div key={item.item_id} className="cart-item">
                      <div className="cart-item-top">
                          <div className="cart-item-details w-full"> 
                              <div className="cart-item-header">
                                  <div>
                                      <h3 className="cart-item-name">{item.item_name}</h3>
                                      <p className="cart-item-price">₱{parseFloat(item.price).toFixed(2)} <span>/ea</span></p>
                                  </div>
                                  <div className="cart-item-total">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                              </div>
                              <div className="cart-item-controls">
                                  <div className="qty-control">
                                      <button onClick={() => updateQuantity(item.item_id, item.quantity - 1)} className="qty-btn"><Minus size={14} strokeWidth={3} /></button>
                                      <span className="qty-display">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.item_id, item.quantity + 1)} className="qty-btn"><Plus size={14} strokeWidth={3} /></button>
                                  </div>
                                  <button onClick={() => removeFromCart(item.item_id)} className="remove-btn"><Trash2 size={18} /></button>
                              </div>
                          </div>
                      </div>
                      <div className="instruction-wrapper">
                          <div className="instruction-icon"><MessageSquare size={14} /></div>
                          {/* ✅ FAST INPUT: Solves the typing lag */}
                          <InstructionInput 
                              itemId={item.item_id} 
                              initialValue={item.instructions} 
                              updateInstruction={updateInstruction} 
                          />
                      </div>
                  </div>
              ))
            )}
          </div>
        </div>

        <div className="cart-footer">
             <div className="space-y-2 mb-4">
                <div className="summary-row"><span>Subtotal</span><span className="font-medium">₱{subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Service Charge (10%)</span><span className="font-medium">₱{serviceAmount.toFixed(2)}</span></div>
                <div className="summary-row"><span>VAT (12%)</span><span className="font-medium">₱{vatAmount.toFixed(2)}</span></div>
                <div className="summary-row total"><span>Total</span><span>₱{grandTotal.toFixed(2)}</span></div>
             </div>
             
             <button
                onClick={handlePlaceOrder}
                disabled={
                    cart.length === 0 || 
                    (orderType === 'Dine-in' && !selectedTableId) || 
                    (orderType === 'Room Dining' && !activeRoom) || 
                    isPlacingOrder
                }
                className="place-order-btn"
              >
                {isPlacingOrder ? 'Processing...' : 'Proceed to Payment'}
              </button>
        </div>
      </div>
    </>
  );
};

// ✅ HELPER COMPONENT: Handles smooth typing
const InstructionInput = ({ itemId, initialValue, updateInstruction }) => {
    const [localValue, setLocalValue] = useState(initialValue || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setLocalValue(initialValue || '');
    }, [initialValue]);

    const handleChange = (e) => {
        setLocalValue(e.target.value);
    };

    const saveChanges = () => {
        if (localValue !== initialValue) {
            updateInstruction(itemId, localValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveChanges();
            inputRef.current.blur();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder="Add notes (e.g. No onions)"
            value={localValue}
            onChange={handleChange}
            onBlur={saveChanges}     
            onKeyDown={handleKeyDown} 
            className="instruction-input"
        />
    );
};

export default CartPanel;