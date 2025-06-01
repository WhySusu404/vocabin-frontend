import router from './utils/router.js';
import { showToast } from './utils/toast.js';
import dashLogo from 'url:./assets/dashboard-logo.svg';

class VocaBinApp {
  constructor() {
    this.currentPage = null;
    this.currentLayout = null;
    this.init();
  }

  async init() {
    console.log('🚀 VocaBinApp init starting...');
    
    // Show loading
    this.showLoading();
    
    // Wait for Shoelace to load
    console.log('🚀 Waiting for Shoelace...');
    await this.waitForShoelace();
    console.log('✅ Shoelace ready');
    
    // Restore authentication state before router starts
    console.log('🚀 Restoring authentication state...');
    await this.restoreAuthenticationState();
    console.log('✅ Authentication state restored');
    
    // Initialize router with all routes
    console.log('🚀 Initializing routes...');
    await this.initRoutes();
    console.log('✅ Routes initialized');
    
    // Set up router hooks
    console.log('🚀 Setting up router hooks...');
    this.setupRouterHooks();
    console.log('✅ Router hooks set up');
    
    // Hide loading and show content
    this.hideLoading();
    
    // Start router
    console.log('🚀 Starting router...');
    router.start();
    console.log('✅ Router started');
  }

  async waitForShoelace() {
    // Wait for Shoelace components to be defined
    return new Promise((resolve) => {
      if (customElements.get('sl-button')) {
        resolve();
      } else {
        // Wait a bit for Shoelace to load
        setTimeout(resolve, 500);
      }
    });
  }

  async initRoutes() {
    console.log('📦 Importing routes...');
    
    try {
      // Import routes dynamically with error handling
      const routesModule = await import('./utils/routes.js');
      const testRoutes = routesModule.testRoutes;
      
      console.log('✅ Routes imported successfully:', testRoutes?.length);
      console.log('📦 Routes array:', testRoutes);
      
      if (!testRoutes || testRoutes.length === 0) {
        console.error('❌ No routes found in testRoutes');
        return;
      }
      
      // Register all routes with the router
      console.log('Registering routes:', testRoutes.length);
      
      testRoutes.forEach(route => {
        console.log('Registering route:', route.path, route.component);
        router.register(route.path, route);
      });
      
      // Debug: Check what routes are actually registered
      console.log('Routes registered in router:', router.routes.size);
      for (let [path, route] of router.routes) {
        console.log(`  - ${path}: ${route.component.name || route.component}`);
      }
      
      // Manual test: Try to find the listening route
      console.log('🧪 Manual test: Finding listening route...');
      const testRoute = router.findRoute('listening');
      console.log('🧪 Test result:', testRoute);
      
    } catch (error) {
      console.error('❌ Failed to import or register routes:', error);
    }
  }

  setupRouterHooks() {
    // Before route change - cleanup and validation
    router.beforeEach(async (toRoute, fromRoute) => {
      // Cleanup current page if it has cleanup method
      if (this.currentPage && this.currentPage.cleanup) {
        this.currentPage.cleanup();
      }
      
      // Check if user is authenticated before navigating to login page
      const { default: apiService } = await import('./services/api.js');
      const { default: adminAuthService } = await import('./services/adminAuth.js');
      const isUserAuthenticated = await apiService.isAuthenticatedAsync();
      
      // Only redirect authenticated users away from auth if they explicitly navigated there
      // Don't redirect if they were defaulted to auth by the router due to empty hash
      if (toRoute.path === 'auth' && isUserAuthenticated && !router.isDefaultedToAuth) {
        console.log('🔄 Authenticated user explicitly navigating to auth, redirecting to appropriate dashboard');
        const user = apiService.getCurrentUser();
        if (user && user.role === 'admin') {
          router.navigate('admin/dashboard', { replace: true });
          return false;
        } else {
          router.navigate('dashboard', { replace: true });
          return false;
        }
      }
      
      // Check admin route protection
      if (toRoute.requiresAdmin) {
        if (!adminAuthService.isAuthenticated()) {
          console.log('Admin authentication required, redirecting to admin login');
          router.navigate('admin', { replace: true });
          return false;
        }
      }
      
      return true; // Allow navigation
    });

    // After route change - render new page
    router.afterEach(async (route) => {
      await this.renderRoute(route);
    });
  }

