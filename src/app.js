import apiService from './services/api.js';
import { AuthPage } from './pages/AuthPage.js';
import DashboardPage from './pages/dashboard.js';
import { showToast } from './utils/toast.js';

class VocaBinApp {
  constructor() {
    this.currentPage = null;
    this.init();
  }

  async init() {
    // Show loading
    this.showLoading();
    
    // Wait for Shoelace to load
    await this.waitForShoelace();
    
    // Initialize router
    this.initRouter();
    
    // Hide loading and show content
    this.hideLoading();
    
    // Handle initial route
    this.handleRoute();
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

  initRouter() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'auth';
    
    // Check authentication for protected routes
    if (hash !== 'auth' && !apiService.isAuthenticated()) {
      window.location.hash = '#auth';
      return;
    }

    // Route to appropriate page
    switch (hash) {
      case 'auth':
        this.loadAuthPage();
        break;
      case 'dashboard':
        this.loadDashboardPage();
        break;
      default:
        this.loadAuthPage();
    }
  }

  loadAuthPage() {
    // For auth page, render full-screen without navbar/footer
    const contentDiv = document.getElementById('content');
    const appDiv = document.getElementById('app');
    
    // Hide the normal content structure
    contentDiv.style.display = 'none';
    
    // Create or get auth container
    let authContainer = document.getElementById('auth-container');
    if (!authContainer) {
      authContainer = document.createElement('div');
      authContainer.id = 'auth-container';
      appDiv.appendChild(authContainer);
    }
    
    authContainer.style.display = 'block';
    
    // Create and render auth page
    const authPage = new AuthPage(authContainer);
    authPage.render();
    this.currentPage = authPage;
  }

  loadDashboardPage() {
    // For dashboard and other pages, use normal layout with navbar/footer
    const contentDiv = document.getElementById('content');
    const authContainer = document.getElementById('auth-container');
    
    // Hide auth container if it exists
    if (authContainer) {
      authContainer.style.display = 'none';
    }
    
    // Show normal content structure
    contentDiv.style.display = 'block';
    
    // Load dashboard page normally
    this.loadPage(new DashboardPage());
  }

  async loadPage(page) {
    const mainContent = document.getElementById('main-content');
    
    try {
      // Render the page
      let html;
      if (page.render.constructor.name === 'AsyncFunction') {
        html = await page.render();
      } else {
        html = page.render();
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

  showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
      authContainer.style.display = 'none';
    }
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VocaBinApp();
});

// Also export for debugging
window.VocaBinApp = VocaBinApp; 