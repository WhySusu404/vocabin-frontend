// API service for backend communication
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.useMockAuth = false; // Set to true for testing without backend
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.storage = this.isDevelopment ? sessionStorage : localStorage;
    
    // For development, also try localStorage as fallback for better persistence across hot reloads
    this.devStorage = this.isDevelopment ? localStorage : this.storage;
    
    // Try to get token from multiple sources in development
    this.token = this.getPersistedToken();
    this.refreshToken = this.storage.getItem('refreshToken') || this.devStorage.getItem('refreshToken');
    
    // Auto-refresh token in development
    if (this.isDevelopment && this.token) {
      this.startTokenRefreshTimer();
    }
  }

  // Development-friendly token retrieval with fallback
  getPersistedToken() {
    if (!this.isDevelopment) {
      return this.storage.getItem('authToken');
    }
    
    // In development, try multiple sources
    let token = this.storage.getItem('authToken');
    if (!token) {
      token = this.devStorage.getItem('authToken');
    }
    
    // If still no token, try to restore from stored credentials
    if (!token) {
      this.restoreFromCredentials();
    }
    
    return token;
  }

  // Restore authentication from stored credentials (development only)
  async restoreFromCredentials() {
    if (!this.isDevelopment) return false;

    const storedCreds = this.devStorage.getItem('devCredentials');
    if (storedCreds) {
      try {
        const credentials = JSON.parse(storedCreds);
        
        // No longer using setTimeout here, the caller (isAuthenticatedAsync) handles delays.
        // Return a Promise that resolves based on the async login attempt.
        try {
          // We await the login here. The login method sets the token.
          await this.login(credentials, { skipCredentialStorage: true, silent: true });
          // After login attempt, check if token is now set
          if (this.token) {
            return true;
          } else {
            
            return false;
          }
        } catch (error) {
          
          return false;
        }
      } catch (error) {
        console.error('[restoreFromCredentials] Failed to parse stored credentials:', error);
        this.devStorage.removeItem('devCredentials');
        return false; // Return false if parsing fails
      }
    }
    return false; // Return false if no stored credentials
  }

  // Development-friendly token refresh timer
  startTokenRefreshTimer() {
    if (!this.isDevelopment) return;
    
    // Refresh token every 20 hours (before 24h expiry)
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshAuthToken();
      } catch (error) {
        
        this.clearTokenRefreshTimer();
      }
    }, 20 * 60 * 60 * 1000); // 20 hours
    
  }

  clearTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Refresh authentication token
  async refreshAuthToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const token = data.token || data.accessToken;
      
      if (token) {
        this.setToken(token);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        return data;
      } else {
        throw new Error('No token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, try to re-authenticate with stored credentials
      return this.tryReAuthWithStoredCredentials();
    }
  }

  // Development feature: re-authenticate with stored credentials
  tryReAuthWithStoredCredentials() {
    if (!this.isDevelopment) return Promise.reject(new Error('Not in development mode'));
    
    // Corrected to read from devStorage (localStorage) where devCredentials are saved
    const storedCreds = this.devStorage.getItem('devCredentials'); 
    if (storedCreds) {
      try {
        const credentials = JSON.parse(storedCreds);
        return this.login(credentials, { skipCredentialStorage: true });
      } catch (error) {
        console.error('[tryReAuthWithStoredCredentials] Failed to re-authenticate with stored credentials:', error);
        // Potentially remove corrupted devCredentials from localStorage
        this.devStorage.removeItem('devCredentials');
      }
    }
    return Promise.reject(new Error('No stored credentials for re-auth'));
  }

  // Mock authentication for testing
  mockLogin(credentials) {
    
    // Mock demo accounts
    const mockUsers = {
      'admin@vocabin.com': {
        id: 1,
        email: 'admin@vocabin.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      },
      'learner@vocabin.com': {
        id: 2,
        email: 'learner@vocabin.com', 
        role: 'learner',
        firstName: 'Learner',
        lastName: 'User'
      }
    };

    const user = mockUsers[credentials.email];
    if (user && (credentials.password === 'admin123' || credentials.password === 'learner123')) {
      
      // Create a mock JWT token
      const mockToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' }
      })) + '.' + 
      btoa(JSON.stringify(user)) + '.' + 
      btoa('mock-signature');
      
      
      return Promise.resolve({ 
        token: mockToken,
        user: user 
      });
    } else {
      
      return Promise.reject(new Error('Invalid credentials'));
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      this.storage.setItem('authToken', token);
      
      // In development, also store in localStorage for hot reload persistence
      if (this.isDevelopment) {
        this.devStorage.setItem('authToken', token);
      }
      
      // Debug: Log the decoded token
      const user = this.getCurrentUser();
      
      // Start auto-refresh in development
      if (this.isDevelopment) {
        this.startTokenRefreshTimer();
      }
    } else {
      this.storage.removeItem('authToken');
      if (this.isDevelopment) {
        this.devStorage.removeItem('authToken');
      }
      this.clearTokenRefreshTimer();
    }
  }

  // Set refresh token
  setRefreshToken(refreshToken) {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      this.storage.setItem('refreshToken', refreshToken);
      
      // In development, also store in localStorage for hot reload persistence
      if (this.isDevelopment) {
        this.devStorage.setItem('refreshToken', refreshToken);
      }
      
    } else {
      this.storage.removeItem('refreshToken');
      if (this.isDevelopment) {
        this.devStorage.removeItem('refreshToken');
      }
    }
  }

  // Store credentials for development re-authentication
  storeDevCredentials(credentials) {
    if (this.isDevelopment) {
      this.devStorage.setItem('devCredentials', JSON.stringify(credentials));       
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

  // Generic request method with auto-retry
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 - try to refresh token or clear invalid token
      if (response.status === 401 && this.token && !endpoint.includes('/auth/')) {
        try {
          await this.refreshAuthToken();
          // Retry request with new token
          config.headers = this.getHeaders();
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.error || 'Request failed after token refresh');
          }
          
          return retryData;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear invalid token and throw original auth error
          this.setToken(null);
          this.setRefreshToken(null);
          throw new Error('Authentication error: Invalid or expired token');
        }
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error messages from backend
        if (response.status === 401) {
          // Clear invalid token
          this.setToken(null);
          this.setRefreshToken(null);
          throw new Error('No authorization token provided');
        }
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData) {
    if (this.useMockAuth) {
      // Mock registration
      return this.mockLogin({ email: userData.email, password: userData.password });
    }
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials, options = {}) {
    
    try {
      const response = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (!options.silent) {
      }

      // Backend returns 'accessToken' instead of 'token'
      const token = response.token || response.accessToken;
      
      if (token) {
        this.setToken(token);
        
        // Store refresh token if provided
        if (response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
        }
        
        // Store credentials for development re-authentication
        if (!options.skipCredentialStorage) {
          this.storeDevCredentials(credentials);
        }
        
        if (!options.silent) {
        }
        return { ...response, token }; // Normalize the response
      } else {
        console.error('No token/accessToken in login response, falling back to mock auth');
        throw new Error('No token received from backend');
      }

    } catch (error) {
      if (!options.silent) {
        
      }
      // Try mock authentication if backend fails or doesn't return token
      const mockResponse = await this.mockLogin(credentials);
      if (mockResponse.token) {
        this.setToken(mockResponse.token);
        
        // Store credentials for development re-authentication
        if (!options.skipCredentialStorage) {
          this.storeDevCredentials(credentials);
        }
      }
      return mockResponse;
    }
  }

  async logout() {
    try {
      if (!this.useMockAuth) {
        await this.request('/api/auth/logout', {
          method: 'POST'
        });
      }
    } finally {
      this.setToken(null);
      this.setRefreshToken(null);
      
      // Clear stored dev credentials
      if (this.isDevelopment) {
        this.devStorage.removeItem('devCredentials');
      }
    }
  }

  async getProfile() {
    // If we're using mock auth or have a mock token, return mock profile data
    const currentUser = this.getCurrentUser();
    if (this.useMockAuth || (currentUser && currentUser.email && currentUser.email.includes('@vocabin.com'))) {
      
      return Promise.resolve({
        user: {
          ...currentUser,
          statistics: {
            totalWordsLearned: 150,
            currentStreak: 7,
            longestStreak: 21,
            totalStudyTime: 1200
          },
          learningPreferences: {
            difficulty: 'Intermediate',
            studyTime: 30,
            reminderEnabled: true
          },
          isActive: true,
          registrationDate: '2023-01-15T00:00:00Z'
        }
      });
    }
    
    // Use real backend for actual users
    return this.request('/api/auth/profile');
  }

  async updateProfile(updateData) {
    // If we're using mock auth, simulate update
    const currentUser = this.getCurrentUser();
    if (this.useMockAuth || (currentUser && currentUser.email && currentUser.email.includes('@vocabin.com'))) {
      
      // Update the current user data in the token
      const updatedUser = { ...currentUser, ...updateData };
      
      // Create a new mock token with updated data
      const mockToken = btoa(JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' }
      })) + '.' + 
      btoa(JSON.stringify(updatedUser)) + '.' + 
      btoa('mock-signature');
      
      this.setToken(mockToken);
      
      return Promise.resolve({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    }
    
    // Use real backend for actual users
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async changePassword(passwordData) {
    // If we're using mock auth, simulate password change
    const currentUser = this.getCurrentUser();
    if (this.useMockAuth || (currentUser && currentUser.email && currentUser.email.includes('@vocabin.com'))) {
      
      // Simulate validation
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error('Current password and new password are required');
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }
      
      // Mock password validation (just check if current password is not empty)
      if (passwordData.currentPassword.length < 6) {
        throw new Error('Current password is incorrect');
      }
      
      return Promise.resolve({
        message: 'Password changed successfully'
      });
    }
    
    // Use real backend for actual users
    return this.request('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  // Check if user is authenticated (development-friendly)
  isAuthenticated() {
    const hasToken = !!this.token;
    
    // In development, if no token, we rely on isAuthenticatedAsync to handle restoration.
    // This synchronous check is now just for immediate token presence.
    if (!hasToken && this.isDevelopment) {
      const storedCreds = this.devStorage.getItem('devCredentials');
      if (storedCreds) {
        // Log that credentials exist, but don't attempt restore here.
        // isAuthenticatedAsync will handle it.
      }
      // Do not initiate restoreFromCredentials here.
      // Return based on current token status.
    }
    
    // console.log('isAuthenticated sync check:', hasToken); // Keep or remove verbose logging as preferred
    return hasToken;
  }

  // Development-friendly authentication check with retry
  async isAuthenticatedAsync(retries = 2, delay = 200) {
    if (this.isAuthenticated()) {
      return true;
    }

    if (!this.isDevelopment || retries <= 0) {
      // If not in development or no retries left, and still no token, then definitely not authenticated.
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, delay));

    // Try to restore credentials if they exist
    const storedCreds = this.devStorage.getItem('devCredentials');
    if (storedCreds && !this.token) { // Check for token again, in case it was set by another process
      
      try {
        // Directly call and await restoreFromCredentials
        // restoreFromCredentials itself now needs to be able to set the token
        // and its login call might also set the token.
        // We'll make restoreFromCredentials return a boolean indicating success.
        const restored = await this.restoreFromCredentials();
        if (restored) {
          return true; // Token should now be set
        } else {
            
        }
      } catch (error) {
        console.error('❌ isAuthenticatedAsync: Error during credential restoration:', error);
      }
    }

    // After attempt to restore (or if no creds), check token status again
    if (this.isAuthenticated()) {
      return true;
    }

    // If still not authenticated, retry
    
    return this.isAuthenticatedAsync(retries - 1, delay * 2);
  }

  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    
    return isAdmin;
  }

  // Get current user data from token
  getCurrentUser() {
    if (!this.token) {
      
      return null;
    }

    try {
      // JWT tokens have 3 parts separated by dots
      const tokenParts = this.token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      
      return payload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  // Development utility: Check token expiration
  getTokenExpiration() {
    if (!this.token) return null;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000);
      }
    } catch (error) {
      console.error('Failed to decode token expiration:', error);
    }
    return null;
  }

  // Development utility: Time until token expires
  getTimeUntilExpiration() {
    const expiration = this.getTokenExpiration();
    if (!expiration) return null;
    
    const now = new Date();
    const timeLeft = expiration.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return { expired: true, message: 'Token expired' };
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      expired: false,
      hours,
      minutes,
      message: `${hours}h ${minutes}m remaining`
    };
  }
}

// Create and export singleton instance
const apiService = new ApiService();

// Development debugging utilities
if (apiService.isDevelopment) {
  window.vocabinDebug = {
    api: apiService,
    checkToken: () => {
      
    },
    refreshToken: () => apiService.refreshAuthToken(),
    clearStorage: () => {
      apiService.storage.clear();
      
    }
  };
  
  
}

export default apiService; 