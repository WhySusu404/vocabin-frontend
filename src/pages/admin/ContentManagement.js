import adminAuthService from '../../services/adminAuth.js';
import { showToast } from '../../utils/toast.js';

export default class ContentManagementPage {
  constructor() {
    this.name = 'ContentManagementPage';
    this.activeTab = 'vocabulary';
    this.contentData = {
      vocabulary: [],
      listening: [],
      reading: []
    };
  }

  async render() {
    // Check admin authentication
    if (!adminAuthService.requireAdmin()) {
      return '<div>Redirecting to admin login...</div>';
    }

    // Load content data
    await this.loadContentData();

    return `
      <div class="admin-page">
        <div class="admin-header">
          <h1>Content Management</h1>
          <p>Manage vocabulary lists, listening materials, and reading content.</p>
        </div>

        <div class="content-management-tabs">
          <div class="tab-nav">
            <button 
              class="tab-button ${this.activeTab === 'vocabulary' ? 'active' : ''}"
              onclick="contentManagement.switchTab('vocabulary')"
            >
              <sl-icon name="collection"></sl-icon>
              Vocabulary Lists
            </button>
            <button 
              class="tab-button ${this.activeTab === 'listening' ? 'active' : ''}"
              onclick="contentManagement.switchTab('listening')"
            >
              <sl-icon name="soundwave"></sl-icon>
              Listening Materials
            </button>
            <button 
              class="tab-button ${this.activeTab === 'reading' ? 'active' : ''}"
              onclick="contentManagement.switchTab('reading')"
            >
              <sl-icon name="book"></sl-icon>
              Reading Materials
            </button>
          </div>

          <div class="tab-content">
            ${this.renderTabContent()}
          </div>
        </div>

        <!-- Add Content Modal -->
        <sl-dialog id="add-content-modal" label="Add New Content" class="add-content-modal">
          <div id="add-content-form"></div>
          <div slot="footer">
            <sl-button variant="neutral" id="cancel-add-btn">Cancel</sl-button>
            <sl-button variant="primary" id="save-content-btn">Save Content</sl-button>
          </div>
        </sl-dialog>

        <!-- Edit Content Modal -->
        <sl-dialog id="edit-content-modal" label="Edit Content" class="edit-content-modal">
          <div id="edit-content-form"></div>
          <div slot="footer">
            <sl-button variant="neutral" id="cancel-edit-content-btn">Cancel</sl-button>
            <sl-button variant="primary" id="update-content-btn">Update Content</sl-button>
          </div>
        </sl-dialog>
      </div>
    `;
  }

  renderTabContent() {
    const data = this.contentData[this.activeTab];
    
    return `
      <div class="tab-panel active" data-tab="${this.activeTab}">
        <div class="content-header">
          <div class="content-stats">
            <div class="stat-item">
              <span class="stat-number">${data.length}</span>
              <span class="stat-label">Total Items</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${data.filter(item => item.isPublic).length}</span>
              <span class="stat-label">Public</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${data.filter(item => !item.isPublic).length}</span>
              <span class="stat-label">Private</span>
            </div>
          </div>
          
          <div class="content-actions">
            <sl-button 
              variant="primary" 
              size="medium"
              onclick="contentManagement.addContent()"
            >
              <sl-icon slot="prefix" name="plus"></sl-icon>
              Add ${this.getContentTypeName()}
            </sl-button>
          </div>
        </div>

        <div class="content-list">
          ${this.renderContentItems(data)}
        </div>
      </div>
    `;
  }

