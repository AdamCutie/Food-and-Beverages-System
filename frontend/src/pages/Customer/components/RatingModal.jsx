import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../utils/apiClient';
import '../CustomerTheme.css'; 

const RatingModal = ({ isOpen, onClose, itemToRate, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); 
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Loading state for check

  // ✅ NEW: Fetch existing rating when modal opens
  useEffect(() => {
    if (isOpen && itemToRate) {
        const checkExistingRating = async () => {
            setIsChecking(true);
            try {
                const res = await apiClient(`/ratings/user/${itemToRate.item_id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.found) {
                        setRating(data.rating.rating_value);
                        setReviewText(data.rating.review_text || '');
                    } else {
                        // Reset if no previous rating found
                        setRating(0);
                        setReviewText('');
                    }
                }
            } catch (err) {
                console.error("Failed to check rating", err);
            } finally {
                setIsChecking(false);
            }
        };
        checkExistingRating();
    }
  }, [isOpen, itemToRate]);

  if (!isOpen || !itemToRate) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient('/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemToRate.item_id, 
          rating_value: rating,
          review_text: reviewText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      toast.success("Feedback saved!");
      if (onSuccess) onSuccess(); 
      onClose();   

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <div className="text-center pt-8 pb-4 px-6">
           <h2 className="text-xl font-bold text-[#3C2A21] mb-1">
             {isChecking ? 'Checking...' : (rating > 0 ? 'Update Review' : 'Rate this Item')}
           </h2>
           <p className="text-[#F9A825] font-semibold text-lg">{itemToRate.item_name}</p>
        </div>

        {isChecking ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
        ) : (
            <>
                <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                    key={star}
                    type="button"
                    className="transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    >
                    <Star 
                        size={36} 
                        fill={(hoverRating || rating) >= star ? "#F9A825" : "none"} 
                        color={(hoverRating || rating) >= star ? "#F9A825" : "#D1C0B6"} 
                        strokeWidth={1.5}
                    />
                    </button>
                ))}
                </div>

                <div className="px-6 mb-6">
                <textarea
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9A825] text-sm bg-gray-50 resize-none"
                    rows="3"
                    placeholder="Describe your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                ></textarea>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#F9A825] text-[#3C2A21] font-bold rounded-xl hover:bg-[#e0961f] disabled:bg-gray-300 disabled:text-gray-500"
                >
                    {isSubmitting ? 'Saving...' : 'Submit'}
                </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default RatingModal;