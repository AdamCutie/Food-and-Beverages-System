import toast from 'react-hot-toast';

// The base URL for your API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * A wrapper around the native fetch function that automatically:
 * 1. Prepends the API_BASE_URL to requests.
 * 2. Attaches the JWT token (if it exists) to the Authorization header.
 * 3. Catches 401 (Unauthorized) errors, shows a toast, and redirects to login.
 */
const apiClient = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Initialize headers if they don't exist in options
  if (!options.headers) {
    options.headers = {};
  }

  // Set default 'Content-Type' to 'application/json' if not already set
  // and if we are not sending FormData
  if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
  }

  // Add the Authorization header if the token exists
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);

    // --- THIS IS THE CRITICAL LOGIC ---
    if (response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('authToken');
      toast.error('Your session has expired. Please log in again.');
      
      // Use window.location to force a full redirect and state clear
      window.location.href = '/login'; 
      
      // Throw an error to stop further execution in the calling function
      throw new Error('Session expired');
    }
    // --- End of 401 logic ---

    return response;

  } catch (error) {
    // This will catch network errors or the "Session expired" error
    console.error('API Client Error:', error);
    // Re-throw the error so the calling function's .catch() block can handle it
    throw error; 
  }
};

export default apiClient;