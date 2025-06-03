import router from './utils/router.js';
import { showToast } from './utils/toast.js';
import './styles/main.css';

class VocaBinApp {
  constructor() {
    this.currentPage = null;
    this.currentLayout = null;
    this.init();
  }

  async init() {
    
    // Show loading
    this.showLoading();
    
    // Wait for Shoelace to load
    await this.waitForShoelace();
    
    // Restore authentication state before router starts
    await this.restoreAuthenticationState();
    
    // Initialize router with all routes
    await this.initRoutes();
    
    // Set up router hooks
    this.setupRouterHooks();
    
    // Hide loading and show content
    this.hideLoading();
    
    // Start router
    router.start();
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
    
    try {
      // Import routes dynamically with error handling
      const routesModule = await import('./utils/routes.js');
      const testRoutes = routesModule.testRoutes;
      
      console.log('📝 Registering routes:', testRoutes.map(r => r.path));
      
      if (!testRoutes || testRoutes.length === 0) {
        return;
      }
      
      // Register all routes with the router
      
      testRoutes.forEach(route => {
        console.log('✅ Registering route:', route.path);
        router.register(route.path, route);
      });
      
      console.log('🎯 All routes registered successfully');
      
      
    } catch (error) {
      console.error('❌ Failed to import or register routes:', error);
    }
  }

  setupRouterHooks() {
    // Before route change - cleanup and validation
    router.beforeEach(async (toRoute, fromRoute) => {
      console.log('🔄 Router beforeEach:', { toRoute: toRoute.path, fromRoute: fromRoute?.path });
      
      // Cleanup current page if it has cleanup method
      if (this.currentPage && this.currentPage.cleanup) {
        this.currentPage.cleanup();
      }
      
      // Check if user is authenticated before navigating to login page
      const { default: apiService } = await import('./services/api.js');
      const { default: adminAuthService } = await import('./services/adminAuth.js');
      const isUserAuthenticated = await apiService.isAuthenticatedAsync();
      
      console.log('🔍 Auth status check:', { 
        isUserAuthenticated, 
        toPath: toRoute.path,
        requiresAdmin: toRoute.requiresAdmin 
      });
      
      // Only redirect authenticated users away from auth if they explicitly navigated there
      // Don't redirect if they were defaulted to auth by the router due to empty hash
      if (toRoute.path === 'auth' && isUserAuthenticated && !router.isDefaultedToAuth) {
        console.log('🚀 Redirecting authenticated user from auth page');
        const user = apiService.getCurrentUser();
        if (user && user.role === 'admin') {
          console.log('👑 Admin user, redirecting to admin dashboard');
          router.navigate('admin/dashboard', { replace: true });
          return false;
        } else {
          console.log('👤 Regular user, redirecting to dashboard');
          router.navigate('dashboard', { replace: true });
          return false;
        }
      }
      
      // Check admin route protection
      if (toRoute.requiresAdmin) {
        console.log('🔐 Checking admin authentication for protected route');
        const isAdminAuthenticated = adminAuthService.isAuthenticated();
        console.log('🔐 Admin auth result:', isAdminAuthenticated);
        
        if (!isAdminAuthenticated) {
          console.log('❌ Admin not authenticated, redirecting to admin login');
          router.navigate('admin', { replace: true });
          return false;
        } else {
          console.log('✅ Admin authenticated, allowing access to', toRoute.path);
        }
      }
      
      return true; // Allow navigation
    });

    // After route change - render new page
    router.afterEach(async (route) => {
      console.log('✅ Router afterEach - rendering route:', route.path);
      await this.renderRoute(route);
    });
  }

  async renderRoute(route) {
    try {
      
      
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
        const html = await (component.render ? component.render() : '');
        adminMainContent.innerHTML = html;
        
        // Initialize the component if it has an init method
        if (component.init) {
          await component.init();
        } else if (component.mount) {
          component.mount();
        }
        
        this.currentPage = component;
      }
    }
    
    // Always update admin navigation highlighting after rendering the page
    this.updateAdminNavigation();
    
    this.currentLayout = 'admin';
  }

  async loadComponent(ComponentClass, route = null) {
    try {
      
      // Handle dynamic imports - improved detection
      if (typeof ComponentClass === 'function') {
        const funcString = ComponentClass.toString();
        
        // Only treat as dynamic import if it's actually an arrow function that returns import()
        // and doesn't have a class name
        if (!ComponentClass.name && (funcString.includes('import(') || funcString.includes('require('))) {
          try {
            const module = await ComponentClass();
            ComponentClass = module.default || module;
            
          } catch (importError) {
            console.error('❌ Dynamic import failed:', importError);
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
      
      // Pass route to pages that need to access query parameters
      if (route && (ComponentClass.name === 'VocabularyPage' || ComponentClass.name === 'ListeningPage')) {
        return new ComponentClass(route);
      }
      
      return new ComponentClass();
      
    } catch (error) {
      console.error('❌ Failed to load component:', error);
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
                <img src="/dashboard-logo.svg" alt="VocaBin Logo" class="logo">
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
            <img src="/dashboard-logo.svg" alt="VocaBin Admin" class="logo">
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
    
    
    try {
      // Import services
      const { default: apiService } = await import('./services/api.js');
      const { default: adminAuthService } = await import('./services/adminAuth.js');
      
      // Check if regular user is authenticated
      const isUserAuthenticated = await apiService.isAuthenticatedAsync();
      
      if (isUserAuthenticated) {
        const user = apiService.getCurrentUser();
        
        
        // If user is admin, also set up admin session
        if (user && user.role === 'admin') {
          // Check if admin session already exists
          if (!adminAuthService.isAuthenticated()) {
            
            adminAuthService.adminUser = user;
            adminAuthService.isAdminAuthenticated = true;
            
            // Store admin session
            localStorage.setItem('vocabin_admin_session', JSON.stringify({
              user: user,
              timestamp: Date.now()
            }));
            
            
          } else {
            
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