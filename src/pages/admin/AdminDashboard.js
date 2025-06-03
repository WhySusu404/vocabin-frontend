import adminAuthService from '../../services/adminAuth.js';
import router from '../../utils/router.js';

export default class AdminDashboardPage {
  constructor() {
    this.name = 'AdminDashboardPage';
    this.stats = null;
  }

  async render() {
    // Check admin authentication
    if (!adminAuthService.requireAdmin()) {
      return '<div>Redirecting to admin login...</div>';
    }

    try {
      // Load dashboard statistics
      this.stats = await adminAuthService.getDashboardStats();
    } catch (error) {
      console.error('Error loading admin stats:', error);
      this.stats = this.getDefaultStats();
    }

    const adminUser = adminAuthService.getCurrentAdmin();

    return `
      <div class="admin-page">
        <div class="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, ${adminUser?.firstName || 'Admin'}! Here's your system overview.</p>
        </div>
        
        <div class="stats-grid">
          ${this.renderMetricCard('Total Users', this.stats.totalUsers, 'person', 'primary')}
          ${this.renderMetricCard('Active Users', this.stats.activeUsers, 'people', 'success')}
          ${this.renderMetricCard('Word Lists', this.stats.totalWordLists, 'collection', 'info')}
          ${this.renderMetricCard('Listening Materials', this.stats.totalListeningMaterials, 'soundwave', 'warning')}
          ${this.renderMetricCard('Reading Materials', this.stats.totalReadingMaterials, 'book', 'secondary')}
        </div>

        <div class="admin-content-grid">
          <div class="card">
            <h2>System Health</h2>
            <div class="system-health">
              <div class="health-item">
                <span class="health-label">System Uptime</span>
                <span class="health-value success">${this.stats.systemUptime}</span>
              </div>
              <div class="health-item">
                <span class="health-label">Storage Used</span>
                <span class="health-value">${this.stats.storageUsed} / ${this.stats.storageLimit}</span>
              </div>
              <div class="health-item">
                <span class="health-label">Active Sessions</span>
                <span class="health-value">${this.stats.activeUsers}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Recent Activity</h2>
            <div class="activity-list">
              <div class="activity-item">
                <sl-icon name="person-plus"></sl-icon>
                <div class="activity-content">
                  <div class="activity-title">New user registered</div>
                  <div class="activity-time">2 hours ago</div>
                </div>
              </div>
              <div class="activity-item">
                <sl-icon name="file-text"></sl-icon>
                <div class="activity-content">
                  <div class="activity-title">Error report submitted</div>
                  <div class="activity-time">4 hours ago</div>
                </div>
              </div>
              <div class="activity-item">
                <sl-icon name="upload"></sl-icon>
                <div class="activity-content">
                  <div class="activity-title">New content uploaded</div>
                  <div class="activity-time">1 day ago</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Quick Actions</h2>
            <div class="quick-actions">
              <sl-button 
                variant="primary" 
                size="medium"
                onclick="window.location.hash = '#admin/users'"
              >
                <sl-icon slot="prefix" name="people"></sl-icon>
                Manage Users
              </sl-button>
              
              <sl-button 
                variant="neutral" 
                size="medium"
                onclick="window.location.hash = '#admin/content'"
              >
                <sl-icon slot="prefix" name="folder"></sl-icon>
                Manage Content
              </sl-button>
              
             
            </div>
          </div>

          <div class="card">
            <h2>Learning Analytics</h2>
            <div class="analytics-summary">
              <div class="analytics-item">
                <div class="analytics-number">${this.stats.totalWordLists}</div>
                <div class="analytics-label">Total Word Lists</div>
              </div>
              <div class="analytics-item">
                <div class="analytics-number">${this.stats.totalListeningMaterials + this.stats.totalReadingMaterials}</div>
                <div class="analytics-label">Learning Materials</div>
              </div>
              <div class="analytics-item">
                <div class="analytics-number">${this.stats.resolvedReports}</div>
                <div class="analytics-label">Reports Resolved</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Admin Management Tools</h2>
          <p>This admin dashboard provides comprehensive tools for managing the VocaBin platform:</p>
          
          <div class="management-tools">
            <div class="tool-section">
              <h3>User Management</h3>
              <ul>
                <li>View and search all registered users</li>
                <li>Activate or deactivate user accounts</li>
                <li>View user learning statistics</li>
                <li>Edit user information</li>
              </ul>
            </div>
            
            <div class="tool-section">
              <h3>Content Management</h3>
              <ul>
                <li>Upload and manage vocabulary lists</li>
                <li>Add listening materials with audio files</li>
                <li>Create reading materials and exercises</li>
                <li>Monitor content usage analytics</li>
              </ul>
            </div>
            
            <div class="tool-section">
              <h3>Error Report Management</h3>
              <ul>
                <li>Review user-submitted error reports</li>
                <li>Respond to user concerns</li>
                <li>Track resolution status</li>
                <li>Identify system improvement areas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderMetricCard(title, value, icon, variant = 'neutral') {
    return `
      <div class="stat-card ${variant}">
        <div class="stat-icon">
          <sl-icon name="${icon}"></sl-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">${value}</div>
          <div class="stat-label">${title}</div>
        </div>
      </div>
    `;
  }

  getDefaultStats() {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalWordLists: 0,
      totalListeningMaterials: 0,
      totalReadingMaterials: 0,
      pendingReports: 0,
      resolvedReports: 0,
      systemUptime: '0%',
      storageUsed: '0 GB',
      storageLimit: '10 GB'
    };
  }

  mount() {
    console.log('AdminDashboard page mounted');
    // Add any additional functionality here
    // Navigation highlighting is now handled centrally by app.js
  }

  cleanup() {
    console.log('AdminDashboard page cleanup');
  }
} 