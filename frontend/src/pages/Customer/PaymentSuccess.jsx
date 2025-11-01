import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import ReceiptModal from "./components/ReceiptModal";
import toast from "react-hot-toast";
import apiClient from '../../utils/apiClient'; // This should be here

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const orderId = searchParams.get("order_id");
  const amount = searchParams.get("amount"); // Fallback

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await apiClient(`/orders/${orderId}`);
        if (!response.ok) throw new Error("Failed to fetch order details");
        const data = await response.json();

        // --- THIS IS THE FIX ---
        // Pass all financial data from the backend to the receipt
        setOrderDetails({
          order_id: data.order_id,
          order_date: data.order_date,
          order_type: data.order_type,
          delivery_location: data.delivery_location,
          items: data.items || [],
          
          // Use the secure backend values
          items_total: data.items_total,
          service_charge_amount: data.service_charge_amount,
          vat_amount: data.vat_amount,
          total_amount: data.total_price || parseFloat(amount) || 0,

          payment_method: data.payment_method || "PayMongo Checkout",
        });
        // --- END OF FIX ---

        setIsOpen(true); // Automatically open modal
      } catch (err) {
        if (err.message !== 'Session expired') {
          console.error("Error fetching order details:", err);
          toast.error("Unable to load receipt.");
        }
      }
    };

    if (orderId) fetchOrderDetails();
  }, [orderId, amount]);

  const handleClose = () => {
    setIsOpen(false);
    navigate("/"); // Return to main menu after closing
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 text-center p-6">
      <CheckCircle className="w-20 h-20 text-green-600 mb-4 animate-bounce" />
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        Payment Successful 🎉
      </h1>
      <p className="text-gray-600 mb-6">Generating your receipt...</p>

      {/* Show the receipt modal */}
      <ReceiptModal
        isOpen={isOpen}
        onClose={handleClose}
        orderDetails={orderDetails}
      />
    </div>
  );
};

export default PaymentSuccess;