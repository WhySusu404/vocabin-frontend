/**
 * Routes Configuration for VocaBin SPA
 * Defines all user and admin routes with their components and settings
 */

// Import page components
import { AuthPage } from '../pages/AuthPage.js';
import { DashboardPage } from '../pages/dashboard.js';
import DictionarySelectionPage from '../pages/DictionarySelectionPage.js';
import VocabularyPage from '../pages/VocabularyPage.js';
import ReadingPage from '../pages/ReadingPage.js';
import ReadingDetailPage from '../pages/ReadingDetailPage.js';
import ListeningPage from '../pages/ListeningPage.js';
import UserProfilePage from '../pages/UserProfile.js';
import PasswordChangePage from '../pages/PasswordChange.js';

// Import admin components statically for testRoutes
import AdminDashboard from '../pages/admin/AdminDashboard.js';
import UserManagement from '../pages/admin/UserManagement.js';
import ContentManagement from '../pages/admin/ContentManagement.js';

// Dynamic imports for pages not yet created
const DashboardHistoryPage = () => import('../pages/DashboardHistory.js');
const InfoSavedPage = () => import('../pages/InfoSaved.js');
const AdminLoginPage = () => import('../pages/admin/AdminLogin.js');

/**
 * User Routes Configuration
 */
export const userRoutes = [
  {
    path: 'auth',
    component: AuthPage,
    title: 'VocaBin - Login',
    layout: 'auth',
    requiresAuth: false
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    title: 'Dashboard - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'dashboard/history',
    component: DashboardHistoryPage,
    title: 'Learning History - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'dictionaries',
    component: DictionarySelectionPage,
    title: 'Select Dictionary - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'vocabulary',
    component: VocabularyPage,
    title: 'Vocabulary Practice - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'listening',
    component: ListeningPage,
    title: 'Listening Practice - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'listening/:id',
    component: ReadingDetailPage, // Reuse reading detail for now, can be customized later
    title: 'Listening Exercise - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'reading',
    component: ReadingPage,
    title: 'Reading Materials - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'reading/:id',
    component: ReadingDetailPage,
    title: 'Reading Exercise - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'profile',
    component: UserProfilePage,
    title: 'Profile - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'profile/password',
    component: PasswordChangePage,
    title: 'Change Password - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'profile/saved',
    component: InfoSavedPage,
    title: 'Profile Updated - VocaBin',
    layout: 'user',
    requiresAuth: true
  }
];

/**
 * Admin Routes Configuration
 */
export const adminRoutes = [
  {
    path: 'admin',
    component: AdminLoginPage,
    title: 'Admin Login - VocaBin',
    layout: 'auth',
    requiresAuth: false
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboard,
    title: 'Admin Dashboard - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    path: 'admin/users',
    component: UserManagement,
    title: 'User Management - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    path: 'admin/content',
    component: ContentManagement,
    title: 'Content Management - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  },
];

/**
 * All routes combined
 */
export const allRoutes = [...userRoutes, ...adminRoutes];

// Temporary test routes with only static imports
export const testRoutes = [
  {
    path: 'auth',
    component: AuthPage,
    title: 'VocaBin - Login',
    layout: 'auth',
    requiresAuth: false
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    title: 'Dashboard - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'dictionaries',
    component: DictionarySelectionPage,
    title: 'Select Dictionary - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'vocabulary',
    component: VocabularyPage,
    title: 'Vocabulary Practice - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'listening',
    component: ListeningPage,
    title: 'Listening Practice - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'reading',
    component: ReadingPage,
    title: 'Reading Materials - VocaBin',
    layout: 'user',
    requiresAuth: false
  },
  {
    path: 'profile',
    component: UserProfilePage,
    title: 'Profile - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'profile/password',
    component: PasswordChangePage,
    title: 'Change Password - VocaBin',
    layout: 'user',
    requiresAuth: true
  },
  {
    path: 'admin',
    component: AdminLoginPage,
    title: 'Admin Login - VocaBin',
    layout: 'auth',
    requiresAuth: false
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboard,
    title: 'Admin Dashboard - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    path: 'admin/users',
    component: UserManagement,
    title: 'User Management - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    path: 'admin/content',
    component: ContentManagement,
    title: 'Content Management - VocaBin',
    layout: 'admin',
    requiresAuth: true,
    requiresAdmin: true
  }
];

/**
 * Route utilities
 */
export const routeUtils = {
  /**
   * Get route by path
   * @param {string} path - Route path
   * @returns {Object|null} - Route configuration
   */
  getRoute(path) {
    return allRoutes.find(route => route.path === path) || null;
  },

  /**
   * Get routes by layout type
   * @param {string} layout - Layout type ('user', 'admin', 'auth')
   * @returns {Array} - Routes for that layout
   */
  getRoutesByLayout(layout) {
    return allRoutes.filter(route => route.layout === layout);
  },

  /**
   * Get user navigation routes (excluding auth)
   * @returns {Array} - User navigation routes
   */
  getUserNavRoutes() {
    return userRoutes.filter(route => 
      route.layout === 'user' && 
      !route.path.includes(':') && 
      !route.path.includes('/password') &&
      !route.path.includes('/saved')
    );
  },

  /**
   * Get admin navigation routes (excluding auth)
   * @returns {Array} - Admin navigation routes
   */
  getAdminNavRoutes() {
    return adminRoutes.filter(route => 
      route.layout === 'admin' && 
      !route.path.includes(':')
    );
  },

  /**
   * Generate route breadcrumbs
   * @param {string} currentPath - Current route path
   * @returns {Array} - Breadcrumb items
   */
  generateBreadcrumbs(currentPath) {
    const pathParts = currentPath.split('/').filter(part => part);
    const breadcrumbs = [];
    
    let buildPath = '';
    for (const part of pathParts) {
      buildPath += (buildPath ? '/' : '') + part;
      const route = this.getRoute(buildPath);
      
      if (route) {
        breadcrumbs.push({
          title: route.title.split(' - ')[0], // Remove "- VocaBin" suffix
          path: buildPath,
          active: buildPath === currentPath
        });
      }
    }
    
    return breadcrumbs;
  }
}; 