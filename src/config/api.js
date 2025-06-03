/**
 * API Configuration
 * Centralized configuration for backend API calls
 */

// Backend server configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
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