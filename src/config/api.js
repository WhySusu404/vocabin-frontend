/**
 * API Configuration
 * Centralized configuration for backend API calls
 */

// Backend server configuration - use environment variable or fallback to localhost
// In production, PARCEL_BACKEND_URL should be set to your Render backend URL
const getBackendUrl = () => {
  // First check environment variable
  if (process.env.PARCEL_BACKEND_URL) {
    return process.env.PARCEL_BACKEND_URL;
  }
  
  // Auto-detect production URLs
  const hostname = window.location.hostname;
  
  // If we're on a Netlify domain, use the production backend
  if (hostname.includes('netlify.app') || hostname.includes('vocabin')) {
    // Replace with your actual Render backend URL when deployed
    return 'https://vocabin-backend.onrender.com';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  ENDPOINTS: {
    // Auth endpoints
    AUTH: '/api/auth',
    
    // Admin endpoints
    ADMIN_DASHBOARD_STATS: '/api/admin/dashboard/stats',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_DICTIONARIES: '/api/admin/dictionaries',
    
    // User endpoints
    USER_PROFILE: '/api/user/profile',
    DICTIONARIES: '/api/dictionaries',
    USER_PROGRESS: '/api/user/progress',
    WRONG_WORDS: '/api/wrong-words'
  }
};

// Log the configuration for debugging
console.log('🔗 API Configuration:', {
  baseUrl: API_CONFIG.BASE_URL,
  hostname: window.location.hostname,
  envVar: process.env.PARCEL_BACKEND_URL
});

/**
 * Helper function to build full API URLs
 * @param {string} endpoint - The endpoint path
 * @returns {string} - Full API URL
 */
export function buildApiUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

/**
 * Helper function for admin API URLs
 * @param {string} path - The admin path (without /api/admin)
 * @returns {string} - Full admin API URL
 */
export function buildAdminApiUrl(path) {
  return `${API_CONFIG.BASE_URL}/api/admin${path}`;
}

export default API_CONFIG; 