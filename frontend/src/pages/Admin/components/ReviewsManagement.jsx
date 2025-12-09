import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star, Trash2, Filter, MessageSquare, X, Calendar } from 'lucide-react'; // Added MessageSquare for comments
import apiClient from '../../../utils/apiClient';
import '../AdminTheme.css';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Sort
  const [filterRating, setFilterRating] = useState('All'); // 'All', '5', '4', etc.
  const [sortOrder, setSortOrder] = useState('newest');    // 'newest', 'oldest'

  // Modal for Reading Comments
  const [viewingReview, setViewingReview] = useState(null);

    // --- FILTERS STATE ---
    const [filterSource, setFilterSource] = useState('All');
    const [quickFilter, setQuickFilter] = useState('Today');
    
    // --- DATE HELPERS (Local Time) ---
    const getTodayStr = () => new Date().toLocaleDateString('en-CA');
    
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay(); 
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
      return new Date(d.setDate(diff)).toLocaleDateString('en-CA');
    };
  
    const getStartOfMonth = (date) => {
      const d = new Date(date);
      return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
    };
  
    // Initial Dates
    const [startDate, setStartDate] = useState(getTodayStr());
    const [endDate, setEndDate] = useState(getTodayStr());
  
    // --- TIMEZONE FIXER ---
    const fixDate = (dateInput) => {
        if (!dateInput) return new Date();
        const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
        if (dateStr.includes(' ') && !dateStr.includes('T')) return new Date(dateStr.replace(' ', 'T') + 'Z');
        if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) return new Date(dateStr + 'Z');
        return new Date(dateStr);
    };
  
    const getLocalDatePart = (dateObj) => {
        return new Date(dateObj).toLocaleDateString('en-CA');
    };

    // --- HANDLERS ---
  const handleQuickFilterChange = (e) => {
    const filter = e.target.value;
    setQuickFilter(filter);
    const today = new Date();
    const endStr = getTodayStr();
    let startStr = endStr;

    if (filter === 'Today') { startStr = endStr; }
    else if (filter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startStr = yesterday.toLocaleDateString('en-CA');
        setStartDate(startStr); setEndDate(startStr); return;
    } else if (filter === 'This Week') { startStr = getStartOfWeek(today); }
    else if (filter === 'This Month') { startStr = getStartOfMonth(today); }
    else if (filter === 'Custom') { return; }

    if (filter !== 'Custom') { setStartDate(startStr); setEndDate(endStr); }
  };


  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await apiClient('/ratings'); // Matches your new route
      if (!response.ok) throw new Error('Failed to fetch reviews');
      setReviews(await response.json());
    } catch (error) {
      if (error.message !== 'Session expired') toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review? This cannot be undone.')) return;
    try {
      const res = await apiClient(`/ratings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review');
      toast.success('Review deleted');
      setReviews(reviews.filter(r => r.rating_id !== id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  // --- PROCESSING LOGIC ---
  const getProcessedReviews = () => {
    let result = [...reviews];

    // 1. Filter by Rating
    if (filterRating !== 'All') {
        const target = parseInt(filterRating);
        result = result.filter(r => r.rating_value === target);
    }

    // 2. Sort by Date
    result.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  };

  const filteredReviews = getProcessedReviews();

  // Helper to render Stars
  const renderStars = (count) => {
      return (
          <div className="flex">
              {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < count ? "#F9A825" : "none"} 
                    color={i < count ? "#F9A825" : "#D1C0B6"} 
                  />
              ))}
          </div>
      );
  };

  if (loading) return <div className="p-8 text-center text-[#3C2A21]">Loading Reviews...</div>;

  return (
    <div className="w-full">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
           <h2 className="admin-page-title mb-1">Food Reviews</h2>
           <p className="text-sm text-gray-500">Total Reviews: {reviews.length}</p>
        </div>
        
        <div className="flex gap-4">
            {/* Rating Filter (Orange) */}
            <div className="relative">
                <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="admin-select-primary appearance-none pr-10" 
                    style={{ minWidth: '160px' }}
                >
                    <option value="All">All Ratings</option>
                    <option value="5">5 Stars Only</option>
                    <option value="4">4 Stars Only</option>
                    <option value="3">3 Stars Only</option>
                    <option value="2">2 Stars Only</option>
                    <option value="1">1 Star Only</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Filter size={18} />
                </div>
            </div>

            {/* Sort Dropdown (White) */}
            <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="admin-btn bg-white text-[#3C2A21] hover:bg-gray-100 shadow-lg border border-gray-200"
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>

            {/* 1. Date Filter Dropdown */}
            <div className="relative">
                <select 
                    value={quickFilter} 
                    onChange={handleQuickFilterChange} 
                    className="admin-select-primary appearance-none pr-10"
                    style={{ minWidth: '150px' }}
                >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                    <option value="Custom">Custom</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#3C2A21]">
                    <Calendar size={18} />
                </div>
            </div>
        </div>
      </div>

      {/* 2. TABLE */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Rating</th>
              <th>Comment</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-gray-500">No reviews found.</td></tr>
            ) : (
                filteredReviews.map((review) => (
                  <tr key={review.rating_id}>
                    <td className="text-sm text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="font-medium">{review.customer_name || 'Guest'}</td>
                    <td className="text-[#3C2A21] font-bold">{review.item_name}</td>
                    <td>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F9A825]">{review.rating_value}</span>
                            {renderStars(review.rating_value)}
                        </div>
                    </td>
                    <td>
                        {review.review_text ? (
                             <button 
                                onClick={() => setViewingReview(review)}
                                className="text-left text-sm text-gray-600 hover:text-[#F9A825] flex items-center gap-2 max-w-[200px] truncate"
                             >
                                <MessageSquare size={14} className="flex-shrink-0"/>
                                <span className="truncate">{review.review_text}</span>
                             </button>
                        ) : (
                            <span className="text-gray-400 italic text-xs">No comment</span>
                        )}
                    </td>
                    <td className="text-center">
                        <button 
                            onClick={() => handleDelete(review.rating_id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Review"
                        >
                            <Trash2 size={18} />
                        </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. READ MORE MODAL */}
      {viewingReview && (
        <div 
            className="fixed inset-0 flex justify-center items-center z-50 animate-fadeIn"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} 
        >
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl relative">
                <button 
                    onClick={() => setViewingReview(null)} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-[#3C2A21] mb-2">Review Details</h3>
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <span>{new Date(viewingReview.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-bold text-[#F9A825]">{viewingReview.item_name}</span>
                </div>

                <div className="mb-4">
                    {renderStars(viewingReview.rating_value)}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 leading-relaxed text-sm">
                    {viewingReview.review_text}
                </div>

                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => setViewingReview(null)}
                        className="admin-btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ReviewsManagement;