  async renderRoute(route) {
    try {
      console.log('Rendering route:', route);
      
      // Handle different layout types
      switch (route.layout) {
        case 'auth':
          await this.renderAuthLayout(route);
          break;
        case 'user':
          await this.renderUserLayout(route);
          break;
        case 'admin':
          await this.renderAdminLayout(route);
          break;
        default:
          await this.renderUserLayout(route);
      }
    } catch (error) {
      console.error('Failed to render route:', error);
      showToast('Failed to load page', 'danger');
    }
  }

  async renderAuthLayout(route) {
    // For auth pages, render full-screen without navbar/footer
    const contentDiv = document.getElementById('content');
    const appDiv = document.getElementById('app');
    
    // Hide the normal content structure
    contentDiv.style.display = 'none';
    
    // Hide admin container if it exists
    const adminContainer = document.getElementById('admin-container');
    if (adminContainer) {
      adminContainer.style.display = 'none';
    }
    
    // Create or get auth container
    let authContainer = document.getElementById('auth-container');
    if (!authContainer) {
      authContainer = document.createElement('div');
      authContainer.id = 'auth-container';
      authContainer.className = 'auth-container';
      appDiv.appendChild(authContainer);
    }
    
    authContainer.style.display = 'block';
    
    // Handle AuthPage specially - it needs the container passed to constructor
    if (route.component.name === 'AuthPage') {
      const component = new route.component(authContainer);
      component.render();
      this.currentPage = component;
    } else {
      // Load and render other auth components normally
      const component = await this.loadComponent(route.component, route);
      if (component) {
        authContainer.innerHTML = component.render();
        if (component.mount) {
          component.mount();
        }
        this.currentPage = component;
      }
    }
    
    this.currentLayout = 'auth';
  }

  async renderUserLayout(route) {
    // For user pages, use normal layout with navbar/footer
    const contentDiv = document.getElementById('content');
    const authContainer = document.getElementById('auth-container');
    const adminContainer = document.getElementById('admin-container');
    
    // Hide auth and admin containers
    if (authContainer) {
      authContainer.style.display = 'none';
    }
    if (adminContainer) {
      adminContainer.style.display = 'none';
    }
    
    // Show normal content structure
    contentDiv.style.display = 'block';
    
    // Load navigation if not already loaded or layout changed
    if (this.currentLayout !== 'user') {
      await this.loadUserNavigation();
    }
    
    // Load and render the page component
    const component = await this.loadComponent(route.component, route);
    if (component) {
      await this.loadPage(component);
    }
    
    this.currentLayout = 'user';
  }

  async renderAdminLayout(route) {
    // For admin pages, use admin layout with sidebar
    const contentDiv = document.getElementById('content');
    const authContainer = document.getElementById('auth-container');
    const appDiv = document.getElementById('app');
    
    // Hide auth container and normal content
    if (authContainer) {
      authContainer.style.display = 'none';
    }
    contentDiv.style.display = 'none';
    
    // Create or get admin container
    let adminContainer = document.getElementById('admin-container');
    if (!adminContainer) {
      adminContainer = document.createElement('div');
      adminContainer.id = 'admin-container';
      adminContainer.className = 'admin-container';
      appDiv.appendChild(adminContainer);
    }
    
    adminContainer.style.display = 'block';
    
    // Load admin layout if not already loaded or layout changed
    if (this.currentLayout !== 'admin') {
      await this.loadAdminLayout(adminContainer);
    }
    
    // Load and render the page component in admin main content
    const component = await this.loadComponent(route.component, route);
    if (component) {
      const adminMainContent = adminContainer.querySelector('.admin-main-content');
      if (adminMainContent) {
        const html = component.render ? component.render() : '';
        adminMainContent.innerHTML = html;
        if (component.mount) {
          component.mount();
        }
        this.currentPage = component;
      }
    }
    
    this.currentLayout = 'admin';
  }

