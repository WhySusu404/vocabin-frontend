import adminAuthService from '../../services/adminAuth.js';
import router from '../../utils/router.js';
import { showToast } from '../../utils/toast.js';

export default class AdminLoginPage {
  constructor() {
    this.name = 'AdminLoginPage';
  }

  render() {
    return `
      <div class="auth-container">
        <div class="form-container">
          <div class="form-header">
            <h1>Admin Login</h1>
            <p>Access the VocaBin administration panel</p>
          </div>
          
          <form class="auth-form" id="admin-login-form">
            <div class="form-group">
              <label for="admin-email">Email Address <span class="required">*</span></label>
              <sl-input
                id="admin-email"
                name="email"
                type="email"
                placeholder="Enter your admin email"
                size="large"
                required
              ></sl-input>
            </div>
            
            <div class="form-group">
              <label for="admin-password">Password <span class="required">*</span></label>
              <sl-input
                id="admin-password"
                name="password"
                type="password"
                placeholder="Enter your admin password"
                size="large"
                required
              ></sl-input>
            </div>
            
            <sl-button
              type="submit"
              variant="primary"
              size="large"
              class="auth-submit-btn"
              id="admin-submit-btn"
            >
              Login to Admin Panel
            </sl-button>
          </form>
          
          <div class="demo-accounts">
            <div class="demo-title">Demo Admin Account:</div>
            <div class="demo-item">admin@vocabin.com / admin123</div>
          </div>
          
          <div class="auth-switch">
            <a href="#auth" class="auth-toggle-link">← Back to User Login</a>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    console.log('AdminLogin page mounted');
    this.bindEvents();
    
    // Check if already authenticated
    if (adminAuthService.isAuthenticated()) {
      router.navigate('admin/dashboard');
    }
  }

  bindEvents() {
    const form = document.getElementById('admin-login-form');
    const submitBtn = document.getElementById('admin-submit-btn');
    
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // Handle Enter key in input fields
    const inputs = form.querySelectorAll('sl-input');
    inputs.forEach(input => {
      input.addEventListener('sl-input', () => {
        // Clear any previous error states
        this.clearErrorStates();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleSubmit(e);
        }
      });
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('admin-submit-btn');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    
    // Get form data
    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };
    
    // Basic validation
    if (!credentials.email || !credentials.password) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      showToast('Please enter a valid email address', 'warning');
      emailInput.focus();
      return;
    }
    
    try {
      // Show loading state
      submitBtn.loading = true;
      submitBtn.disabled = true;
      
      console.log('Attempting admin login with:', credentials.email);
      
      // Attempt admin login
      const result = await adminAuthService.login(credentials);
      
      if (result.success) {
        showToast('Admin login successful! Redirecting...', 'success');
        
        console.log('🔐 Admin login successful, starting redirect...');
        console.log('🔐 Admin user:', result.user);
        console.log('🔐 Admin auth service state:', adminAuthService.isAuthenticated());
        
        // Small delay for user feedback
        setTimeout(() => {
          console.log('🔐 Executing redirect to admin/dashboard...');
          console.log('🔐 Current location hash:', window.location.hash);
          router.navigate('admin/dashboard');
          console.log('🔐 After navigate, location hash:', window.location.hash);
        }, 1000);
        
        // Also try immediate redirect as fallback
        setTimeout(() => {
          console.log('🔐 Fallback redirect check...');
          if (window.location.hash === '#admin' || window.location.hash === '#admin/') {
            console.log('🔐 Still on admin login page, forcing redirect...');
            window.location.hash = 'admin/dashboard';
          }
        }, 2000);
      } else {
        throw new Error(result.message || 'Login failed');
      }
      
    } catch (error) {
      console.error('Admin login error:', error);
      showToast(error.message || 'Admin login failed', 'danger');
      this.showErrorStates();
    } finally {
      // Reset loading state
      submitBtn.loading = false;
      submitBtn.disabled = false;
    }
  }

  showErrorStates() {
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    
    // Add error styling
    emailInput.setAttribute('data-invalid', 'true');
    passwordInput.setAttribute('data-invalid', 'true');
  }

  clearErrorStates() {
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    
    // Remove error styling
    emailInput.removeAttribute('data-invalid');
    passwordInput.removeAttribute('data-invalid');
  }

  cleanup() {
    console.log('AdminLogin page cleanup');
    // Clean up any event listeners if needed
  }
} 