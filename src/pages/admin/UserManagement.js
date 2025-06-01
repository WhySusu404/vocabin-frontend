import adminAuthService from '../../services/adminAuth.js';
import { showToast } from '../../utils/toast.js';

export default class UserManagementPage {
  constructor() {
    this.name = 'UserManagementPage';
    this.users = [];
    this.filteredUsers = [];
    this.currentFilters = {
      search: '',
      role: '',
      status: '',
      page: 1,
      limit: 10
    };
    this.selectedUser = null;
  }

  async render() {
    // Check admin authentication
    if (!adminAuthService.requireAdmin()) {
      return '<div>Redirecting to admin login...</div>';
    }

    try {
      // Load users
      const result = await adminAuthService.getUsers(this.currentFilters);
      this.users = result.users;
      this.filteredUsers = result.users;
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
      this.filteredUsers = [];
    }

    return `
      <div class="admin-page">
        <div class="admin-header">
          <h1>User Management</h1>
          <p>Manage all registered users and their accounts.</p>
        </div>

        <div class="user-management-controls">
          <div class="search-filters">
            <div class="search-group">
              <sl-input 
                id="user-search"
                placeholder="Search users by name or email..."
                size="medium"
                clearable
              >
                <sl-icon slot="prefix" name="search"></sl-icon>
              </sl-input>
            </div>
            
            <div class="filter-group">
              <sl-select 
                id="role-filter" 
                placeholder="Filter by Role" 
                size="medium"
                clearable
              >
                <sl-option value="">All Roles</sl-option>
                <sl-option value="learner">Learner</sl-option>
                <sl-option value="admin">Admin</sl-option>
              </sl-select>
              
              <sl-select 
                id="status-filter" 
                placeholder="Filter by Status" 
                size="medium"
                clearable
              >
                <sl-option value="">All Status</sl-option>
                <sl-option value="active">Active</sl-option>
                <sl-option value="inactive">Inactive</sl-option>
              </sl-select>
            </div>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">${this.filteredUsers.length}</span>
              <span class="stat-label">Total Users</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.filteredUsers.filter(u => u.isActive).length}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.filteredUsers.filter(u => !u.isActive).length}</span>
              <span class="stat-label">Inactive</span>
            </div>
          </div>
        </div>

        <div class="users-table-container">
          <div class="table-header">
            <h3>User List</h3>
            <div class="table-actions">
              <sl-button variant="primary" size="small" id="refresh-users-btn">
                <sl-icon slot="prefix" name="arrow-clockwise"></sl-icon>
                Refresh
              </sl-button>
            </div>
          </div>

          <div class="users-table">
            <div class="table-head">
              <div class="table-row">
                <div class="table-cell">User</div>
                <div class="table-cell">Email</div>
                <div class="table-cell">Role</div>
                <div class="table-cell">Status</div>
                <div class="table-cell">Last Login</div>
                <div class="table-cell">Progress</div>
                <div class="table-cell">Actions</div>
              </div>
            </div>
            <div class="table-body">
              ${this.renderUserRows()}
            </div>
          </div>
        </div>

        <!-- User Detail Modal -->
        <sl-dialog id="user-detail-modal" label="User Details" class="user-detail-modal">
          <div id="user-detail-content"></div>
          <div slot="footer">
            <sl-button variant="neutral" id="close-modal-btn">Close</sl-button>
            <sl-button variant="primary" id="edit-user-btn">Edit User</sl-button>
          </div>
        </sl-dialog>

        <!-- Edit User Modal -->
        <sl-dialog id="edit-user-modal" label="Edit User" class="edit-user-modal">
          <div id="edit-user-content"></div>
          <div slot="footer">
            <sl-button variant="neutral" id="cancel-edit-btn">Cancel</sl-button>
            <sl-button variant="primary" id="save-user-btn">Save Changes</sl-button>
          </div>
        </sl-dialog>
      </div>
    `;
  }