  async loadComponent(ComponentClass, route = null) {
    try {
      console.log('Loading component:', ComponentClass);
      console.log('Component type:', typeof ComponentClass);
      console.log('Component name:', ComponentClass?.name);
      console.log('Component toString:', ComponentClass.toString().substring(0, 100));
      
      // Handle dynamic imports - improved detection
      if (typeof ComponentClass === 'function') {
        const funcString = ComponentClass.toString();
        // Only treat as dynamic import if it's actually an arrow function that returns import()
        // and doesn't have a class name
        if (!ComponentClass.name && (funcString.includes('import(') || funcString.includes('require('))) {
          try {
            console.log('Detected dynamic import, calling function...');
            const module = await ComponentClass();
            ComponentClass = module.default || module;
            console.log('Dynamic import resolved to:', ComponentClass);
          } catch (importError) {
            console.error('Dynamic import failed:', importError);
            throw importError;
          }
        }
      }
      
      // Validate component before instantiation
      if (typeof ComponentClass !== 'function') {
        throw new Error(`Component is not a function/constructor. Type: ${typeof ComponentClass}, Value: ${ComponentClass}`);
      }
      
      // Pass route parameters to constructor if they exist
      if (route && route.params) {
        // For pages that expect specific parameters
        if (ComponentClass.name === 'ReadingDetailPage' && route.params.id) {
          return new ComponentClass(route.params.id);
        }
        // Add other parameterized components as needed
      }
      
      console.log('Creating new instance of:', ComponentClass.name);
      return new ComponentClass();
      
    } catch (error) {
      console.error('Failed to load component:', error);
      return null;
    }
  }

