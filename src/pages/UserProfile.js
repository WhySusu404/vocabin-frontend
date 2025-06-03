export default class UserProfilePage {
    constructor() {
        this.name = 'UserProfilePage'
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
                email: 'user@vocabin.com',
                phone: '',
                dateOfBirth: '',
                gender: '',
                country: ''
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
              <a href="#profile" class="profile-nav-item active">Personal Information</a>
              <a href="#profile/password" class="profile-nav-item">Password Change</a>
            </nav>
          </div>
          <div class="profile-main">
            <div class="loading">Loading profile...</div>
          </div>
        </div>
      `
        }

        const currentRoute = window.location.hash;
        const profileActive = currentRoute === '#profile' || currentRoute === '';
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
              <h1>Personal Information</h1>
              <p>Manage your personal information, you can delete and update your information here</p>
            </div>
            
            <form class="profile-form" id="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">Name</label>
                  <sl-input
                    id="firstName"
                    name="firstName"
                    value="${this.user.firstName || ''}"
                    placeholder="Enter your first name"
                  ></sl-input>
                </div>
                <div class="form-group">
                  <label for="lastName">Last Name</label>
                  <sl-input
                    id="lastName"
                    name="lastName"
                    value="${this.user.lastName || ''}"
                    placeholder="Enter your last name"
                  ></sl-input>
                </div>
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <sl-input
                  id="email"
                  name="email"
                  type="email"
                  value="${this.user.email || ''}"
                  placeholder="Enter your email"
                  readonly
                ></sl-input>
              </div>
              
              <div class="form-group">
                <label for="dateOfBirth">Date of Birth</label>
                <sl-input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value="${this.user.dateOfBirth || ''}"
                ></sl-input>
              </div>
              
              <div class="form-group">
                <label for="phone">Phone</label>
                <sl-input
                  id="phone"
                  name="phone"
                  type="tel"
                  value="${this.user.phone || ''}"
                  placeholder="Enter your phone number"
                ></sl-input>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="gender">Gender</label>
                  <sl-select id="gender" name="gender" value="${this.user.gender || ''}" placeholder="Select gender">
                    <sl-option value="">Select gender</sl-option>
                    <sl-option value="male">Male</sl-option>
                    <sl-option value="female">Female</sl-option>
                    <sl-option value="other">Other</sl-option>
                    <sl-option value="prefer-not-to-say">Prefer not to say</sl-option>
                  </sl-select>
                </div>
                <div class="form-group">
                  <label for="country">Country / Region</label>
                  <sl-input
                    id="country"
                    name="country"
                    value="${this.user.country || ''}"
                    placeholder="Enter your country"
                  ></sl-input>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="save-btn">Save</button>
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
          max-width: 800px;
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
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }
        
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
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
        
        .form-actions {
          margin-top: 1rem;
        }
        
        .save-btn {
          display: block;
          margin-left: auto;
          margin-right: auto;
          width: 30%;
          font-size: 1rem;
          background: #689BAE;
          border-radius: 20px;
          color: white;
          text-align: center;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .save-btn:hover {
          background: #6c9aab;
        }
        
        @media (max-width: 768px) {
          .profile-container {
            flex-direction: column;
          }
          
          .profile-sidebar {
            width: 100%;
            border-radius: 0;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `
    }

    async mount() {
        console.log('UserProfile page mounted')

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
        const form = document.getElementById('profile-form')
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault()
                await this.handleSave()
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
    }

    async handleSave() {
        try {
            const { showToast } = await import('../utils/toast.js');
            const { showWooooWToast } = await import('../utils/customToast.js');
            const { default: apiService } = await import('../services/api.js');

            const formData = new FormData(document.getElementById('profile-form'));
            const updateData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone'),
                dateOfBirth: formData.get('dateOfBirth'),
                gender: formData.get('gender'),
                country: formData.get('country')
            }

            await apiService.updateProfile(updateData);
            // showToast('Profile updated successfully!', 'success');
            showWooooWToast('WooooW', 'Information Saved');

            // Reload user data
            await this.loadUserData();

        } catch (error) {
            console.error('Failed to update profile:', error)
            const { showToast } = await import('../utils/toast.js')
            showToast('Failed to update profile. Please try again.', 'danger')
        }
    }

    cleanup() {
        console.log('UserProfile page cleanup')
    }
} 