  renderUserRows() {
    if (this.filteredUsers.length === 0) {
      return `
        <div class="table-row empty-state">
          <div class="empty-message">
            <sl-icon name="person-x"></sl-icon>
            <p>No users found matching your criteria.</p>
          </div>
        </div>
      `;
    }

    return this.filteredUsers.map(user => `
      <div class="table-row" data-user-id="${user.id}">
        <div class="table-cell user-cell">
          <div class="user-avatar">
            <sl-avatar 
              label="${user.firstName} ${user.lastName}"
              initials="${user.firstName.charAt(0)}${user.lastName.charAt(0)}"
            ></sl-avatar>
          </div>
          <div class="user-info">
            <div class="user-name">${user.firstName} ${user.lastName}</div>
            <div class="user-id">ID: ${user.id}</div>
          </div>
        </div>
        
        <div class="table-cell email-cell">
          <span class="user-email">${user.email}</span>
        </div>
        
        <div class="table-cell role-cell">
          <sl-badge variant="${user.role === 'admin' ? 'danger' : 'neutral'}" pill>
            ${user.role}
          </sl-badge>
        </div>
        
        <div class="table-cell status-cell">
          <sl-badge variant="${user.isActive ? 'success' : 'neutral'}" pill>
            ${user.isActive ? 'Active' : 'Inactive'}
          </sl-badge>
        </div>
        
        <div class="table-cell date-cell">
          <span class="date-text">${this.formatDate(user.lastLogin)}</span>
        </div>
        
        <div class="table-cell progress-cell">
          <div class="progress-info">
            <div class="progress-item">
              <span class="progress-number">${user.statistics.wordsLearned}</span>
              <span class="progress-label">Words</span>
            </div>
            <div class="progress-item">
              <span class="progress-number">${user.statistics.hoursStudied}</span>
              <span class="progress-label">Hours</span>
            </div>
          </div>
        </div>
        
        <div class="table-cell actions-cell">
          <div class="action-buttons">
            <sl-button 
              variant="neutral" 
              size="small"
              onclick="userManagement.viewUser('${user.id}')"
            >
              <sl-icon name="eye"></sl-icon>
            </sl-button>
            <sl-button 
              variant="neutral" 
              size="small"
              onclick="userManagement.editUser('${user.id}')"
            >
              <sl-icon name="pencil"></sl-icon>
            </sl-button>
            <sl-button 
              variant="${user.isActive ? 'warning' : 'success'}" 
              size="small"
              onclick="userManagement.toggleUserStatus('${user.id}')"
            >
              <sl-icon name="${user.isActive ? 'person-dash' : 'person-check'}"></sl-icon>
            </sl-button>
          </div>
        </div>
      </div>
    `).join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  }

  mount() {
    console.log('UserManagement page mounted');
    this.bindEvents();
    this.updateActiveNavigation();
    
    // Make methods globally accessible for inline onclick handlers
    window.userManagement = this;
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('sl-input', (e) => {
        this.currentFilters.search = e.target.value;
        this.applyFilters();
      });
    }