  async loadUserNavigation() {
    // Load user profile for navigation
    try {
      const { default: apiService } = await import('./services/api.js');
      const profileResponse = await apiService.getProfile();
      this.user = profileResponse.user;
    } catch (error) {
      console.error('Failed to load user profile for navigation:', error);
      // Fallback to a default if profile loading fails
      this.user = { firstName: 'User' };
    }

    // Load user navigation component (we'll create this in Step 2)
    const navbar = document.getElementById('navbar');
    if (navbar) {
      // For now, just add a simple placeholder
      navbar.innerHTML = `
        <nav class="user-nav">
          <div class="nav-container">
            <div class="nav-brand">
              <a href="#dashboard" class="logo-link">
                <img src="${dashLogo}" alt="VocaBin Logo" class="logo">
              </a>
            </div>
            <div class="nav-links">
              <a href="#vocabulary">VOCABULARY</a>
              <a href="#listening">LISTENING</a>
              <a href="#reading">READING</a>
            </div>
            <div class="nav-user">
              <sl-dropdown>
                <sl-button slot="trigger">Hi, ${this.user.firstName}</sl-button>
                <sl-menu>
                  <sl-menu-item href="#profile">My Profile</sl-menu-item>
                  <sl-menu-item href="#profile/password">Change Password</sl-menu-item>
                  <sl-divider></sl-divider>
                  <sl-menu-item id="logout-btn">Logout</sl-menu-item>
                </sl-menu>
              </sl-dropdown>
            </div>
          </div>
        </nav>
      `;

      // Add logout functionality
      const logoutBtn = navbar.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.logout();
        });
      }

      // Add navigation functionality for profile and password change
      const profileBtn = navbar.querySelector('sl-menu-item[href="#profile"]');
      if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate('profile');
        });
      }

      const passwordBtn = navbar.querySelector('sl-menu-item[href="#profile/password"]');
      if (passwordBtn) {
        passwordBtn.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate('profile/password');
        });
      }

      // Add debugging to navigation links
      const navLinks = navbar.querySelectorAll('.nav-links a');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
        });
      });
    }
  }

  async loadAdminLayout(container) {
    // Load admin layout with enhanced navigation
    container.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-brand">
            <img src="${dashLogo}" alt="VocaBin Admin" class="logo">
            <h2>VocaBin Admin</h2>
          </div>
          <nav class="admin-nav">
            <a href="#admin/dashboard" class="nav-link" data-page="dashboard">
              <sl-icon name="speedometer2"></sl-icon>
              <span>Dashboard</span>
            </a>
            <a href="#admin/users" class="nav-link" data-page="users">
              <sl-icon name="people"></sl-icon>
              <span>User Management</span>
            </a>
            <a href="#admin/content" class="nav-link" data-page="content">
              <sl-icon name="folder"></sl-icon>
              <span>Content Management</span>
            </a>
            <a href="#admin/reports" class="nav-link" data-page="reports">
              <sl-icon name="exclamation-triangle"></sl-icon>
              <span>Error Reports</span>
            </a>
            <div class="nav-divider"></div>
            <button id="admin-logout-btn" class="logout-btn">
              <sl-icon name="box-arrow-right"></sl-icon>
              <span>Logout</span>
            </button>
          </nav>
        </aside>
        <main class="admin-main-content">
          <!-- Page content will be loaded here -->
        </main>
      </div>
    `;

    // Add admin logout functionality
    const logoutBtn = container.querySelector('#admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const { default: adminAuthService } = await import('./services/adminAuth.js');
        adminAuthService.logout();
      });
    }

    // Add navigation link highlighting
    this.updateAdminNavigation();
  }

  updateAdminNavigation() {
    // Update admin navigation to highlight current page
    const currentHash = window.location.hash.substring(1); // Remove #
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1); // Remove #
      if (currentHash === href || currentHash.startsWith(href + '/')) {
        link.classList.add('active');
      }
    });
  }

  async loadPage(page) {
    const mainContent = document.getElementById('main-content');
    
    try {
      // Render the page
      let html;
      if (page.render && page.render.constructor.name === 'AsyncFunction') {
        html = await page.render();
      } else if (page.render) {
        html = page.render();
      } else {
        html = '';
      }
      
      mainContent.innerHTML = html;
      
      // Mount the page (bind events, etc.)
      if (page.mount) {
        page.mount();
      }
      
      this.currentPage = page;
      
    } catch (error) {
      console.error('Failed to load page:', error);
      showToast('Failed to load page', 'danger');
    }
  }

  logout() {
    // Import apiService dynamically to avoid circular dependencies
    import('./services/api.js').then(({ default: apiService }) => {
      apiService.logout();
      router.navigate('auth', { replace: true });
      showToast('Logged out successfully', 'success');
    });
  }

  showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    const authContainer = document.getElementById('auth-container');
    const adminContainer = document.getElementById('admin-container');
    if (authContainer) {
      authContainer.style.display = 'none';
    }
    if (adminContainer) {
      adminContainer.style.display = 'none';
    }
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  async restoreAuthenticationState() {
    console.log('🔄 Restoring authentication state...');
    
    try {
      // Import services
      const { default: apiService } = await import('./services/api.js');
      const { default: adminAuthService } = await import('./services/adminAuth.js');
      
      // Check if regular user is authenticated
      const isUserAuthenticated = await apiService.isAuthenticatedAsync();
      
      if (isUserAuthenticated) {
        const user = apiService.getCurrentUser();
        console.log('✅ Regular user authentication restored:', user?.email, 'Role:', user?.role);
        
        // If user is admin, also set up admin session
        if (user && user.role === 'admin') {
          // Check if admin session already exists
          if (!adminAuthService.isAuthenticated()) {
            console.log('🔄 Setting up admin session for admin user...');
            adminAuthService.adminUser = user;
            adminAuthService.isAdminAuthenticated = true;
            
            // Store admin session
            localStorage.setItem('vocabin_admin_session', JSON.stringify({
              user: user,
              timestamp: Date.now()
            }));
            
            console.log('✅ Admin session restored from user token');
          } else {
            console.log('✅ Admin session already exists');
          }
        }
      } else {
        console.log('ℹ️ No user authentication found');
      }
      
    } catch (error) {
      console.error('❌ Error restoring authentication state:', error);
    }
    
    console.log('🏁 Authentication restoration complete');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VocaBinApp();
});

// Also export for debugging
window.VocaBinApp = VocaBinApp;
window.router = router; 