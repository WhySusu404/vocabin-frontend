import { showToast } from '../utils/toast.js';
import apiService from '../services/api.js';
import router from '../utils/router.js';
// import logoSvgUrl from 'url:../assets/login-logo.svg';
// Changed to direct path instead of module import for PNG
// import loginPngUrl from 'url:../assets/login.png';

export class AuthPage {
    constructor(container) {
        this.container = container;
        this.isLoginMode = true;
    }

    render() {
        this.container.innerHTML = `
            <div class="auth-page">
                <!-- Header with Logo -->
                <div class="auth-header">
                    <div class="logo-container">
                        <img src="/login-logo.svg" alt="VocaBin" class="auth-logo">
                    </div>
                </div>

                <!-- Main Content -->
                <div class="auth-content">
                    <!-- Left Side - Form -->
                    <div class="auth-form-section">
                        <div class="auth-form-container">
                            <h1 class="auth-title">Login</h1>
                            <p class="auth-subtitle">Smart, personalized English practice that fits your life.</p>

                            <!-- Admin Sign In Button -->
                            <sl-button variant="default" size="large" class="google-signin-btn" id="adminSigninBtn">
                                <sl-icon name="admin" slot="prefix"></sl-icon>
                                Sign in as Admin
                            </sl-button>

                            <!-- Divider -->
                            <div class="auth-divider">
                                <span>or Sign in with Email</span>
                            </div>

                            <!-- Auth Form -->
                            <form class="auth-form" id="authForm">
                                <div class="form-group" id="nameFields" style="display: none;">
                                    <div class="form-row">
                                        <div class="form-column">
                                            <label for="firstName">First Name <span class="required">*</span></label>
                                            <sl-input 
                                                id="firstName" 
                                                type="text" 
                                                placeholder="Enter your first name"
                                                size="large">
                                            </sl-input>
                                        </div>
                                        <div class="form-column">
                                            <label for="lastName">Last Name <span class="required">*</span></label>
                                            <sl-input 
                                                id="lastName" 
                                                type="text" 
                                                placeholder="Enter your last name"
                                                size="large">
                                            </sl-input>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="email">Email <span class="required">*</span></label>
                                    <sl-input 
                                        id="email" 
                                        type="email" 
                                        placeholder="Enter your email"
                                        size="large"
                                        required>
                                    </sl-input>
                                </div>

                                <div class="form-group">
                                    <label for="password">Password <span class="required">*</span></label>
                                    <sl-input 
                                        id="password" 
                                        type="password" 
                                        placeholder="Enter your password"
                                        password-toggle
                                        size="large"
                                        required>
                                    </sl-input>
                                </div>

                                <div class="form-options">
                                    <sl-checkbox id="rememberMe">Remember me</sl-checkbox>
                                    <a href="#" class="forgot-password">Forgot password?</a>
                                </div>

                                <sl-button 
                                    type="submit" 
                                    variant="primary" 
                                    size="large" 
                                    class="auth-submit-btn"
                                    id="submitBtn">
                                    ${this.isLoginMode ? 'Login' : 'Create Account'}
                                </sl-button>

                                <div class="auth-switch">
                                    <span>
                                        ${this.isLoginMode ? 'Not Signup yet?' : 'Already have an account?'}
                                        <a href="#" id="authModeToggle" class="auth-toggle-link">
                                            ${this.isLoginMode ? 'Create new account' : 'Login here'}
                                        </a>
                                    </span>
                                </div>
                            </form>

                            <!-- Demo accounts info -->
                            <div class="demo-accounts">
                                <p class="demo-title">Demo accounts:</p>
                                <p class="demo-item">Admin: admin@vocabin.com / admin123</p>
                                <p class="demo-item">Learner: learner@vocabin.com / learner123</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side - Illustration -->
                    <div class="auth-illustration-section">
                        <div class="illustration-container">
                            <img src="/login.png" alt="Learning Illustration" class="auth-illustration" />
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.attachEventListeners();
        
        // Show/hide name fields based on mode
        this.updateNameFieldsVisibility();
    }

    attachEventListeners() {
        const form = this.container.querySelector('#authForm');
        const toggleLink = this.container.querySelector('#authModeToggle');
        const submitBtn = this.container.querySelector('#submitBtn');
        const adminSigninBtn = this.container.querySelector('#adminSigninBtn');

        adminSigninBtn.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('admin');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        
        // Update form elements
        const title = this.container.querySelector('.auth-title');
        const submitBtn = this.container.querySelector('#submitBtn');
        const toggleLink = this.container.querySelector('#authModeToggle');
        const authSwitch = this.container.querySelector('.auth-switch span');

        if (this.isLoginMode) {
            title.textContent = 'Login';
            submitBtn.textContent = 'Login';
            authSwitch.innerHTML = `
                Not Signup yet?
                <a href="#" id="authModeToggle" class="auth-toggle-link">Create new account</a>
            `;
        } else {
            title.textContent = 'Create Account';
            submitBtn.textContent = 'Create Account';
            authSwitch.innerHTML = `
                Already have an account?
                <a href="#" id="authModeToggle" class="auth-toggle-link">Login here</a>
            `;
        }

        // Update name fields visibility
        this.updateNameFieldsVisibility();

        // Re-attach event listener for the new toggle link
        const newToggleLink = this.container.querySelector('#authModeToggle');
        newToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
    }

    updateNameFieldsVisibility() {
        const nameFields = this.container.querySelector('#nameFields');
        if (nameFields) {
            nameFields.style.display = this.isLoginMode ? 'none' : 'block';
        }
    }

    async handleSubmit() {
        const form = this.container.querySelector('#authForm');
        const submitBtn = this.container.querySelector('#submitBtn');
        const emailInput = this.container.querySelector('#email');
        const passwordInput = this.container.querySelector('#password');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'warning');
            return;
        }

        // Additional validation for signup mode
        if (!this.isLoginMode) {
            const firstNameInput = this.container.querySelector('#firstName');
            const lastNameInput = this.container.querySelector('#lastName');
            
            const firstName = firstNameInput?.value.trim();
            const lastName = lastNameInput?.value.trim();
            
            if (!firstName || !lastName) {
                showToast('Please fill in your first and last name', 'warning');
                return;
            }
        }

        try {
            submitBtn.loading = true;
            let response;

            if (this.isLoginMode) {
                response = await apiService.login({ email, password });
                showToast('Login successful!', 'success');
            } else {
                const firstNameInput = this.container.querySelector('#firstName');
                const lastNameInput = this.container.querySelector('#lastName');
                
                response = await apiService.register({ 
                    email, 
                    password,
                    firstName: firstNameInput.value.trim(),
                    lastName: lastNameInput.value.trim()
                });
                showToast('Account created successfully!', 'success');
            }
            
            // Check user role and redirect appropriately
            const user = apiService.getCurrentUser();
            
            if (user && user.role === 'admin') {
                // For admin users, set up admin session properly
                const { default: adminAuthService } = await import('../services/adminAuth.js');
                
                // Set up admin authentication state
                adminAuthService.adminUser = user;
                adminAuthService.isAdminAuthenticated = true;
                
                // Store admin session
                localStorage.setItem('vocabin_admin_session', JSON.stringify({
                    user: user,
                    timestamp: Date.now()
                }));
                
                console.log('🔐 Admin session set up from regular login');
                router.navigate('admin/dashboard');
            } else {
                router.navigate('dashboard');
            }

        } catch (error) {
            console.error('Auth error:', error);
            showToast(error.message || 'Authentication failed', 'danger');
        } finally {
            submitBtn.loading = false;
        }
    }

    destroy() {
        // Clean up event listeners if needed
    }
} 