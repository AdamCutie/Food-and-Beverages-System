import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react"; // Added Loader icon
import ReceiptModal from "../../pages/Customer/components/ReceiptModal"; // Adjust path if needed
import toast from "react-hot-toast";
import apiClient from '../../utils/apiClient'; 

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("Verifying payment...");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // We clear the cart because the payment was successful
    localStorage.removeItem("cartItems");

    const fetchLatestOrder = async () => {
      try {
        // 1. Fetch the user's orders (Assuming this endpoint returns an array of orders)
        // Adjust '/orders/my-orders' to whatever route gets the current user's history
        const response = await apiClient('/orders/my-orders'); 
        
        if (!response.ok) throw new Error("Failed to fetch orders");
        
        const orders = await response.json();

        // 2. Check if we found any orders
        if (orders && orders.length > 0) {
          // 3. Get the newest order (Assuming the API sorts them, otherwise sort by ID desc)
          const latest = orders[0]; 

          // 4. CHECK TIME: Ensure this order was created just now (within last 2 mins)
          // This prevents showing an old order if the webhook failed.
          const orderTime = new Date(latest.order_date).getTime();
          const now = Date.now();
          const timeDiff = (now - orderTime) / 1000 / 60; // in minutes

          if (timeDiff < 5) { 
             // Success! We found the new order.
             setOrderDetails(latest);
             setIsOpen(true);
             setStatus("Payment Confirmed!");
             return; 
          }
        }

        // 5. IF NO NEW ORDER FOUND: Retry (Polling)
        // The webhook might be slightly delayed. We try 5 times (10 seconds total).
        if (retryCount < 5) {
          console.log(`Order not found yet. Retrying... (${retryCount + 1}/5)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Wait 2 seconds then try again
        } else {
          setStatus("Order processing is taking longer than usual.");
          toast.error("Payment received, but order creation is delayed. Please check 'My Orders'.");
          setTimeout(() => navigate('/menu'), 4000);
        }

      } catch (err) {
        console.error("Error fetching order details:", err);
        // Only retry on network errors or empty data, stop on auth errors
        if (retryCount < 5) {
           setTimeout(() => setRetryCount(prev => prev + 1), 2000);
        }
      }
    };

    fetchLatestOrder();
  }, [retryCount, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    navigate("/"); // Return to menu after closing
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 text-center p-6">
      
      {/* Dynamic Icon based on state */}
      {!isOpen ? (
        <Loader2 className="w-20 h-20 text-green-600 mb-4 animate-spin" />
      ) : (
        <CheckCircle className="w-20 h-20 text-green-600 mb-4 animate-bounce" />
      )}

      <h1 className="text-3xl font-bold text-green-700 mb-2">
        {isOpen ? "Payment Successful 🎉" : "Processing..."}
      </h1>
      
      <p className="text-gray-600 mb-6">{status}</p>

      {/* Show the receipt modal */}
      {orderDetails && (
        <ReceiptModal
          isOpen={isOpen}
          onClose={handleClose}
          orderDetails={orderDetails}
        />
      )}
    </div>
  );
};

export default PaymentSuccess;