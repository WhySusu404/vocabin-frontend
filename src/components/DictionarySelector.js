import VocabularyService from '../services/vocabularyService.js';

export default class DictionarySelector {
  constructor() {
    this.name = 'DictionarySelector';
    this.vocabularyService = new VocabularyService();
    this.dictionaries = [];
    this.userDictionaries = [];
    this.selectedCategory = 'all';
    this.selectedDifficulty = 'all';
    this.searchTerm = '';
    this.isLoading = false;
  }

  render() {
    return `
      <div class="dictionary-selector">
        ${this.renderHeader()}
        ${this.renderFilters()}
        ${this.renderContent()}
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="dictionary-header">
        <div class="header-content">
          <h1>📚 Choose Your Dictionary</h1>
          <p class="header-subtitle">Select a dictionary to start your vocabulary learning journey</p>
        </div>
        <div class="stats-overview" id="stats-overview">
          ${this.renderStatsOverview()}
        </div>
      </div>
    `;
  }

  renderStatsOverview() {
    if (this.userDictionaries.length === 0) {
      return `
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">0</span>
            <span class="stat-label">Dictionaries Started</span>
          </div>
        </div>
      `;
    }

    const stats = this.vocabularyService.calculateLearningStats(this.userDictionaries);
    
    return `
      <div class="stats-grid">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">${stats.totalWordsLearned}</span>
            <span class="stat-label">Words Learned</span>
          </div>
        </div>
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">${stats.completedDictionaries}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">${stats.overallAccuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
        </div>
      </div>
    `;
  }

  renderFilters() {
    return `
      <div class="dictionary-filters">
        <div class="filter-group">
          <label for="search-input">🔍 Search</label>
          <input 
            type="text" 
            id="search-input" 
            placeholder="Search dictionaries..." 
            value="${this.searchTerm}"
            class="search-input"
          />
        </div>
        
        <div class="filter-group">
          <label for="category-select">📂 Category</label>
          <select id="category-select" class="filter-select">
            <option value="all">All Categories</option>
            <option value="IELTS" ${this.selectedCategory === 'IELTS' ? 'selected' : ''}>IELTS</option>
            <option value="TOEFL" ${this.selectedCategory === 'TOEFL' ? 'selected' : ''}>TOEFL</option>
            <option value="GRE" ${this.selectedCategory === 'GRE' ? 'selected' : ''}>GRE</option>
            <option value="CET" ${this.selectedCategory === 'CET' ? 'selected' : ''}>CET</option>
            <option value="General" ${this.selectedCategory === 'General' ? 'selected' : ''}>General</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="difficulty-select">⭐ Difficulty</label>
          <select id="difficulty-select" class="filter-select">
            <option value="all">All Levels</option>
            <option value="beginner" ${this.selectedDifficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
            <option value="intermediate" ${this.selectedDifficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
            <option value="advanced" ${this.selectedDifficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
            <option value="expert" ${this.selectedDifficulty === 'expert' ? 'selected' : ''}>Expert</option>
          </select>
        </div>
        
        <button class="refresh-btn" id="refresh-btn" title="Refresh dictionaries">
          🔄 Refresh
        </button>
      </div>
    `;
  }

