import adminAuthService from '../../services/adminAuth.js';
import { showToast } from '../../utils/toast.js';

export default class ReportManagementPage {
  constructor() {
    this.name = 'ReportManagementPage';
    this.reports = [];
    this.filteredReports = [];
    this.currentFilters = {
      status: '',
      type: ''
    };
    this.selectedReport = null;
  }

  async render() {
    // Check admin authentication
    if (!adminAuthService.requireAdmin()) {
      return '<div>Redirecting to admin login...</div>';
    }

    try {
      // Load error reports
      const result = await adminAuthService.getErrorReports(this.currentFilters);
      this.reports = result.reports;
      this.filteredReports = result.reports;
    } catch (error) {
      console.error('Error loading reports:', error);
      this.reports = [];
      this.filteredReports = [];
    }

    return `
      <div class="admin-page">
        <div class="admin-header">
          <h1>Error Report Management</h1>
          <p>Review and manage user-submitted error reports.</p>
        </div>

        <div class="report-management-controls">
          <div class="filter-section">
            <div class="filter-group">
              <sl-select 
                id="status-filter" 
                placeholder="Filter by Status" 
                size="medium"
                clearable
              >
                <sl-option value="">All Status</sl-option>
                <sl-option value="pending">Pending</sl-option>
                <sl-option value="resolved">Resolved</sl-option>
                <sl-option value="invalid">Invalid</sl-option>
              </sl-select>
              
              <sl-select 
                id="type-filter" 
                placeholder="Filter by Type" 
                size="medium"
                clearable
              >
                <sl-option value="">All Types</sl-option>
                <sl-option value="spell_error">Spelling Error</sl-option>
                <sl-option value="content_error">Content Error</sl-option>
                <sl-option value="record_error">Recording Error</sl-option>
                <sl-option value="technical_error">Technical Error</sl-option>
              </sl-select>
            </div>
          </div>

          <div class="report-stats">
            <div class="stat-item pending">
              <span class="stat-number">${this.filteredReports.filter(r => r.status === 'pending').length}</span>
              <span class="stat-label">Pending</span>
            </div>
            <div class="stat-item resolved">
              <span class="stat-number">${this.filteredReports.filter(r => r.status === 'resolved').length}</span>
              <span class="stat-label">Resolved</span>
            </div>
            <div class="stat-item total">
              <span class="stat-number">${this.filteredReports.length}</span>
              <span class="stat-label">Total Reports</span>
            </div>
          </div>
        </div>

        <div class="reports-container">
          <div class="reports-header">
            <h3>Error Reports</h3>
            <div class="header-actions">
              <sl-button variant="primary" size="small" id="refresh-reports-btn">
                <sl-icon slot="prefix" name="arrow-clockwise"></sl-icon>
                Refresh
              </sl-button>
            </div>
          </div>

          <div class="reports-list">
            ${this.renderReports()}
          </div>
        </div>

        <!-- Report Detail Modal -->
        <sl-dialog id="report-detail-modal" label="Error Report Details" class="report-detail-modal">
          <div id="report-detail-content"></div>
          <div slot="footer">
            <sl-button variant="neutral" id="close-report-modal-btn">Close</sl-button>
            <sl-button variant="warning" id="mark-invalid-btn">Mark as Invalid</sl-button>
            <sl-button variant="success" id="resolve-report-btn">Resolve Report</sl-button>
          </div>
        </sl-dialog>

        <!-- Response Modal -->
        <sl-dialog id="response-modal" label="Respond to Report" class="response-modal">
          <div id="response-content">
            <div class="form-group">
              <label>Admin Response</label>
              <sl-textarea 
                id="admin-response-text"
                placeholder="Enter your response to this report..."
                rows="4"
                resize="vertical"
              ></sl-textarea>
            </div>
          </div>
          <div slot="footer">
            <sl-button variant="neutral" id="cancel-response-btn">Cancel</sl-button>
            <sl-button variant="primary" id="submit-response-btn">Submit Response</sl-button>
          </div>
        </sl-dialog>
      </div>
    `;
  }

