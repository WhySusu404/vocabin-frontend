export default class PasswordChangePage {
    constructor() {
        this.name = 'PasswordChangePage'
        this.user = null
    }

    async loadUserData() {
        try {
            const { default: apiService } = await import('../services/api.js')
            const response = await apiService.getProfile()
            this.user = response.user
        } catch (error) {
            console.error('Failed to load user data:', error)
            // Fallback user data
            this.user = {
                firstName: 'User',
                lastName: 'Demo',
                email: 'user@vocabin.com'
            }
        }
    }

    render() {
        if (!this.user) {
            return `
        <div class="profile-container">
          <div class="profile-sidebar">
            <div class="profile-user-info">
              <div class="profile-avatar">
                <div class="avatar-placeholder"></div>
              </div>
              <div class="profile-user-details">
                <h3>Loading...</h3>
                <p>Loading...</p>
              </div>
            </div>
            <nav class="profile-nav">
              <a href="#profile" class="profile-nav-item">Personal Information</a>
              <a href="#profile/password" class="profile-nav-item active">Password Change</a>
            </nav>
          </div>
          <div class="profile-main">
            <div class="loading">Loading profile...</div>
          </div>
        </div>
      `
        }

        const currentRoute = window.location.hash;
        const profileActive = currentRoute === '#profile';
        const passwordActive = currentRoute === '#profile/password';

        return `
      <div class="profile-container">
        <div class="profile-sidebar">
          <div class="profile-user-info">
            <div class="profile-avatar">
              <div class="avatar-placeholder"></div>
            </div>
            <div class="profile-user-details">
              <h3>${this.user.firstName} ${this.user.lastName}</h3>
              <p>${this.user.email}</p>
            </div>
          </div>
          <nav class="profile-nav">
            <a href="#profile" class="profile-nav-item ${profileActive ? 'active' : ''}">Personal Information</a>
            <a href="#profile/password" class="profile-nav-item ${passwordActive ? 'active' : ''}">Password Change</a>
          </nav>
        </div>
        
        <div class="profile-main">
          <div class="profile-content">
            <div class="profile-header">
              <h1>Password Change</h1>
              <p>Change your password here</p>
              <p class="password-requirements">
                Your password must be at least 8 characters and should include a combination of numbers, letters and special characters for security
              </p>
            </div>
            
            <form class="password-form" id="password-form">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <sl-input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  required
                ></sl-input>
              </div>
              
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <sl-input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  required
                ></sl-input>
                <div class="password-strength" id="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" id="strength-fill"></div>
                  </div>
                  <span class="strength-text" id="strength-text">Password strength</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <sl-input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  required
                ></sl-input>
              </div>
              
              <div class="form-actions">
                <div class="submit-btn">Submit</div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <style>
        .profile-container {
          display: flex;
          min-height: calc(100vh - 80px);
          background: #E5F1FD;
        }
        
        .profile-sidebar {
          width: 280px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 0 20px 20px 0;
        }
        
        .profile-user-info {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .profile-avatar {
          margin-bottom: 1rem;
        }
        
        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }
        
        .profile-user-details h3 {
          color: black;
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }
        
        .profile-user-details p {
          color: black;
          margin: 0;
          font-size: 0.9rem;
        }
        
        .profile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .profile-nav-item {
          padding: 1rem;
          color: black;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .profile-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: black;
        }
        
        .profile-nav-item.active {
          color: #689BAE;
          font-weight: 500;
          font-size: 1rem;
        }
        
        .profile-main {
          flex: 1;
          padding: 2rem;
        }
        
        .profile-content {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 600px;
        }
        
        .profile-header {
          margin-bottom: 2rem;
        }
        
        .profile-header h1 {
          margin: 0 0 0.5rem 0;
          color: #689BAE;
          font-size: 1.75rem;
        }
        
        .profile-header p {
          margin: 0 0 0.5rem 0;
          color: #666;
          font-size: 0.95rem;
        }
        
        .password-requirements {
          font-size: 0.85rem !important;
          color: #888 !important;
          line-height: 1.4;
        }
        
        .password-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-group label {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }
        
        .password-strength {
          margin-top: 0.5rem;
        }
        
        .strength-bar {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }
        
        .strength-fill {
          height: 100%;
          width: 0%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }
        
        .strength-text {
          font-size: 0.8rem;
          color: #666;
        }
        
        .strength-weak .strength-fill {
          width: 33%;
          background: #ff4757;
        }
        
        .strength-medium .strength-fill {
          width: 66%;
          background: #ffa502;
        }
        
        .strength-strong .strength-fill {
          width: 100%;
          background: #2ed573;
        }
        
        .form-actions {
          margin-top: 1rem;
        }
        
        .submit-btn {
          display: block;
        margin-left: auto;
        margin-right: auto;
        width: 30%;
        font-size: var(--font-size-md);
        background: #689BAE;
        border-radius: 20px;
        color: white;
        text-align: center;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        transition: background 0.3s ease;
        
        &:hover {
            background: #6c9aab;
        }
        }
        
        .error-message {
          color: #ff4757;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }
        
        @media (max-width: 768px) {
          .profile-container {
            flex-direction: column;
          }
          
          .profile-sidebar {
            width: 100%;
            border-radius: 0;
          }
        }
      </style>
    `
    }

    async mount() {
        console.log('PasswordChange page mounted')

        // Load user data
        await this.loadUserData()

        // Re-render with user data
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
            mainContent.innerHTML = this.render()
            this.bindEvents()
        }
    }

    bindEvents() {
        const form = document.getElementById('password-form')
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault()
                await this.handlePasswordChange()
            })
        }

        // Handle navigation clicks
        const navItems = document.querySelectorAll('.profile-nav-item')
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault()
                const href = item.getAttribute('href')
                if (href) {
                    const { default: router } = require('../utils/router.js')
                    router.navigate(href.substring(1)) // Remove #
                }
            })
        })

        // Password strength checker
        const newPasswordInput = document.getElementById('newPassword')
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value)
            })
        }

        // Password confirmation checker
        const confirmPasswordInput = document.getElementById('confirmPassword')
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => {
                this.checkPasswordMatch()
            })
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('password-strength')
        const strengthText = document.getElementById('strength-text')

        if (!strengthBar || !strengthText) return

        // Remove existing classes
        strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong')

        if (password.length === 0) {
            strengthText.textContent = 'Password strength'
            return
        }

        let score = 0
        if (password.length >= 8) score++
        if (/[a-z]/.test(password)) score++
        if (/[A-Z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score < 3) {
            strengthBar.classList.add('strength-weak')
            strengthText.textContent = 'Weak password'
        } else if (score < 5) {
            strengthBar.classList.add('strength-medium')
            strengthText.textContent = 'Medium password'
        } else {
            strengthBar.classList.add('strength-strong')
            strengthText.textContent = 'Strong password'
        }
    }

    checkPasswordMatch() {
        const newPassword = document.getElementById('newPassword').value
        const confirmPassword = document.getElementById('confirmPassword').value
        const confirmGroup = document.getElementById('confirmPassword').closest('.form-group')

        // Remove existing error message
        const existingError = confirmGroup.querySelector('.error-message')
        if (existingError) {
            existingError.remove()
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            const errorDiv = document.createElement('div')
            errorDiv.className = 'error-message'
            errorDiv.textContent = 'Passwords do not match'
            confirmGroup.appendChild(errorDiv)
        }
    }

    async handlePasswordChange() {
        try {
            const { showToast } = await import('../utils/toast.js');
            const { showWooooWToast } = await import('../utils/customToast.js');
            const { default: apiService } = await import('../services/api.js');

            const formData = new FormData(document.getElementById('password-form'));
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast('Please fill in all fields', 'warning');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'warning');
                return;
            }

            if (newPassword.length < 8) {
                showToast('New password must be at least 8 characters long', 'warning');
                return;
            }

            // Call API to change password
            await apiService.changePassword({
                currentPassword,
                newPassword
            });

            // showToast('Password changed successfully!', 'success');
            showWooooWToast('WooooW', 'Password Changed'); // Or a more generic message if preferred

            // Clear form
            document.getElementById('password-form').reset();

            // Reset password strength indicator
            const strengthBar = document.getElementById('password-strength');
            const strengthText = document.getElementById('strength-text');
            if (strengthBar && strengthText) {
                strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
                strengthText.textContent = 'Password strength';
            }

        } catch (error) {
            console.error('Failed to change password:', error);
            const { showToast } = await import('../utils/toast.js');

            if (error.message && error.message.includes('Current password is incorrect')) {
                showToast('Current password is incorrect', 'danger');
            } else {
                showToast('Failed to change password. Please try again.', 'danger');
            }
        }
    }

    cleanup() {
        console.log('PasswordChange page cleanup')
    }
} 