    // Role filter
    const roleFilter = document.getElementById('role-filter');
    if (roleFilter) {
      roleFilter.addEventListener('sl-change', (e) => {
        this.currentFilters.role = e.target.value;
        this.applyFilters();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('sl-change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshUsers();
      });
    }

    // Modal close buttons
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        document.getElementById('user-detail-modal').hide();
      });
    }

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.getElementById('edit-user-modal').hide();
      });
    }
  }

  async applyFilters() {
    try {
      const result = await adminAuthService.getUsers(this.currentFilters);
      this.filteredUsers = result.users;
      
      // Re-render the table
      const tableBody = document.querySelector('.table-body');
      if (tableBody) {
        tableBody.innerHTML = this.renderUserRows();
      }
      
      // Update stats
      this.updateUserStats();
    } catch (error) {
      console.error('Error applying filters:', error);
      showToast('Error filtering users', 'danger');
    }
  }

  updateUserStats() {
    const statNumbers = document.querySelectorAll('.user-stats .stat-number');
    if (statNumbers.length >= 3) {
      statNumbers[0].textContent = this.filteredUsers.length;
      statNumbers[1].textContent = this.filteredUsers.filter(u => u.isActive).length;
      statNumbers[2].textContent = this.filteredUsers.filter(u => !u.isActive).length;
    }
  }

  async refreshUsers() {
    try {
      const result = await adminAuthService.getUsers(this.currentFilters);
      this.users = result.users;
      this.filteredUsers = result.users;
      
      // Re-render the table
      const tableBody = document.querySelector('.table-body');
      if (tableBody) {
        tableBody.innerHTML = this.renderUserRows();
      }
      
      this.updateUserStats();
      showToast('Users refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing users:', error);
      showToast('Error refreshing users', 'danger');
    }
  }

  viewUser(userId) {
    const user = this.filteredUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('user-detail-modal');
    const content = document.getElementById('user-detail-content');
    
    content.innerHTML = `
      <div class="user-detail-view">
        <div class="user-header">
          <sl-avatar 
            label="${user.firstName} ${user.lastName}"
            initials="${user.firstName.charAt(0)}${user.lastName.charAt(0)}"
            style="--size: 4rem;"
          ></sl-avatar>
          <div class="user-title">
            <h3>${user.firstName} ${user.lastName}</h3>
            <p>${user.email}</p>
          </div>
        </div>
        
        <div class="user-details-grid">
          <div class="detail-item">
            <label>User ID</label>
            <span>${user.id}</span>
          </div>
          <div class="detail-item">
            <label>Role</label>
            <sl-badge variant="${user.role === 'admin' ? 'danger' : 'neutral'}" pill>${user.role}</sl-badge>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <sl-badge variant="${user.isActive ? 'success' : 'neutral'}" pill>${user.isActive ? 'Active' : 'Inactive'}</sl-badge>
          </div>
          <div class="detail-item">
            <label>Registration Date</label>
            <span>${new Date(user.registrationDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-item">
            <label>Last Login</label>
            <span>${this.formatDate(user.lastLogin)}</span>
          </div>
          <div class="detail-item">
            <label>Words Learned</label>
            <span>${user.statistics.wordsLearned}</span>
          </div>
          <div class="detail-item">
            <label>Study Hours</label>
            <span>${user.statistics.hoursStudied}</span>
          </div>
          <div class="detail-item">
            <label>Current Streak</label>
            <span>${user.statistics.streakDays} days</span>
          </div>
        </div>
      </div>
    `;
    
    modal.show();
  }

  editUser(userId) {
    const user = this.filteredUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('edit-user-modal');
    const content = document.getElementById('edit-user-content');
    
    content.innerHTML = `
      <form id="edit-user-form" class="edit-user-form">
        <div class="form-group">
          <label>First Name</label>
          <sl-input name="firstName" value="${user.firstName}" required></sl-input>
        </div>
        
        <div class="form-group">
          <label>Last Name</label>
          <sl-input name="lastName" value="${user.lastName}" required></sl-input>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <sl-input name="email" type="email" value="${user.email}" required></sl-input>
        </div>
        
        <div class="form-group">
          <label>Role</label>
          <sl-select name="role" value="${user.role}" required>
            <sl-option value="learner">Learner</sl-option>
            <sl-option value="admin">Admin</sl-option>
          </sl-select>
        </div>
        
        <div class="form-group">
          <sl-checkbox name="isActive" ${user.isActive ? 'checked' : ''}>Account Active</sl-checkbox>
        </div>
      </form>
    `;
    
    this.selectedUser = user;
    modal.show();
  }

  async toggleUserStatus(userId) {
    const user = this.filteredUsers.find(u => u.id === userId);
    if (!user) return;

    try {
      // Simulate API call to toggle user status
      user.isActive = !user.isActive;
      
      // Re-render the table row
      const tableBody = document.querySelector('.table-body');
      if (tableBody) {
        tableBody.innerHTML = this.renderUserRows();
      }
      
      this.updateUserStats();
      showToast(`User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Error updating user status', 'danger');
    }
  }

  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#admin/users') {
        link.classList.add('active');
      }
    });
  }

  cleanup() {
    console.log('UserManagement page cleanup');
    // Clean up global reference
    if (window.userManagement === this) {
      delete window.userManagement;
    }
  }
} 