  renderReports() {
    if (this.filteredReports.length === 0) {
      return `
        <div class="empty-state">
          <sl-icon name="inbox"></sl-icon>
          <h3>No Reports Found</h3>
          <p>No error reports match your current filters.</p>
        </div>
      `;
    }

    return this.filteredReports.map(report => `
      <div class="report-card ${report.status}" data-report-id="${report.id}">
        <div class="report-header">
          <div class="report-meta">
            <sl-badge 
              variant="${this.getStatusVariant(report.status)}" 
              pill
            >
              ${report.status.toUpperCase()}
            </sl-badge>
            <sl-badge variant="neutral" pill>
              ${this.formatReportType(report.reportType)}
            </sl-badge>
            <span class="report-date">${this.formatDate(report.dateReported)}</span>
          </div>
          <div class="report-actions">
            <sl-button 
              variant="neutral" 
              size="small"
              onclick="reportManagement.viewReport('${report.id}')"
            >
              <sl-icon name="eye"></sl-icon>
              View
            </sl-button>
            ${report.status === 'pending' ? `
              <sl-button 
                variant="primary" 
                size="small"
                onclick="reportManagement.respondToReport('${report.id}')"
              >
                <sl-icon name="chat-dots"></sl-icon>
                Respond
              </sl-button>
            ` : ''}
          </div>
        </div>

        <div class="report-content">
          <div class="report-user">
            <sl-icon name="person"></sl-icon>
            <span class="user-info">
              <strong>${report.userName}</strong> 
              <span class="user-email">(${report.userEmail})</span>
            </span>
          </div>

          <div class="report-description">
            <p>${report.description}</p>
          </div>

          ${report.relatedContent ? `
            <div class="related-content">
              <sl-icon name="link"></sl-icon>
              <span>Related: ${report.relatedContent}</span>
            </div>
          ` : ''}

          ${report.adminResponse ? `
            <div class="admin-response">
              <div class="response-header">
                <sl-icon name="shield-check"></sl-icon>
                <span>Admin Response:</span>
              </div>
              <div class="response-text">${report.adminResponse}</div>
              ${report.dateResolved ? `
                <div class="response-date">Resolved on ${this.formatDate(report.dateResolved)}</div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  getStatusVariant(status) {
    switch (status) {
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'invalid': return 'neutral';
      default: return 'neutral';
    }
  }

  formatReportType(type) {
    const typeMap = {
      'spell_error': 'Spelling Error',
      'content_error': 'Content Error',
      'record_error': 'Recording Error',
      'technical_error': 'Technical Error'
    };
    return typeMap[type] || type;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      if (hours < 1) return 'Just now';
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  }

  mount() {
    console.log('ReportManagement page mounted');
    this.bindEvents();
    this.updateActiveNavigation();
    
    // Make methods globally accessible for inline onclick handlers
    window.reportManagement = this;
  }

  bindEvents() {
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('sl-change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    // Type filter
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('sl-change', (e) => {
        this.currentFilters.type = e.target.value;
        this.applyFilters();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-reports-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshReports();
      });
    }

    // Modal close buttons
    const closeReportModalBtn = document.getElementById('close-report-modal-btn');
    if (closeReportModalBtn) {
      closeReportModalBtn.addEventListener('click', () => {
        document.getElementById('report-detail-modal').hide();
      });
    }

    const cancelResponseBtn = document.getElementById('cancel-response-btn');
    if (cancelResponseBtn) {
      cancelResponseBtn.addEventListener('click', () => {
        document.getElementById('response-modal').hide();
      });
    }

    // Action buttons
    const markInvalidBtn = document.getElementById('mark-invalid-btn');
    if (markInvalidBtn) {
      markInvalidBtn.addEventListener('click', () => {
        this.markReportInvalid();
      });
    }

    const resolveReportBtn = document.getElementById('resolve-report-btn');
    if (resolveReportBtn) {
      resolveReportBtn.addEventListener('click', () => {
        this.resolveReport();
      });
    }

    const submitResponseBtn = document.getElementById('submit-response-btn');
    if (submitResponseBtn) {
      submitResponseBtn.addEventListener('click', () => {
        this.submitResponse();
      });
    }
  }

  async applyFilters() {
    try {
      const result = await adminAuthService.getErrorReports(this.currentFilters);
      this.filteredReports = result.reports;
      
      // Re-render the reports
      const reportsList = document.querySelector('.reports-list');
      if (reportsList) {
        reportsList.innerHTML = this.renderReports();
      }
      
      // Update stats
      this.updateReportStats();
    } catch (error) {
      console.error('Error applying filters:', error);
      showToast('Error filtering reports', 'danger');
    }
  }

  updateReportStats() {
    const statNumbers = document.querySelectorAll('.report-stats .stat-number');
    if (statNumbers.length >= 3) {
      statNumbers[0].textContent = this.filteredReports.filter(r => r.status === 'pending').length;
      statNumbers[1].textContent = this.filteredReports.filter(r => r.status === 'resolved').length;
      statNumbers[2].textContent = this.filteredReports.length;
    }
  }

  async refreshReports() {
    try {
      const result = await adminAuthService.getErrorReports(this.currentFilters);
      this.reports = result.reports;
      this.filteredReports = result.reports;
      
      // Re-render the reports
      const reportsList = document.querySelector('.reports-list');
      if (reportsList) {
        reportsList.innerHTML = this.renderReports();
      }
      
      this.updateReportStats();
      showToast('Reports refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing reports:', error);
      showToast('Error refreshing reports', 'danger');
    }
  }

  viewReport(reportId) {
    const report = this.filteredReports.find(r => r.id === reportId);
    if (!report) return;

    this.selectedReport = report;
    const modal = document.getElementById('report-detail-modal');
    const content = document.getElementById('report-detail-content');
    
    content.innerHTML = `
      <div class="report-detail-view">
        <div class="detail-header">
          <div class="status-badges">
            <sl-badge variant="${this.getStatusVariant(report.status)}" pill>
              ${report.status.toUpperCase()}
            </sl-badge>
            <sl-badge variant="neutral" pill>
              ${this.formatReportType(report.reportType)}
            </sl-badge>
          </div>
          <div class="report-id">Report ID: ${report.id}</div>
        </div>

        <div class="detail-grid">
          <div class="detail-section">
            <h4>Reporter Information</h4>
            <div class="info-item">
              <label>Name:</label>
              <span>${report.userName}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>${report.userEmail}</span>
            </div>
            <div class="info-item">
              <label>User ID:</label>
              <span>${report.userId}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Report Information</h4>
            <div class="info-item">
              <label>Type:</label>
              <span>${this.formatReportType(report.reportType)}</span>
            </div>
            <div class="info-item">
              <label>Submitted:</label>
              <span>${new Date(report.dateReported).toLocaleString()}</span>
            </div>
            ${report.relatedContent ? `
              <div class="info-item">
                <label>Related Content:</label>
                <span>${report.relatedContent}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="detail-section full-width">
          <h4>Report Description</h4>
          <div class="description-content">
            ${report.description}
          </div>
        </div>

        ${report.adminResponse ? `
          <div class="detail-section full-width">
            <h4>Admin Response</h4>
            <div class="response-content">
              ${report.adminResponse}
            </div>
            ${report.dateResolved ? `
              <div class="resolved-date">
                Resolved on ${new Date(report.dateResolved).toLocaleString()}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    // Update modal footer buttons based on report status
    const markInvalidBtn = document.getElementById('mark-invalid-btn');
    const resolveReportBtn = document.getElementById('resolve-report-btn');
    
    if (report.status === 'pending') {
      markInvalidBtn.style.display = 'inline-block';
      resolveReportBtn.style.display = 'inline-block';
    } else {
      markInvalidBtn.style.display = 'none';
      resolveReportBtn.style.display = 'none';
    }
    
    modal.show();
  }

  respondToReport(reportId) {
    const report = this.filteredReports.find(r => r.id === reportId);
    if (!report) return;

    this.selectedReport = report;
    const modal = document.getElementById('response-modal');
    const textarea = document.getElementById('admin-response-text');
    
    // Clear previous response
    textarea.value = '';
    
    modal.show();
  }

  async markReportInvalid() {
    if (!this.selectedReport) return;

    try {
      // Simulate API call to mark report as invalid
      this.selectedReport.status = 'invalid';
      this.selectedReport.dateResolved = new Date();
      
      // Update the reports list
      this.refreshReportsDisplay();
      
      // Close modal
      document.getElementById('report-detail-modal').hide();
      
      showToast('Report marked as invalid', 'success');
    } catch (error) {
      console.error('Error marking report as invalid:', error);
      showToast('Error updating report status', 'danger');
    }
  }

  async resolveReport() {
    if (!this.selectedReport) return;

    // Check if there's a response
    const responseModal = document.getElementById('response-modal');
    responseModal.show();
  }

  async submitResponse() {
    if (!this.selectedReport) return;

    const responseText = document.getElementById('admin-response-text').value.trim();
    
    if (!responseText) {
      showToast('Please enter a response', 'warning');
      return;
    }

    try {
      // Simulate API call to resolve report with response
      this.selectedReport.status = 'resolved';
      this.selectedReport.adminResponse = responseText;
      this.selectedReport.dateResolved = new Date();
      
      // Update the reports list
      this.refreshReportsDisplay();
      
      // Close modals
      document.getElementById('response-modal').hide();
      document.getElementById('report-detail-modal').hide();
      
      showToast('Report resolved successfully', 'success');
    } catch (error) {
      console.error('Error resolving report:', error);
      showToast('Error resolving report', 'danger');
    }
  }

  refreshReportsDisplay() {
    // Re-render the reports
    const reportsList = document.querySelector('.reports-list');
    if (reportsList) {
      reportsList.innerHTML = this.renderReports();
    }
    
    this.updateReportStats();
  }

  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#admin/reports') {
        link.classList.add('active');
      }
    });
  }

  cleanup() {
    console.log('ReportManagement page cleanup');
    // Clean up global reference
    if (window.reportManagement === this) {
      delete window.reportManagement;
    }
  }
} 