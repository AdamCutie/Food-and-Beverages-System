import toast from 'react-hot-toast';

// The base URL for your API
const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:21917/api' 
  : '/api';

/**
 * A wrapper around the native fetch function that handles:
 * 1. Base URL & Authentication
 * 2. Automatic FormData handling
 * 3. Global Error Handling (401 Session Expired & 429 Rate Limit)
 */
const apiClient = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Initialize headers if they don't exist in options
  if (!options.headers) {
    options.headers = {};
  }

  // --- 1. FormData Fix ---
  if (options.body instanceof FormData) {
    // Let browser set Content-Type for FormData (multipart/form-data)
    delete options.headers['Content-Type']; 
  } else if (!options.headers['Content-Type']) {
    // Default to JSON for everything else
    options.headers['Content-Type'] = 'application/json';
  }

  // --- 2. Auth Token ---
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${url}`, options);

    // ================================================================
    // ✅ NEW: GLOBAL RATE LIMIT CHECK (Status 429)
    // ================================================================
    if (response.status === 429) {
      // 1. Dispatch event to the GlobalHandler in App.jsx
      window.dispatchEvent(new Event('rate-limit-reached'));
      
      // 2. Return a safe "dummy" response to prevent the calling component 
      // from crashing before the UI switches to the RateLimit screen.
      return { 
        ok: false, 
        status: 429, 
        json: async () => ({ message: "Rate limit reached" }) 
      };
    }

    // ================================================================
    // ⚠️ EXISTING: SESSION EXPIRY CHECK (Status 401)
    // ================================================================
    if (response.status === 401) {
      // Only force logout if the error didn't come from the Login Page itself
      if (url !== '/auth/login') { 
        localStorage.removeItem('authToken');
        
        // Dispatch optional event if you want other components to react
        window.dispatchEvent(new Event('session-expired')); 

        toast.error('Your session has expired. Please log in again.');
        
        // Slight delay to allow toast to show before redirect
        setTimeout(() => {
             window.location.href = '/login'; 
        }, 1000);
        
        throw new Error('Session expired');
      }
    }

    return response;

  } catch (error) {
    console.error('API Client Error:', error);
    throw error; 
  }
};

export default apiClient;