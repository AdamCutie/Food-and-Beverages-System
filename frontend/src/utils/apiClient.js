import toast from 'react-hot-toast';

// The base URL for your API
const API_BASE_URL = 'http://66.181.46.64/api';

/**
 * A wrapper around the native fetch function that automatically:
 * 1. Prepends the API_BASE_URL to requests.
 * 2. Attaches the JWT token (if it exists) to the Authorization header.
 * 3. Catches 401 (Unauthorized) errors, shows a toast, and redirects to login.
 * 4. Correctly handles FormData for file uploads.
 */
const apiClient = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Initialize headers if they don't exist in options
  if (!options.headers) {
    options.headers = {};
  }

  // --- THIS IS THE FIX ---
  if (options.body instanceof FormData) {
    // If body is FormData, we MUST let the browser set the
    // Content-Type header so it can include the 'boundary'.
    // We delete any Content-Type header the user might have passed.
    delete options.headers['Content-Type']; 
  } else if (!options.headers['Content-Type']) {
    // If it's not FormData and no C-T is set, default to JSON.
    options.headers['Content-Type'] = 'application/json';
  }
  // --- END OF FIX ---

  // Add the Authorization header if the token exists
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      toast.error('Your session has expired. Please log in again.');
      
      window.location.href = '/login'; 
      
      throw new Error('Session expired');
    }

    return response;

  } catch (error) {
    console.error('API Client Error:', error);
    throw error; 
  }
};

export default apiClient;