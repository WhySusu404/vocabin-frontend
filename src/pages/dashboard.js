import apiService from '../services/api.js';
import { showToast } from '../utils/toast.js';

export class DashboardPage {
  constructor() {
    this.user = null;
  }

  async render() {
    try {
      // Get user profile from API
      const profileResponse = await apiService.getProfile();
      this.user = profileResponse.user;
    } catch (error) {
      showToast('Failed to load profile', 'danger');
      window.location.hash = '#auth';
      return '';
    }

    return `
      <div class="page-container">
        <div class="card">
          <div class="form-header">
            <h1>Welcome, ${this.user.firstName}! 👋</h1>
            <p>Your vocabulary learning journey starts here.</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
            <div class="card">
              <h3>📊 Your Statistics</h3>
              <div style="margin-top: 1rem;">
                <p><strong>Words Learned:</strong> ${this.user.statistics.totalWordsLearned}</p>
                <p><strong>Current Streak:</strong> ${this.user.statistics.currentStreak} days</p>
                <p><strong>Longest Streak:</strong> ${this.user.statistics.longestStreak} days</p>
                <p><strong>Total Study Time:</strong> ${this.user.statistics.totalStudyTime} minutes</p>
              </div>
            </div>
            
            <div class="card">
              <h3>⚙️ Learning Preferences</h3>
              <div style="margin-top: 1rem;">
                <p><strong>Difficulty:</strong> ${this.user.learningPreferences.difficulty}</p>
                <p><strong>Study Time:</strong> ${this.user.learningPreferences.studyTime} min/day</p>
                <p><strong>Reminders:</strong> ${this.user.learningPreferences.reminderEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
          
          <div class="card">
            <h3>🚧 Coming Soon</h3>
            <p>Vocabulary lessons, listening exercises, reading comprehension, and more features are being developed!</p>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
              <strong>Your Role:</strong> ${this.user.role}<br>
              <strong>Account Status:</strong> ${this.user.isActive ? 'Active' : 'Inactive'}<br>
              <strong>Member Since:</strong> ${new Date(this.user.registrationDate).toLocaleDateString()}
            </p>
          </div>
          
          <div class="form-actions">
            <sl-button
              variant="default"
              size="large"
              id="logout-btn"
            >
              Sign Out
            </sl-button>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    this.bindEvents();
  }

  bindEvents() {
    const logoutBtn = document.getElementById('logout-btn');
    
    logoutBtn?.addEventListener('click', async () => {
      try {
        await apiService.logout();
        showToast('Logged out successfully', 'success');
        window.location.hash = '#auth';
      } catch (error) {
        showToast('Logout failed', 'danger');
      }
    });
  }
}

export default DashboardPage; 