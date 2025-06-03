/**
 * Admin Authentication Service
 * Handles admin-specific authentication and authorization
 */

import apiService from './api.js';
import router from '../utils/router.js';
import { showToast } from '../utils/toast.js';

class AdminAuthService {
    constructor() {
        this.adminUser = null;
        this.isAdminAuthenticated = false;
        this.baseURL = 'http://localhost:3000/api/admin';
    }

    /**
     * Get auth headers for API calls
     */
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        console.log('🔑 AdminAuth.getAuthHeaders() - token exists:', !!token, 'length:', token?.length);
        if (token) {
            console.log('🔑 Token preview:', token.substring(0, 50) + '...');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Admin login
     * @param {Object} credentials - Login credentials
     * @returns {Promise<Object>} Login result
     */
    async login(credentials) {
        try {
            // Use the existing API service but ensure admin role
            const response = await apiService.login(credentials);
            
            if (response.success && response.user) {
                // Verify admin role
                if (response.user.role !== 'admin') {
                    throw new Error('Access denied. Admin privileges required.');
                }
                
                this.adminUser = response.user;
                this.isAdminAuthenticated = true;
                
                // Store admin session
                localStorage.setItem('vocabin_admin_session', JSON.stringify({
                    user: response.user,
                    timestamp: Date.now()
                }));
                
                return {
                    success: true,
                    user: response.user,
                    message: 'Admin login successful'
                };
            } else {
                throw new Error(response.message || 'Invalid admin credentials');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                message: error.message || 'Admin login failed'
            };
        }
    }

    /**
     * Check if current user is authenticated admin
     * @returns {boolean} Whether user is authenticated admin
     */
    isAuthenticated() {
        console.log('🔐 AdminAuth.isAuthenticated() called');
        console.log('🔐 Memory state - isAdminAuthenticated:', this.isAdminAuthenticated, 'adminUser:', this.adminUser?.email);
        
        // Check memory state first
        if (this.isAdminAuthenticated && this.adminUser) {
            console.log('🔐 Admin authenticated via memory state');
            return true;
        }
        
        // Check session storage
        try {
            const session = localStorage.getItem('vocabin_admin_session');
            console.log('🔐 Checking localStorage session:', session ? 'found' : 'not found');
            
            if (session) {
                const sessionData = JSON.parse(session);
                const sessionAge = Date.now() - sessionData.timestamp;
                const maxAge = 8 * 60 * 60 * 1000; // 8 hours
                
                console.log('🔐 Session data:', { 
                    userEmail: sessionData.user?.email,
                    userRole: sessionData.user?.role,
                    sessionAge: `${Math.round(sessionAge / 1000)} seconds`,
                    maxAge: `${Math.round(maxAge / 1000)} seconds`,
                    isValid: sessionAge < maxAge
                });
                
                if (sessionAge < maxAge && sessionData.user && sessionData.user.role === 'admin') {
                    this.adminUser = sessionData.user;
                    this.isAdminAuthenticated = true;
                    console.log('✅ Admin authenticated via localStorage session');
                    return true;
                } else {
                    console.log('❌ Session expired or invalid role');
                    // Clean up expired session
                    localStorage.removeItem('vocabin_admin_session');
                }
            }
        } catch (error) {
            console.error('🔐 Error checking admin session:', error);
            // Clean up corrupted session
            localStorage.removeItem('vocabin_admin_session');
        }
        
        console.log('❌ Admin not authenticated');
        return false;
    }

    /**
     * Get current admin user
     * @returns {Object|null} Admin user object
     */
    getCurrentAdmin() {
        if (this.isAuthenticated()) {
            return this.adminUser;
        }
        return null;
    }

    /**
     * Admin logout
     */
    logout() {
        this.adminUser = null;
        this.isAdminAuthenticated = false;
        localStorage.removeItem('vocabin_admin_session');
        
        // Also logout from regular API service
        apiService.logout();
        
        // Navigate to admin login
        router.navigate('admin');
        showToast('Admin logged out successfully', 'success');
    }

    /**
     * Require admin authentication for routes
     * @returns {boolean} Whether access is granted
     */
    requireAdmin() {
        console.log('🚪 AdminAuth.requireAdmin() called');
        const isAuth = this.isAuthenticated();
        console.log('🚪 requireAdmin result:', isAuth);
        
        if (!isAuth) {
            console.log('🚨 Admin authentication required, redirecting to admin login');
            showToast('Admin authentication required', 'warning');
            router.navigate('admin');
            return false;
        }
        console.log('✅ Admin access granted');
        return true;
    }

    /**
     * Validate admin permissions for specific actions
     * @param {string} action - Action to validate
     * @returns {boolean} Whether action is permitted
     */
    canPerformAction(action) {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        // Define admin permissions
        const adminPermissions = [
            'manage_users',
            'manage_content',
            'view_reports',
            'manage_reports',
            'view_analytics',
            'system_admin'
        ];
        
        return adminPermissions.includes(action);
    }

    /**
     * Get admin dashboard stats with real API call
     * @returns {Promise<Object>} Dashboard statistics
     */
    async getDashboardStats() {
        try {
            console.log('🔄 Fetching dashboard stats from API...');
            
            const response = await fetch(`${this.baseURL}/dashboard/stats`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Dashboard stats API response:', result);
            
            if (result.success) {
                const stats = result.data;
                return {
                    totalUsers: stats.totalUsers || 0,
                    activeUsers: stats.activeUsers || 0,
                    totalWordLists: stats.totalDictionaries || 0,
                    totalListeningMaterials: 0,
                    totalReadingMaterials: 0,
                    pendingReports: 0,
                    resolvedReports: 0,
                    systemUptime: '99.9%',
                    storageUsed: '2.4 GB',
                    storageLimit: '10 GB'
                };
            } else {
                throw new Error(result.message || 'Failed to fetch dashboard stats');
            }
        } catch (error) {
            console.error('❌ Error fetching dashboard stats from API:', error);
            // Fallback to mock data if API fails
            return {
                totalUsers: 1247,
                activeUsers: 892,
                totalWordLists: 156,
                totalListeningMaterials: 43,
                totalReadingMaterials: 78,
                pendingReports: 12,
                resolvedReports: 234,
                systemUptime: '99.9%',
                storageUsed: '2.4 GB',
                storageLimit: '10 GB'
            };
        }
    }

    /**
     * Get user management data with real API call
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} User list
     */
    async getUsers(filters = {}) {
        try {
            console.log('🔄 Fetching users from API with filters:', filters);
            
            const queryParams = new URLSearchParams();
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.role) queryParams.append('role', filters.role);
            if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive);

            const response = await fetch(`${this.baseURL}/users?${queryParams}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Users API response:', result);
            
            if (result.success) {
                return {
                    users: result.data.users,
                    pagination: result.data.pagination
                };
            } else {
                throw new Error(result.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('❌ Error fetching users from API:', error);
            // Fallback to mock data
            return this.getMockUsers(filters);
        }
    }

    /**
     * Toggle user status with real API call
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async toggleUserStatus(userId) {
        try {
            console.log('🔄 Toggling user status for user:', userId);
            
            const response = await fetch(`${this.baseURL}/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Toggle status API response:', result);
            
            if (result.success) {
                showToast(result.message || 'User status updated successfully', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Failed to toggle user status');
            }
        } catch (error) {
            console.error('❌ Error toggling user status:', error);
            showToast('Failed to update user status', 'danger');
            return false;
        }
    }

    /**
     * Mock users data (fallback)
     */
    getMockUsers(filters = {}) {
        const mockUsers = [
            {
                _id: '1',
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'learner',
                registrationDate: new Date('2024-01-15'),
                lastLogin: new Date('2024-01-20'),
                isActive: true,
                statistics: {
                    wordsLearned: 145,
                    hoursStudied: 23,
                    streakDays: 7
                }
            },
            {
                _id: '2',
                email: 'jane.smith@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                role: 'learner',
                registrationDate: new Date('2024-01-10'),
                lastLogin: new Date('2024-01-21'),
                isActive: true,
                statistics: {
                    wordsLearned: 267,
                    hoursStudied: 41,
                    streakDays: 12
                }
            },
            {
                _id: '3',
                email: 'admin@vocabin.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                registrationDate: new Date('2023-12-01'),
                lastLogin: new Date('2024-01-21'),
                isActive: true,
                statistics: {
                    wordsLearned: 0,
                    hoursStudied: 0,
                    streakDays: 0
                }
            }
        ];
        
        // Apply filters
        let filteredUsers = mockUsers;
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.email.toLowerCase().includes(searchTerm) ||
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.role) {
            filteredUsers = filteredUsers.filter(user => user.role === filters.role);
        }
        
        if (filters.status === 'active') {
            filteredUsers = filteredUsers.filter(user => user.isActive);
        } else if (filters.status === 'inactive') {
            filteredUsers = filteredUsers.filter(user => !user.isActive);
        }
        
        return {
            users: filteredUsers,
            pagination: {
                currentPage: filters.page || 1,
                totalPages: 1,
                totalUsers: filteredUsers.length,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }

    /**
     * Get error reports
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Error reports
     */
    async getErrorReports(filters = {}) {
        try {
            // Mock error reports for now
            const mockReports = [
                {
                    id: '1',
                    userId: '1',
                    userName: 'John Doe',
                    userEmail: 'john.doe@example.com',
                    reportType: 'spell_error',
                    description: 'The word "receive" is misspelled in the vocabulary list.',
                    status: 'pending',
                    dateReported: new Date('2024-01-20'),
                    relatedContent: 'Word List: Common Spelling Mistakes'
                },
                {
                    id: '2',
                    userId: '2',
                    userName: 'Jane Smith',
                    userEmail: 'jane.smith@example.com',
                    reportType: 'content_error',
                    description: 'The audio file for "pronunciation" is not playing correctly.',
                    status: 'resolved',
                    dateReported: new Date('2024-01-18'),
                    dateResolved: new Date('2024-01-19'),
                    adminResponse: 'Audio file has been re-uploaded and tested.',
                    relatedContent: 'Listening Material: English Pronunciation'
                }
            ];
            
            let filteredReports = mockReports;
            
            if (filters.status) {
                filteredReports = filteredReports.filter(report => report.status === filters.status);
            }
            
            if (filters.type) {
                filteredReports = filteredReports.filter(report => report.reportType === filters.type);
            }
            
            return {
                reports: filteredReports,
                total: filteredReports.length
            };
        } catch (error) {
            console.error('Error fetching error reports:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const adminAuthService = new AdminAuthService();
export default adminAuthService; 