  renderContentItems(data) {
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <sl-icon name="folder-x"></sl-icon>
          <h3>No ${this.getContentTypeName()} Found</h3>
          <p>Click "Add ${this.getContentTypeName()}" to create your first item.</p>
        </div>
      `;
    }

    return data.map(item => `
      <div class="content-item" data-id="${item.id}">
        <div class="content-item-header">
          <div class="content-title">
            <h4>${item.title}</h4>
            <div class="content-meta">
              <sl-badge variant="${item.isPublic ? 'success' : 'neutral'}" pill>
                ${item.isPublic ? 'Public' : 'Private'}
              </sl-badge>
              <sl-badge variant="neutral" pill>
                ${item.difficulty || 'No Difficulty'}
              </sl-badge>
              <span class="content-date">Created ${this.formatDate(item.createdDate)}</span>
            </div>
          </div>
          
          <div class="content-actions">
            <sl-button 
              variant="neutral" 
              size="small"
              onclick="contentManagement.viewContent('${item.id}')"
            >
              <sl-icon name="eye"></sl-icon>
            </sl-button>
            <sl-button 
              variant="neutral" 
              size="small"
              onclick="contentManagement.editContent('${item.id}')"
            >
              <sl-icon name="pencil"></sl-icon>
            </sl-button>
            <sl-button 
              variant="danger" 
              size="small"
              onclick="contentManagement.deleteContent('${item.id}')"
            >
              <sl-icon name="trash"></sl-icon>
            </sl-button>
          </div>
        </div>

        <div class="content-description">
          <p>${item.description || 'No description available.'}</p>
        </div>

        <div class="content-details">
          ${this.renderContentDetails(item)}
        </div>
      </div>
    `).join('');
  }

  renderContentDetails(item) {
    switch (this.activeTab) {
      case 'vocabulary':
        return `
          <div class="detail-item">
            <span class="detail-label">Words:</span>
            <span class="detail-value">${item.wordCount || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${item.category || 'General'}</span>
          </div>
        `;
      case 'listening':
        return `
          <div class="detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${this.formatDuration(item.duration)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Audio File:</span>
            <span class="detail-value">${item.audioFile ? 'Available' : 'Missing'}</span>
          </div>
        `;
      case 'reading':
        return `
          <div class="detail-item">
            <span class="detail-label">Word Count:</span>
            <span class="detail-value">${item.wordCount || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Exercises:</span>
            <span class="detail-value">${item.exerciseCount || 0}</span>
          </div>
        `;
      default:
        return '';
    }
  }

  getContentTypeName() {
    const typeNames = {
      vocabulary: 'Vocabulary List',
      listening: 'Listening Material',
      reading: 'Reading Material'
    };
    return typeNames[this.activeTab] || 'Content';
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async loadContentData() {
    // Mock content data - replace with real API calls
    this.contentData = {
      vocabulary: [
        {
          id: '1',
          title: 'IELTS Academic Vocabulary',
          description: 'Essential vocabulary for IELTS academic module.',
          isPublic: true,
          difficulty: 'intermediate',
          createdDate: '2024-01-15',
          wordCount: 150,
          category: 'Academic'
        },
        {
          id: '2',
          title: 'Business English Terms',
          description: 'Common business terminology and phrases.',
          isPublic: true,
          difficulty: 'advanced',
          createdDate: '2024-01-10',
          wordCount: 200,
          category: 'Business'
        }
      ],
      listening: [
        {
          id: '1',
          title: 'BBC News Daily',
          description: 'Daily news broadcasts for listening practice.',
          isPublic: true,
          difficulty: 'intermediate',
          createdDate: '2024-01-20',
          duration: 180,
          audioFile: 'bbc_news_daily.mp3'
        },
        {
          id: '2',
          title: 'English Conversations',
          description: 'Natural conversations between native speakers.',
          isPublic: true,
          difficulty: 'beginner',
          createdDate: '2024-01-18',
          duration: 240,
          audioFile: 'conversations.mp3'
        }
      ],
      reading: [
        {
          id: '1',
          title: 'Science Articles Collection',
          description: 'Scientific articles with comprehension exercises.',
          isPublic: true,
          difficulty: 'advanced',
          createdDate: '2024-01-12',
          wordCount: 1500,
          exerciseCount: 8
        },
        {
          id: '2',
          title: 'Short Stories for Beginners',
          description: 'Simple stories with vocabulary exercises.',
          isPublic: true,
          difficulty: 'beginner',
          createdDate: '2024-01-08',
          wordCount: 800,
          exerciseCount: 5
        }
      ]
    };
  }

  mount() {
    console.log('ContentManagement page mounted');
    this.updateActiveNavigation();
    
    // Make methods globally accessible for inline onclick handlers
    window.contentManagement = this;
    
    this.bindEvents();
  }

  bindEvents() {
    // Modal close buttons
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    if (cancelAddBtn) {
      cancelAddBtn.addEventListener('click', () => {
        document.getElementById('add-content-modal').hide();
      });
    }

    const cancelEditBtn = document.getElementById('cancel-edit-content-btn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.getElementById('edit-content-modal').hide();
      });
    }

    // Save buttons
    const saveContentBtn = document.getElementById('save-content-btn');
    if (saveContentBtn) {
      saveContentBtn.addEventListener('click', () => {
        this.saveNewContent();
      });
    }

    const updateContentBtn = document.getElementById('update-content-btn');
    if (updateContentBtn) {
      updateContentBtn.addEventListener('click', () => {
        this.updateContent();
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Re-render the tab content
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.innerHTML = this.renderTabContent();
    }
    
    // Update active tab button
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[onclick="contentManagement.switchTab('${tabName}')"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  addContent() {
    const modal = document.getElementById('add-content-modal');
    const form = document.getElementById('add-content-form');
    
    modal.label = `Add New ${this.getContentTypeName()}`;
    
    form.innerHTML = this.renderContentForm();
    modal.show();
  }

  editContent(contentId) {
    const content = this.contentData[this.activeTab].find(item => item.id === contentId);
    if (!content) return;

    const modal = document.getElementById('edit-content-modal');
    const form = document.getElementById('edit-content-form');
    
    modal.label = `Edit ${this.getContentTypeName()}`;
    
    form.innerHTML = this.renderContentForm(content);
    modal.show();
  }

  renderContentForm(content = null) {
    const isEdit = content !== null;
    
    const baseFields = `
      <div class="form-group">
        <label>Title *</label>
        <sl-input 
          id="content-title" 
          value="${content?.title || ''}" 
          placeholder="Enter title"
          required
        ></sl-input>
      </div>
      
      <div class="form-group">
        <label>Description</label>
        <sl-textarea 
          id="content-description" 
          value="${content?.description || ''}"
          placeholder="Enter description"
          rows="3"
        ></sl-textarea>
      </div>
      
      <div class="form-group">
        <label>Difficulty Level</label>
        <sl-select id="content-difficulty" value="${content?.difficulty || ''}">
          <sl-option value="beginner">Beginner</sl-option>
          <sl-option value="intermediate">Intermediate</sl-option>
          <sl-option value="advanced">Advanced</sl-option>
        </sl-select>
      </div>
      
      <div class="form-group">
        <sl-checkbox id="content-public" ${content?.isPublic ? 'checked' : ''}>
          Make this content public
        </sl-checkbox>
      </div>
    `;

    // Add type-specific fields
    let typeSpecificFields = '';
    
    switch (this.activeTab) {
      case 'vocabulary':
        typeSpecificFields = `
          <div class="form-group">
            <label>Category</label>
            <sl-input 
              id="vocabulary-category" 
              value="${content?.category || ''}"
              placeholder="e.g., Academic, Business, General"
            ></sl-input>
          </div>
          
          <div class="form-group">
            <label>Words (one per line)</label>
            <sl-textarea 
              id="vocabulary-words"
              placeholder="word1:definition1&#10;word2:definition2"
              rows="8"
            ></sl-textarea>
          </div>
        `;
        break;
        
      case 'listening':
        typeSpecificFields = `
          <div class="form-group">
            <label>Audio File</label>
            <sl-input 
              id="listening-audio-file" 
              type="file" 
              accept="audio/*"
            ></sl-input>
          </div>
          
          <div class="form-group">
            <label>Transcript</label>
            <sl-textarea 
              id="listening-transcript"
              value="${content?.transcript || ''}"
              placeholder="Enter the audio transcript"
              rows="6"
            ></sl-textarea>
          </div>
        `;
        break;
        
      case 'reading':
        typeSpecificFields = `
          <div class="form-group">
            <label>Reading Content</label>
            <sl-textarea 
              id="reading-content"
              placeholder="Enter the reading material content"
              rows="8"
            ></sl-textarea>
          </div>
          
          <div class="form-group">
            <label>Comprehension Questions (one per line)</label>
            <sl-textarea 
              id="reading-questions"
              placeholder="Question 1?&#10;Question 2?"
              rows="5"
            ></sl-textarea>
          </div>
        `;
        break;
    }

    return baseFields + typeSpecificFields;
  }

  async saveNewContent() {
    try {
      const formData = this.getFormData();
      
      if (!formData.title.trim()) {
        showToast('Title is required', 'warning');
        return;
      }

      // Generate new ID
      const newId = (this.contentData[this.activeTab].length + 1).toString();
      
      const newContent = {
        id: newId,
        ...formData,
        createdDate: new Date().toISOString().split('T')[0]
      };

      // Add type-specific properties
      switch (this.activeTab) {
        case 'vocabulary':
          newContent.wordCount = formData.words?.split('\n').filter(w => w.trim()).length || 0;
          break;
        case 'listening':
          newContent.duration = 0; // Would be calculated from audio file
          break;
        case 'reading':
          newContent.wordCount = formData.content?.split(' ').length || 0;
          newContent.exerciseCount = formData.questions?.split('\n').filter(q => q.trim()).length || 0;
          break;
      }

      // Add to data
      this.contentData[this.activeTab].push(newContent);
      
      // Re-render content
      this.refreshContentDisplay();
      
      // Close modal
      document.getElementById('add-content-modal').hide();
      
      showToast(`${this.getContentTypeName()} created successfully`, 'success');
    } catch (error) {
      console.error('Error saving content:', error);
      showToast('Error saving content', 'danger');
    }
  }

  async updateContent() {
    try {
      const formData = this.getFormData();
      
      if (!formData.title.trim()) {
        showToast('Title is required', 'warning');
        return;
      }

      // Update content logic would go here
      showToast(`${this.getContentTypeName()} updated successfully`, 'success');
      
      // Close modal
      document.getElementById('edit-content-modal').hide();
      
      // Refresh display
      this.refreshContentDisplay();
    } catch (error) {
      console.error('Error updating content:', error);
      showToast('Error updating content', 'danger');
    }
  }

  getFormData() {
    const title = document.getElementById('content-title')?.value || '';
    const description = document.getElementById('content-description')?.value || '';
    const difficulty = document.getElementById('content-difficulty')?.value || '';
    const isPublic = document.getElementById('content-public')?.checked || false;

    const formData = { title, description, difficulty, isPublic };

    // Add type-specific data
    switch (this.activeTab) {
      case 'vocabulary':
        formData.category = document.getElementById('vocabulary-category')?.value || '';
        formData.words = document.getElementById('vocabulary-words')?.value || '';
        break;
      case 'listening':
        formData.transcript = document.getElementById('listening-transcript')?.value || '';
        // Audio file would be handled here
        break;
      case 'reading':
        formData.content = document.getElementById('reading-content')?.value || '';
        formData.questions = document.getElementById('reading-questions')?.value || '';
        break;
    }

    return formData;
  }

  viewContent(contentId) {
    const content = this.contentData[this.activeTab].find(item => item.id === contentId);
    if (!content) return;

    // For now, just show an alert with content info
    showToast(`Viewing: ${content.title}`, 'primary');
  }

  async deleteContent(contentId) {
    const content = this.contentData[this.activeTab].find(item => item.id === contentId);
    if (!content) return;

    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      try {
        // Remove from data
        this.contentData[this.activeTab] = this.contentData[this.activeTab].filter(item => item.id !== contentId);
        
        // Refresh display
        this.refreshContentDisplay();
        
        showToast(`${this.getContentTypeName()} deleted successfully`, 'success');
      } catch (error) {
        console.error('Error deleting content:', error);
        showToast('Error deleting content', 'danger');
      }
    }
  }

  refreshContentDisplay() {
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.innerHTML = this.renderTabContent();
    }
  }

  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#admin/content') {
        link.classList.add('active');
      }
    });
  }

  cleanup() {
    console.log('ContentManagement page cleanup');
    // Clean up global reference
    if (window.contentManagement === this) {
      delete window.contentManagement;
    }
  }
} 