  renderContent() {
    if (this.isLoading) {
      return `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading dictionaries...</p>
        </div>
      `;
    }

    const filteredDictionaries = this.getFilteredDictionaries();
    const categoryGroups = this.vocabularyService.formatDictionaryCategories(filteredDictionaries);

    if (filteredDictionaries.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No dictionaries found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      `;
    }

    return `
      <div class="dictionary-grid" id="dictionary-grid">
        ${Object.entries(categoryGroups).map(([category, dicts]) => this.renderCategoryGroup(category, dicts)).join('')}
      </div>
    `;
  }

  renderCategoryGroup(category, dictionaries) {
    return `
      <div class="category-group">
        <h3 class="category-title">${category}</h3>
        <div class="category-dictionaries">
          ${dictionaries.map(dict => this.renderDictionaryCard(dict)).join('')}
        </div>
      </div>
    `;
  }

  renderDictionaryCard(dictionary) {
    const userProgress = this.getUserProgress(dictionary.id || dictionary._id);
    const difficultyColor = this.getDifficultyColor(dictionary.difficulty_level);
    const estimatedTime = dictionary.estimated_study_time || this.estimateStudyTime(dictionary.total_words);

    return `
      <div class="dictionary-card" data-dictionary-id="${dictionary.id || dictionary._id}">
        <div class="card-header">
          <div class="dictionary-info">
            <h4 class="dictionary-title">${dictionary.display_name || dictionary.name}</h4>
            <p class="dictionary-description">${dictionary.description || 'Comprehensive vocabulary collection'}</p>
          </div>
          <div class="difficulty-badge" style="background-color: ${difficultyColor}">
            ${dictionary.difficulty_level || 'intermediate'}
          </div>
        </div>
        
        <div class="card-stats">
          <div class="stat-row">
            <span class="stat-icon">📝</span>
            <span class="stat-text">${dictionary.total_words} words</span>
          </div>
          <div class="stat-row">
            <span class="stat-icon">⏱️</span>
            <span class="stat-text">${estimatedTime}</span>
          </div>
          <div class="stat-row">
            <span class="stat-icon">🎯</span>
            <span class="stat-text">${dictionary.category}</span>
          </div>
        </div>

        ${userProgress ? this.renderProgressBar(userProgress) : ''}
        
        <div class="card-actions">
          ${this.renderActionButton(dictionary, userProgress)}
          <button class="preview-btn" data-action="preview" data-dictionary-id="${dictionary.id || dictionary._id}">
            👁️ Preview
          </button>
        </div>
      </div>
    `;
  }

  renderProgressBar(progress) {
    const percentage = progress.completion_percentage || 0;
    const status = progress.status || 'not_started';
    
    let statusText = 'Not Started';
    let statusColor = '#9ca3af';
    
    if (status === 'in_progress') {
      statusText = 'In Progress';
      statusColor = '#3b82f6';
    } else if (status === 'completed') {
      statusText = 'Completed';
      statusColor = '#10b981';
    }

    return `
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-status" style="color: ${statusColor}">${statusText}</span>
          <span class="progress-percentage">${percentage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%; background-color: ${statusColor}"></div>
        </div>
        <div class="progress-details">
          <span class="words-completed">${progress.completed_words || 0} words completed</span>
          <span class="accuracy">Accuracy: ${progress.accuracy_rate || 0}%</span>
        </div>
      </div>
    `;
  }

  renderActionButton(dictionary, progress) {
    const dictionaryId = dictionary.id || dictionary._id;
    
    // Check if user has any progress data (indicating they're authenticated)
    const hasUserData = this.userDictionaries.length > 0 || progress;
    
    if (!progress) {
      return `
        <button class="start-btn primary-btn" data-action="start" data-dictionary-id="${dictionaryId}">
          ${hasUserData ? '🚀 Start Learning' : '🔐 Login to Start'}
        </button>
      `;
    }

    if (progress.status === 'completed') {
      return `
        <button class="review-btn secondary-btn" data-action="review" data-dictionary-id="${dictionaryId}">
          🔄 Review
        </button>
      `;
    }

    return `
      <button class="continue-btn primary-btn" data-action="continue" data-dictionary-id="${dictionaryId}">
        ▶️ Continue
      </button>
    `;
  }

  getUserProgress(dictionaryId) {
    return this.userDictionaries.find(userDict => 
      (userDict.dictionary && userDict.dictionary.id === dictionaryId) ||
      (userDict.progress && userDict.progress.dictionary_id === dictionaryId)
    )?.progress;
  }

  getDifficultyColor(difficulty) {
    const colors = {
      'beginner': '#10b981',
      'intermediate': '#3b82f6', 
      'advanced': '#f59e0b',
      'expert': '#ef4444'
    };
    return colors[difficulty] || colors['intermediate'];
  }

  estimateStudyTime(totalWords) {
    if (!totalWords) return 'Unknown';
    
    // Estimate based on average learning speed (words per hour)
    const wordsPerHour = 50;
    const totalHours = Math.ceil(totalWords / wordsPerHour);
    
    if (totalHours < 1) return '< 1 hour';
    if (totalHours < 24) return `${totalHours} hours`;
    
    const days = Math.ceil(totalHours / 24);
    return `${days} days`;
  }

  getFilteredDictionaries() {
    let filtered = [...this.dictionaries];

    // Filter by search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dict => 
        (dict.display_name || dict.name).toLowerCase().includes(searchLower) ||
        (dict.description || '').toLowerCase().includes(searchLower) ||
        dict.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(dict => dict.category === this.selectedCategory);
    }

    // Filter by difficulty
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(dict => dict.difficulty_level === this.selectedDifficulty);
    }

    return filtered;
  }

  async mount() {
    await this.loadData();
    this.bindEvents();
  }

  async loadData() {
    this.isLoading = true;
    this.updateContent();

    try {
      // Always load dictionaries
      const dictionariesResponse = await this.vocabularyService.getDictionaries();
      this.dictionaries = dictionariesResponse.dictionaries || [];
      
      // Check if user is authenticated before loading user progress
      const { default: apiService } = await import('../services/api.js');
      const isAuthenticated = await apiService.isAuthenticatedAsync();
      
      if (isAuthenticated) {
        // Load user progress only if authenticated
        try {
          const userProgressResponse = await this.vocabularyService.getUserDictionaries();
          this.userDictionaries = userProgressResponse.dictionaries || [];
          console.log('✅ Loaded user progress:', this.userDictionaries.length);
        } catch (error) {
          console.warn('⚠️ Failed to load user progress (ignoring):', error.message);
          this.userDictionaries = [];
        }
      } else {
        console.log('ℹ️ User not authenticated, skipping progress data');
        this.userDictionaries = [];
      }
      
      console.log('✅ Loaded dictionaries:', this.dictionaries.length);
      
    } catch (error) {
      console.error('❌ Failed to load dictionary data:', error);
      this.showErrorMessage('Failed to load dictionaries. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateContent();
    }
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.updateContent();
    });

    // Category filter
    const categorySelect = document.getElementById('category-select');
    categorySelect?.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.updateContent();
    });

    // Difficulty filter
    const difficultySelect = document.getElementById('difficulty-select');
    difficultySelect?.addEventListener('change', (e) => {
      this.selectedDifficulty = e.target.value;
      this.updateContent();
    });

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', () => {
      this.loadData();
    });

    // Dictionary actions (delegated event handling)
    const dictionaryGrid = document.getElementById('dictionary-grid');
    dictionaryGrid?.addEventListener('click', (e) => {
      const target = e.target;
      const action = target.dataset.action;
      const dictionaryId = target.dataset.dictionaryId;

      if (action && dictionaryId) {
        this.handleDictionaryAction(action, dictionaryId);
      }
    });
  }

  async handleDictionaryAction(action, dictionaryId) {
    try {
      switch (action) {
        case 'start':
        case 'continue':
          await this.startDictionary(dictionaryId);
          break;
        case 'preview':
          this.previewDictionary(dictionaryId);
          break;
        case 'review':
          this.reviewDictionary(dictionaryId);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling dictionary action:', error);
      this.showErrorMessage(`Failed to ${action} dictionary. Please try again.`);
    }
  }

  async startDictionary(dictionaryId) {
    // Get button reference and original text first
    const button = document.querySelector(`[data-action][data-dictionary-id="${dictionaryId}"]`);
    const originalText = button ? button.textContent : 'Start Learning';
    
    try {
      // Check if user is authenticated
      const { default: apiService } = await import('../services/api.js');
      const isAuthenticated = await apiService.isAuthenticatedAsync();
      
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        this.showErrorMessage('Please log in to start learning.');
        setTimeout(() => {
          window.location.hash = 'auth';
        }, 1500);
        return;
      }
      
      // Show loading state
      if (button) {
        button.textContent = '⏳ Starting...';
        button.disabled = true;
      }

      // Start the dictionary
      const response = await this.vocabularyService.startDictionary(dictionaryId);
      
      console.log('✅ Dictionary started:', response);
      
      // Navigate to vocabulary page with dictionary ID
      window.location.hash = `vocabulary?dictionaryId=${dictionaryId}`;
      
    } catch (error) {
      // Restore button state on error
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
      throw error;
    }
  }

  previewDictionary(dictionaryId) {
    if (window.app && window.app.navigateTo) {
      window.app.navigateTo('dictionary-preview', { dictionaryId });
    } else {
      console.log('Preview dictionary:', dictionaryId);
      // Could open a modal or navigate to preview page
    }
  }

  reviewDictionary(dictionaryId) {
    if (window.app && window.app.navigateTo) {
      window.app.navigateTo('wrong-words-review', { dictionaryId });
    } else {
      console.log('Review dictionary:', dictionaryId);
    }
  }

  updateContent() {
    const container = document.querySelector('.dictionary-selector');
    if (container) {
      container.innerHTML = this.render();
      // Re-bind events after content update
      this.bindEvents();
    }
  }

  showErrorMessage(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
        <button class="error-close">×</button>
      </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);

    // Close button
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
      errorDiv.remove();
    });
  }

  cleanup() {
    // Clean up any timers or event listeners if needed
    console.log('DictionarySelector cleanup');
  }
} 