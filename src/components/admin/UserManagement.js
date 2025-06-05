/**
 * Admin User Management Component
 * Clean interface for managing user accounts
 */
import { API_CONFIG } from '../../config/api.js';

class UserManagement {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.users = [];
    this.totalPages = 1;
    this.editingUser = null;
    this.sortField = 'createdAt';
    this.sortDirection = 'desc';
    this.baseURL = API_CONFIG.BASE_URL;
    
    console.log('🔧 UserManagement initialized with baseURL:', this.baseURL);
  }

  async render() {
    return `
      <div class="user-management" style="
        padding: 2rem !important;
        max-width: 1400px !important;
        margin: 0 auto !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        min-height: 100vh !important;
      ">
        <div class="page-header">
          <h2 style="
            color: white !important;
            margin-bottom: 0.5rem !important;
            font-size: 2.5rem !important;
            font-weight: 700 !important;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
            background: linear-gradient(45deg, #ffffff, #e0e7ff) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            position: relative !important;
          ">User Management
            <div style="
              position: absolute !important;
              bottom: -8px !important;
              left: 0 !important;
              width: 60px !important;
              height: 4px !important;
              background: linear-gradient(90deg, #60a5fa, #34d399) !important;
              border-radius: 2px !important;
            "></div>
          </h2>
          <p style="color: rgba(255, 255, 255, 0.9) !important; font-size: 1.1rem !important;">Manage user accounts and permissions</p>
        </div>

        <!-- Filters -->
        <div class="filters-section" style="
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          padding: 1.5rem !important;
          border-radius: 20px !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          margin-bottom: 2rem !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        ">
          <div class="filters-row">
            <sl-input 
              placeholder="Search users..." 
              value="${this.searchTerm}"
              class="search-input"
              id="userSearch">
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
            
            <sl-select 
              placeholder="Role" 
              value="${this.roleFilter}"
              class="filter-select"
              id="roleFilter">
              <sl-option value="">All Roles</sl-option>
              <sl-option value="learner">Learner</sl-option>
              <sl-option value="admin">Admin</sl-option>
            </sl-select>
            
            <sl-select 
              placeholder="Status" 
              value="${this.statusFilter}"
              class="filter-select"
              id="statusFilter">
              <sl-option value="">All Status</sl-option>
              <sl-option value="true">Active</sl-option>
              <sl-option value="false">Inactive</sl-option>
            </sl-select>
            
            <sl-button id="searchBtn" variant="primary" style="
              background: linear-gradient(135deg, #60a5fa, #34d399) !important;
              border: none !important;
              color: white !important;
              font-weight: 600 !important;
            ">
              <sl-icon name="search"></sl-icon>
              Search
            </sl-button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-container" style="
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 20px !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          overflow: hidden !important;
          margin-bottom: 2rem !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        ">
          <table class="users-table">
            <thead>
              <tr>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">User</th>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">Email</th>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">Role</th>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">Status</th>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">Registered</th>
                <th style="
                  background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                  padding: 1rem !important;
                  text-align: left !important;
                  font-weight: 700 !important;
                  color: var(--sl-color-neutral-700) !important;
                  border-bottom: 1px solid var(--sl-color-neutral-200) !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.5px !important;
                  font-size: 0.875rem !important;
                ">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${this.renderUsersRows()}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
          ${this.renderPagination()}
        </div>

        <!-- Edit User Modal -->
        ${this.renderEditModal()}
      </div>
    `;
  }

  renderUsersRows() {
    if (!this.users || this.users.length === 0) {
      return `
        <tr>
          <td colspan="6" class="no-data">
            <div class="no-users">
              <sl-icon name="people" style="font-size: 3rem; opacity: 0.3;"></sl-icon>
              <p>No users found</p>
            </div>
          </td>
        </tr>
      `;
    }

    return this.users.map(user => `
      <tr class="user-row" style="
        transition: all 0.3s ease !important;
      " onmouseover="this.style.background='rgba(102, 158, 234, 0.05)'; this.style.transform='scale(1.01)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.08)'" 
         onmouseout="this.style.background=''; this.style.transform=''; this.style.boxShadow=''">
        <td class="user-info">
          <div class="user-avatar" style="
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            overflow: hidden !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            transition: all 0.3s ease !important;
            display: inline-block !important;
            margin-right: 1rem !important;
          ">
            ${user.profileImage ? 
              `<img src="${user.profileImage}" alt="${user.firstName}" style="width: 100%; height: 100%; object-fit: cover;">` :
              `<div class="avatar-placeholder" style="
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea, #764ba2) !important;
                color: white !important;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700 !important;
                font-size: 1.2rem;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
              ">${user.firstName?.charAt(0) || 'U'}</div>`
            }
          </div>
          <div class="user-details" style="display: inline-block; vertical-align: top;">
            <span class="user-name" style="
              display: block;
              font-weight: 600;
              color: var(--sl-color-neutral-900);
              font-size: 1.1rem;
            ">${user.firstName || ''} ${user.lastName || ''}</span>
            <span class="user-id" style="
              font-size: 0.875rem;
              color: var(--sl-color-neutral-500);
              font-family: monospace;
            ">${user._id}</span>
          </div>
        </td>
        <td class="user-email" style="
          color: var(--sl-color-neutral-700);
          font-weight: 500;
        ">${user.email}</td>
        <td>
          <sl-badge variant="${user.role === 'admin' ? 'danger' : 'primary'}" style="
            ${user.role === 'admin' ? 
              'background: linear-gradient(135deg, #ef4444, #f87171) !important; color: white !important;' :
              'background: linear-gradient(135deg, #10b981, #34d399) !important; color: white !important;'
            }
            font-weight: 600 !important;
            box-shadow: 0 2px 8px ${user.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'} !important;
          ">
            ${user.role}
          </sl-badge>
        </td>
        <td>
          <sl-switch 
            ${user.isActive ? 'checked' : ''} 
            data-user-id="${user._id}"
            class="status-toggle">
          </sl-switch>
          <span class="status-text ${user.isActive ? 'active' : 'inactive'}" style="
            margin-left: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: ${user.isActive ? 'var(--sl-color-success-700)' : 'var(--sl-color-danger-700)'};
          ">
            ${user.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="reg-date" style="
          color: var(--sl-color-neutral-600);
          font-size: 0.875rem;
          font-weight: 500;
        ">
          ${user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'}
        </td>
        <td class="actions">
          <sl-button 
            size="small" 
            variant="neutral" 
            data-user-id="${user._id}"
            class="edit-user-btn"
            style="
              background: linear-gradient(135deg, #60a5fa, #3b82f6) !important;
              border: none !important;
              color: white !important;
              font-weight: 600 !important;
              transition: all 0.3s ease !important;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(59, 130, 246, 0.4)'"
            onmouseout="this.style.transform=''; this.style.boxShadow=''">
            <sl-icon name="pencil"></sl-icon>
            Edit
          </sl-button>
        </td>
      </tr>
    `).join('');
  }

  renderPagination() {
    if (this.totalPages <= 1) return '';

    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(`
        <sl-button 
          variant="${i === this.currentPage ? 'primary' : 'default'}"
          size="small" 
          class="page-btn"
          data-page="${i}"
          style="
            ${i === this.currentPage ? 
              'background: linear-gradient(135deg, #667eea, #764ba2) !important; color: white !important; box-shadow: 0 4px 12px rgba(102, 158, 234, 0.4) !important;' :
              'background: rgba(255, 255, 255, 0.9) !important; backdrop-filter: blur(10px) !important; border: 1px solid rgba(255, 255, 255, 0.3) !important;'
            }
            transition: all 0.3s ease !important;
          "
          ${i !== this.currentPage ? 
            `onmouseover="this.style.background='linear-gradient(135deg, #60a5fa, #34d399)'; this.style.color='white'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(96, 165, 250, 0.4)'"
             onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color=''; this.style.transform=''; this.style.boxShadow=''"` : 
            ''
          }>
          ${i}
        </sl-button>
      `);
    }

    return `
      <div class="pagination">
        <sl-button 
          variant="default" 
          size="small" 
          ${this.currentPage === 1 ? 'disabled' : ''}
          id="prevPage"
          style="
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            transition: all 0.3s ease !important;
          "
          onmouseover="if (!this.disabled) { this.style.background='linear-gradient(135deg, #60a5fa, #34d399)'; this.style.color='white'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(96, 165, 250, 0.4)'; }"
          onmouseout="if (!this.disabled) { this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color=''; this.style.transform=''; this.style.boxShadow=''; }">
          <sl-icon name="chevron-left"></sl-icon>
        </sl-button>
        
        ${pages.join('')}
        
        <sl-button 
          variant="default" 
          size="small" 
          ${this.currentPage === this.totalPages ? 'disabled' : ''}
          id="nextPage"
          style="
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            transition: all 0.3s ease !important;
          "
          onmouseover="if (!this.disabled) { this.style.background='linear-gradient(135deg, #60a5fa, #34d399)'; this.style.color='white'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(96, 165, 250, 0.4)'; }"
          onmouseout="if (!this.disabled) { this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color=''; this.style.transform=''; this.style.boxShadow=''; }">
          <sl-icon name="chevron-right"></sl-icon>
        </sl-button>
      </div>
    `;
  }

  renderEditModal() {
    if (!this.editingUser) return '';

    return `
      <sl-dialog label="Edit User" class="edit-user-modal" open>
        <form id="editUserForm" class="edit-form">
          <div class="form-row">
            <sl-input 
              label="First Name" 
              value="${this.editingUser.firstName || ''}"
              name="firstName"
              required>
            </sl-input>
            
            <sl-input 
              label="Last Name" 
              value="${this.editingUser.lastName || ''}"
              name="lastName"
              required>
            </sl-input>
          </div>
          
          <sl-input 
            label="Email" 
            type="email"
            value="${this.editingUser.email || ''}"
            name="email"
            required>
          </sl-input>
          
          <sl-select 
            label="Role" 
            value="${this.editingUser.role || 'learner'}"
            name="role"
            required>
            <sl-option value="learner">Learner</sl-option>
            <sl-option value="admin">Admin</sl-option>
          </sl-select>
          
          <sl-switch 
            ${this.editingUser.isActive ? 'checked' : ''}
            name="isActive">
            Account Active
          </sl-switch>
        </form>
        
        <div slot="footer">
          <sl-button variant="default" id="cancelEdit">Cancel</sl-button>
          <sl-button variant="primary" id="saveUser">Save Changes</sl-button>
        </div>
      </sl-dialog>
    `;
  }

  async init() {
    await this.loadUsers();
    this.bindEvents();
  }

  async loadUsers() {
    try {
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm,
        role: this.roleFilter,
        isActive: this.statusFilter
      });

      // Use configured backend URL instead of hardcoded one
      const apiUrl = `${this.baseURL}/api/admin/users?${queryParams}`;
      
      // Debug token information - check both possible token keys
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('🔑 Token info:', {
        hasAuthToken: !!localStorage.getItem('authToken'),
        hasToken: !!localStorage.getItem('token'),
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...',
        tokenEnd: '...' + token?.substring(token?.length - 20)
      });
      
      console.log('🔍 Loading users from:', apiUrl);
      console.log('🔍 Query params:', {
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm,
        role: this.roleFilter,
        isActive: this.statusFilter
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseText = await response.text();
        console.log('🔍 Raw response:', responseText.substring(0, 200));
        
        try {
          const data = JSON.parse(responseText);
          console.log('📊 Parsed data:', data);
          this.users = data.data.users;
          this.currentPage = data.data.pagination.currentPage;
          this.totalPages = data.data.pagination.totalPages;
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Response was:', responseText);
          this.users = [];
        }
      } else {
        const responseText = await response.text();
        console.error('❌ Failed to load users. Status:', response.status);
        console.error('❌ Response:', responseText);
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.error('🔒 Authentication failed - token may be expired or invalid');
          console.error('🔒 Consider logging out and logging back in');
          // You could trigger a logout here or show a specific message
        }
        
        this.users = [];
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      this.users = [];
    }
  }

  bindEvents() {
    // Search and filters
    document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
    document.getElementById('userSearch')?.addEventListener('sl-input', (e) => {
      this.searchTerm = e.target.value;
    });
    document.getElementById('roleFilter')?.addEventListener('sl-change', (e) => {
      this.roleFilter = e.target.value;
    });
    document.getElementById('statusFilter')?.addEventListener('sl-change', (e) => {
      this.statusFilter = e.target.value;
    });

    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
    document.getElementById('nextPage')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.changePage(page);
      });
    });

    // Status toggles
    document.querySelectorAll('.status-toggle').forEach(toggle => {
      toggle.addEventListener('sl-change', (e) => this.toggleUserStatus(e));
    });

    // Edit buttons
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.editUser(e));
    });

    // Modal events
    document.getElementById('cancelEdit')?.addEventListener('click', () => this.closeEditModal());
    document.getElementById('saveUser')?.addEventListener('click', () => this.saveUser());
  }

  async handleSearch() {
    this.currentPage = 1;
    await this.loadUsers();
    await this.refresh();
  }

  async changePage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      await this.loadUsers();
      await this.refresh();
    }
  }

  async toggleUserStatus(event) {
    const userId = event.target.dataset.userId;
    const newStatus = event.target.checked;
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update local user data
        const user = this.users.find(u => u._id === userId);
        if (user) {
          user.isActive = data.data.isActive;
        }
        await this.refresh();
      } else {
        // Revert toggle on error
        event.target.checked = !newStatus;
        console.error('Failed to update user status');
      }
    } catch (error) {
      // Revert toggle on error
      event.target.checked = !newStatus;
      console.error('Error updating user status:', error);
    }
  }

  editUser(event) {
    const userId = event.target.closest('.edit-user-btn').dataset.userId;
    this.editingUser = this.users.find(u => u._id === userId);
    this.refresh();
  }

  closeEditModal() {
    this.editingUser = null;
    this.refresh();
  }

  async saveUser() {
    const form = document.getElementById('editUserForm');
    const formData = new FormData(form);
    
    const userData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      role: formData.get('role'),
      isActive: form.querySelector('[name="isActive"]').checked
    };

    try {
      const backendUrl = 'http://localhost:3000';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/admin/users/${this.editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        // Update local user data
        const userIndex = this.users.findIndex(u => u._id === this.editingUser._id);
        if (userIndex !== -1) {
          this.users[userIndex] = data.data;
        }
        this.closeEditModal();
      } else {
        console.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  async refresh() {
    const container = document.querySelector('.user-management');
    if (container) {
      container.innerHTML = await this.render();
      this.bindEvents();
    }
  }
}

export default UserManagement; 