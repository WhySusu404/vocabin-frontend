// API service for backend communication
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API request failed:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user data from token
  getCurrentUser() {
    if (!this.token) return null;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService; 