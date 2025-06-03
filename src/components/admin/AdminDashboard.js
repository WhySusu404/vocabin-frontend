/**
 * Admin Dashboard Component
 * Pure dashboard view with statistics and navigation
 */
class AdminDashboard {
  constructor() {
    this.stats = null;
  }

  async render() {
    return `
      <div class="admin-dashboard">
        <div class="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and management</p>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <sl-card class="action-card">
            <div slot="header">
              <sl-icon name="people"></sl-icon>
              <h3>User Management</h3>
            </div>
            <p>Manage user accounts, roles, and permissions</p>
            <sl-button variant="primary" onclick="window.location.hash = 'admin/users'">
              Manage Users
            </sl-button>
          </sl-card>

          <sl-card class="action-card">
            <div slot="header">
              <sl-icon name="book"></sl-icon>
              <h3>Dictionary Management</h3>
            </div>
            <p>Upload and manage dictionary files</p>
            <sl-button variant="primary" onclick="window.location.hash = 'admin/content'">
              Manage Dictionaries
            </sl-button>
          </sl-card>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          ${this.renderStatsCards()}
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <sl-card>
            <div slot="header">
              <h3>System Statistics</h3>
              <sl-button variant="default" size="small" id="refreshStatsBtn">
                <sl-icon name="arrow-clockwise"></sl-icon>
                Refresh
              </sl-button>
            </div>
            ${this.renderDetailedStats()}
          </sl-card>
        </div>
      </div>
    `;
  }

  renderStatsCards() {
    if (!this.stats) {
      return `
        <div class="loading-stats">
          <sl-spinner></sl-spinner>
          <p>Loading statistics...</p>
        </div>
      `;
    }

    return `
      <sl-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon users">
            <sl-icon name="people"></sl-icon>
          </div>
          <div class="stat-details">
            <h3>${this.stats.totalUsers}</h3>
            <p>Total Users</p>
            <small>${this.stats.activeUsers} active</small>
          </div>
        </div>
      </sl-card>

      <sl-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon dictionaries">
            <sl-icon name="book"></sl-icon>
          </div>
          <div class="stat-details">
            <h3>${this.stats.totalDictionaryFiles || 0}</h3>
            <p>Dictionaries</p>
            <small>${this.stats.recentDictionaries || 0} this week</small>
          </div>
        </div>
      </sl-card>

      <sl-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon progress">
            <sl-icon name="graph-up"></sl-icon>
          </div>
          <div class="stat-details">
            <h3>${this.stats.totalWordProgress}</h3>
            <p>Word Progress</p>
            <small>Learning records</small>
          </div>
        </div>
      </sl-card>

      <sl-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon new-users">
            <sl-icon name="person-plus"></sl-icon>
          </div>
          <div class="stat-details">
            <h3>${this.stats.recentUsers}</h3>
            <p>New Users</p>
            <small>This week</small>
          </div>
        </div>
      </sl-card>
    `;
  }

  renderDetailedStats() {
    if (!this.stats) {
      return '<p>Loading detailed statistics...</p>';
    }

    return `
      <div class="detailed-stats">
        <div class="stats-row">
          <div class="stat-item">
            <label>User Roles</label>
            <div class="stat-breakdown">
              <span class="stat-badge learners">${this.stats.learnerUsers} Learners</span>
              <span class="stat-badge admins">${this.stats.adminUsers} Admins</span>
            </div>
          </div>
          
          <div class="stat-item">
            <label>Content Statistics</label>
            <div class="stat-breakdown">
              <span class="stat-badge">${this.stats.totalDictionaries} Legacy Dicts</span>
              <span class="stat-badge">${this.stats.totalUserDictionaries} User Dicts</span>
              <span class="stat-badge">${this.stats.totalWrongWords} Wrong Words</span>
            </div>
          </div>
        </div>
        
        <div class="last-updated">
          <small>Last updated: ${new Date(this.stats.lastUpdated).toLocaleString()}</small>
        </div>
      </div>
    `;
  }

  async init() {
    await this.loadStats();
    this.bindEvents();
  }

  async loadStats() {
    try {
      const backendUrl = 'http://localhost:3000';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.stats = data.data;
        console.log('📊 Dashboard stats loaded:', this.stats);
      } else {
        console.error('Failed to load dashboard stats');
        // Provide fallback stats to prevent UI issues
        this.stats = {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          learnerUsers: 0,
          totalDictionaries: 0,
          totalDictionaryFiles: 0,
          totalWordProgress: 0,
          totalWrongWords: 0,
          totalUserDictionaries: 0,
          recentUsers: 0,
          recentDictionaries: 0,
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Provide fallback stats
      this.stats = {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        learnerUsers: 0,
        totalDictionaries: 0,
        totalDictionaryFiles: 0,
        totalWordProgress: 0,
        totalWrongWords: 0,
        totalUserDictionaries: 0,
        recentUsers: 0,
        recentDictionaries: 0,
        lastUpdated: new Date()
      };
    }
  }

  bindEvents() {
    // Refresh stats
    document.getElementById('refreshStatsBtn')?.addEventListener('click', () => this.refreshStats());
  }

  async refreshStats() {
    await this.loadStats();
    // Re-render the component
    const container = document.querySelector('.admin-dashboard');
    if (container) {
      container.innerHTML = await this.render();
      this.bindEvents();
    }
  }
}

export default AdminDashboard; 