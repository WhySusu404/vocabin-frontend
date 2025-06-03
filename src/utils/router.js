/**
 * Enhanced Router System for VocaBin SPA
 * Handles user routes, admin routes, URL parameters, and route protection
 */
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.history = [];
    this.beforeRouteChange = null;
    this.afterRouteChange = null;
    this.isDefaultedToAuth = false; // Track if user was defaulted to auth vs explicitly navigated
    this.isInitialized = false; // Prevent routing until routes are registered
    
    // Initialize router
    this.init();
  }

  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', (e) => {
      if (this.isInitialized) {
        this.handleRoute();
      }
    });

    // Listen for page load
    window.addEventListener('load', () => {
      if (this.isInitialized) {
        this.handleRoute();
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (this.isInitialized) {
        this.handleRoute();
      }
    });
  }

  /**
   * Start the router (called after routes are registered)
   */
  start() {
    this.isInitialized = true;
    this.handleRoute();
  }

  /**
   * Register a route with the router
   * @param {string} path - Route path (e.g., 'dashboard', 'reading/:id')
   * @param {Object} config - Route configuration
   * @param {Function} config.component - Component to render
   * @param {boolean} config.requiresAuth - Whether route requires authentication
   * @param {boolean} config.requiresAdmin - Whether route requires admin privileges
   * @param {string} config.title - Page title
   * @param {string} config.layout - Layout type ('user' | 'admin' | 'auth')
   */
  register(path, config) {
    const route = {
      path,
      component: config.component,
      requiresAuth: config.requiresAuth || false,
      requiresAdmin: config.requiresAdmin || false,
      title: config.title || 'VocaBin',
      layout: config.layout || 'user',
      params: {},
      query: {}
    };
    
    this.routes.set(path, route);
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {Object} options - Navigation options
   */
  navigate(path, options = {}) {
    // Reset the defaulted flag since this is explicit navigation
    this.isDefaultedToAuth = false;
    
    if (options.replace) {
      window.location.replace(`#${path}`);
    } else {
      window.location.hash = path;
    }
  }

  /**
   * Go back in history
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current
      const previous = this.history[this.history.length - 1];
      this.navigate(previous.path, { replace: true });
    }
  }

  /**
   * Parse route path with parameters
   * @param {string} currentPath - Current URL path
   * @param {string} routePath - Route definition path
   * @returns {Object|null} - Parsed route with params or null if no match
   */
  parseRoute(currentPath, routePath) {
    const currentParts = currentPath.split('/').filter(part => part);
    const routeParts = routePath.split('/').filter(part => part);


    if (currentParts.length !== routeParts.length) {
      
      return null;
    }

    const params = {};
    
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const currentPart = currentParts[i];
      
      
      
      if (routePart.startsWith(':')) {
        // Parameter
        const paramName = routePart.slice(1);
        params[paramName] = currentPart;
        
      } else if (routePart !== currentPart) {
        // Static part doesn't match
        
        return null;
      }
    }

    
    return { params };
  }

  /**
   * Parse query string from URL
   * @param {string} search - URL search string
   * @returns {Object} - Parsed query parameters
   */
  parseQuery(search) {
    const query = {};
    const urlParams = new URLSearchParams(search);
    
    for (const [key, value] of urlParams) {
      query[key] = value;
    }
    
    return query;
  }

  /**
   * Find matching route for current path
   * @param {string} path - Current path (may include query string)
   * @returns {Object|null} - Matched route or null
   */
  findRoute(path) {
    // Split path and query string
    const [pathname, queryString] = path.split('?');
    
    
    
    for (const [routePath, route] of this.routes) {
      
      const match = this.parseRoute(pathname, routePath);
      
      
      if (match) {
        
        
        // Parse query parameters from the provided query string
        const query = queryString ? this.parseQuery('?' + queryString) : {};
        
        return {
          ...route,
          params: match.params,
          query: query
        };
      }
    }
    
    
    return null;
  }

  /**
   * Check if user has required permissions for route (development-friendly)
   * @param {Object} route - Route configuration
   * @returns {boolean} - Whether user can access route
   */
  async checkPermissions(route) {
    // Import apiService dynamically to avoid circular dependencies
    const { default: apiService } = await import('../services/api.js');
    
    if (route.requiresAuth) {
      // Use async auth check for better development experience
      const isAuthenticated = await apiService.isAuthenticatedAsync();
      if (!isAuthenticated) {
        return false;
      }
    }
    
    if (route.requiresAdmin) {
      // Import adminAuthService for admin permission checks
      const { default: adminAuthService } = await import('../services/adminAuth.js');
      if (!adminAuthService.isAuthenticated()) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Handle route change
   */
  async handleRoute() {
    const hash = window.location.hash.slice(1);
    const [path, queryString] = hash.split('?');
    
    // Check if this is an empty hash (page load/refresh with no route)
    const isEmptyRoute = !hash;
    
    // Determine the appropriate default route based on authentication
    let finalPath = path;
    if (isEmptyRoute) {
      finalPath = await this.getDefaultRoute();
    }
    
    
    
    // Store whether this was an explicit auth navigation or default
    this.isDefaultedToAuth = isEmptyRoute && finalPath === 'auth';
    
    // Reconstruct the full path with query string for findRoute
    const fullFinalPath = queryString && !isEmptyRoute ? `${finalPath}?${queryString}` : finalPath;
    
    // Find matching route
    const route = this.findRoute(fullFinalPath);
    

    
    if (!route) {
      // Route not found, redirect to default
      
      this.navigate('auth', { replace: true });
      return;
    }

    // Check permissions
    
    const hasPermission = await this.checkPermissions(route);
    
    
    if (!hasPermission) {
      
      if (route.requiresAdmin) {
        
        this.navigate('admin', { replace: true });
      } else {
        
        this.navigate('auth', { replace: true });
      }
      return;
    }

    

    // Call before route change hook
    if (this.beforeRouteChange) {
      
      const canProceed = await this.beforeRouteChange(route, this.currentRoute);
      
      if (!canProceed) return;
    }

    // Update history
    this.history.push({
      path: finalPath,
      route,
      timestamp: Date.now()
    });

    // Keep history manageable
    if (this.history.length > 50) {
      this.history = this.history.slice(-25);
    }

    // Set current route
    this.currentRoute = route;

    // Update page title
    document.title = route.title;

    

    // Call after route change hook
    if (this.afterRouteChange) {
      await this.afterRouteChange(route);
    }

    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('routeChanged', {
      detail: { route, path: finalPath }
    }));
    
    
  }

  /**
   * Determine the appropriate default route based on authentication state
   * @returns {string} - Default route path
   */
  async getDefaultRoute() {
    try {
      // Import apiService dynamically to avoid circular dependencies
      const { default: apiService } = await import('../services/api.js');
      const { default: adminAuthService } = await import('../services/adminAuth.js');
      
      // Check if user is authenticated
      const isAuthenticated = await apiService.isAuthenticatedAsync();
      
      if (isAuthenticated) {
        const user = apiService.getCurrentUser();
        
        // If user is admin and admin session exists, go to admin dashboard
        if (user && user.role === 'admin' && adminAuthService.isAuthenticated()) {
          
          return 'admin/dashboard';
        }
        
        // Regular authenticated user goes to dashboard
        
        return 'dashboard';
      }
      
      // Not authenticated, go to auth

      return 'auth';
      
    } catch (error) {
      
      return 'auth';
    }
  }

  /**
   * Get current route
   * @returns {Object|null} - Current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get route history
   * @returns {Array} - Route history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Set before route change hook
   * @param {Function} callback - Callback function
   */
  beforeEach(callback) {
    this.beforeRouteChange = callback;
  }

  /**
   * Set after route change hook
   * @param {Function} callback - Callback function
   */
  afterEach(callback) {
    this.afterRouteChange = callback;
  }

  /**
   * Generate breadcrumb trail
   * @returns {Array} - Breadcrumb items
   */
  getBreadcrumbs() {
    if (!this.currentRoute) return [];

    const path = this.currentRoute.path;
    const parts = path.split('/').filter(part => part && !part.startsWith(':'));
    const breadcrumbs = [];

    let currentPath = '';
    for (const part of parts) {
      currentPath += (currentPath ? '/' : '') + part;
      const route = this.findRoute(currentPath);
      
      if (route) {
        breadcrumbs.push({
          title: route.title,
          path: currentPath,
          active: currentPath === path
        });
      }
    }

    return breadcrumbs;
  }
}

// Create singleton instance
const router = new Router();

export default router; 