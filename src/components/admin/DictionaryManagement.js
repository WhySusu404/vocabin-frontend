/**
 * Admin Dictionary Management Component
 * Interface for uploading and managing dictionary files
 */
class DictionaryManagement {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.searchTerm = '';
    this.statusFilter = '';
    this.difficultyFilter = '';
    this.dictionaries = [];
    this.totalPages = 1;
    this.uploadMode = false;
    this.previewData = null;
  }

  async render() {
    return `
      <div class="dictionary-management">
        <div class="page-header">
          <h2>Dictionary Management</h2>
          <p>Upload and manage dictionary files</p>
          <sl-button variant="primary" id="showUploadBtn">
            <sl-icon name="cloud-upload"></sl-icon>
            Upload Dictionary
          </sl-button>
        </div>

        ${this.uploadMode ? this.renderUploadSection() : ''}

        <!-- Filters -->
        <div class="filters-section">
          <div class="filters-row">
            <sl-input 
              placeholder="Search dictionaries..." 
              value="${this.searchTerm}"
              class="search-input"
              id="dictSearch">
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
            
            <sl-select 
              placeholder="Difficulty" 
              value="${this.difficultyFilter}"
              class="filter-select"
              id="difficultyFilter">
              <sl-option value="">All Difficulties</sl-option>
              <sl-option value="beginner">Beginner</sl-option>
              <sl-option value="intermediate">Intermediate</sl-option>
              <sl-option value="advanced">Advanced</sl-option>
              <sl-option value="mixed">Mixed</sl-option>
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
            
            <sl-button id="searchDictBtn" variant="primary">
              <sl-icon name="search"></sl-icon>
              Search
            </sl-button>
          </div>
        </div>

        <!-- Dictionaries Table -->
        <div class="table-container">
          <table class="dictionaries-table">
            <thead>
              <tr>
                <th>Dictionary</th>
                <th>Words</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="dictionariesTableBody">
              ${this.renderDictionariesRows()}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
          ${this.renderPagination()}
        </div>
      </div>
    `;
  }

  renderUploadSection() {
    return `
      <div class="upload-section">
        <sl-card class="upload-card">
          <div slot="header">
            <h3>Upload New Dictionary</h3>
            <sl-button variant="text" size="small" id="hideUploadBtn">
              <sl-icon name="x"></sl-icon>
            </sl-button>
          </div>
          
          <form id="uploadForm" class="upload-form">
            <!-- File Upload -->
            <div class="upload-area" id="uploadArea">
              <div class="upload-dropzone">
                <sl-icon name="cloud-upload" style="font-size: 3rem; opacity: 0.5;"></sl-icon>
                <p class="upload-text">Drag and drop a JSON file here, or click to browse</p>
                <input type="file" id="fileInput" accept=".json" hidden>
                <sl-button variant="primary" outline id="browseBtn">
                  Browse Files
                </sl-button>
              </div>
            </div>
            
            <div id="filePreview" class="file-preview" style="display: none;"></div>
            
            <!-- Dictionary Metadata -->
            <div class="metadata-section" id="metadataSection" style="display: none;">
              <div class="form-row">
                <sl-input 
                  label="Dictionary Name" 
                  placeholder="Enter dictionary name"
                  name="name"
                  required>
                </sl-input>
                
                <sl-select 
                  label="Difficulty Level" 
                  value="intermediate"
                  name="difficulty"
                  required>
                  <sl-option value="beginner">Beginner</sl-option>
                  <sl-option value="intermediate">Intermediate</sl-option>
                  <sl-option value="advanced">Advanced</sl-option>
                  <sl-option value="mixed">Mixed</sl-option>
                </sl-select>
              </div>
              
              <sl-textarea 
                label="Description (Optional)" 
                placeholder="Brief description of the dictionary"
                name="description"
                rows="3">
              </sl-textarea>
              
              <sl-input 
                label="Categories (Optional)" 
                placeholder="e.g., business, academic, general (comma-separated)"
                name="categories">
              </sl-input>
              
              <div class="upload-actions">
                <sl-button variant="default" id="cancelUpload">
                  Cancel
                </sl-button>
                <sl-button variant="primary" type="submit" id="uploadBtn" disabled>
                  <sl-icon name="upload"></sl-icon>
                  Upload Dictionary
                </sl-button>
              </div>
            </div>
          </form>
        </sl-card>
      </div>
    `;
  }

  renderDictionariesRows() {
    if (!this.dictionaries || this.dictionaries.length === 0) {
      return `
        <tr>
          <td colspan="6" class="no-data">
            <div class="no-dictionaries">
              <sl-icon name="book" style="font-size: 3rem; opacity: 0.3;"></sl-icon>
              <p>No dictionaries found</p>
            </div>
          </td>
        </tr>
      `;
    }

    return this.dictionaries.map(dict => `
      <tr class="dictionary-row">
        <td class="dict-info">
          <div class="dict-details">
            <span class="dict-name">${dict.name}</span>
            <span class="dict-filename">${dict.filename}</span>
            ${dict.description ? `<span class="dict-description">${dict.description}</span>` : ''}
          </div>
        </td>
        <td class="word-count">
          <sl-badge variant="neutral">${dict.wordCount} words</sl-badge>
        </td>
        <td>
          <sl-badge variant="${this.getDifficultyVariant(dict.difficulty)}">
            ${dict.difficulty}
          </sl-badge>
        </td>
        <td>
          <sl-switch 
            ${dict.isActive ? 'checked' : ''} 
            data-dict-id="${dict._id}"
            data-source="${dict.source}"
            class="status-toggle">
          </sl-switch>
          <span class="status-text ${dict.isActive ? 'active' : 'inactive'}">
            ${dict.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="upload-date">
          ${new Date(dict.uploadedAt).toLocaleDateString()}
          <br>
          <small>
            ${dict.source === 'existing' ? 'System' : 
              (dict.uploadedBy ? `by ${dict.uploadedBy.firstName || 'Unknown'}` : 'by Unknown')}
          </small>
        </td>
        <td class="actions">
          <sl-dropdown>
            <sl-button slot="trigger" size="small" variant="neutral" caret>
              Actions
            </sl-button>
            <sl-menu>
              <sl-menu-item data-dict-id="${dict._id}" data-source="${dict.source}" class="preview-dict-btn">
                <sl-icon name="eye"></sl-icon>
                Preview
              </sl-menu-item>
              <sl-menu-item data-dict-id="${dict._id}" data-source="${dict.source}" class="download-dict-btn">
                <sl-icon name="download"></sl-icon>
                Download
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item variant="danger" data-dict-id="${dict._id}" data-source="${dict.source}" class="delete-dict-btn">
                <sl-icon name="trash"></sl-icon>
                ${dict.source === 'existing' ? 'Deactivate' : 'Delete'}
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
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
          data-page="${i}">
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
          id="prevPageDict">
          <sl-icon name="chevron-left"></sl-icon>
        </sl-button>
        
        ${pages.join('')}
        
        <sl-button 
          variant="default" 
          size="small" 
          ${this.currentPage === this.totalPages ? 'disabled' : ''}
          id="nextPageDict">
          <sl-icon name="chevron-right"></sl-icon>
        </sl-button>
      </div>
    `;
  }

  getDifficultyVariant(difficulty) {
    const variants = {
      'beginner': 'success',
      'intermediate': 'warning', 
      'advanced': 'danger',
      'mixed': 'neutral'
    };
    return variants[difficulty] || 'neutral';
  }

  async init() {
    await this.loadDictionaries();
    this.bindEvents();
  }

  async loadDictionaries() {
    try {
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm,
        isActive: this.statusFilter,
        difficulty: this.difficultyFilter
      });

      const backendUrl = 'http://localhost:3000';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/admin/dictionaries?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.dictionaries = data.data.dictionaryFiles;
        this.currentPage = data.data.pagination.currentPage;
        this.totalPages = data.data.pagination.totalPages;
      } else {
        console.error('Failed to load dictionaries');
        this.dictionaries = [];
      }
    } catch (error) {
      console.error('Error loading dictionaries:', error);
      this.dictionaries = [];
    }
  }

  bindEvents() {
    // Upload section toggle
    document.getElementById('showUploadBtn')?.addEventListener('click', () => this.showUpload());
    document.getElementById('hideUploadBtn')?.addEventListener('click', () => this.hideUpload());
    document.getElementById('cancelUpload')?.addEventListener('click', () => this.hideUpload());

    // File upload
    document.getElementById('browseBtn')?.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleFileSelect(e));
    document.getElementById('uploadForm')?.addEventListener('submit', (e) => this.handleUpload(e));

    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
      uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
      uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
      uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());
    }

    // Search and filters
    document.getElementById('searchDictBtn')?.addEventListener('click', () => this.handleSearch());
    document.getElementById('dictSearch')?.addEventListener('sl-input', (e) => {
      this.searchTerm = e.target.value;
    });
    document.getElementById('difficultyFilter')?.addEventListener('sl-change', (e) => {
      this.difficultyFilter = e.target.value;
    });
    document.getElementById('statusFilter')?.addEventListener('sl-change', (e) => {
      this.statusFilter = e.target.value;
    });

    // Pagination
    document.getElementById('prevPageDict')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
    document.getElementById('nextPageDict')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        this.changePage(page);
      });
    });

    // Status toggles
    document.querySelectorAll('.status-toggle').forEach(toggle => {
      toggle.addEventListener('sl-change', (e) => this.toggleDictionaryStatus(e));
    });

    // Action buttons
    document.querySelectorAll('.preview-dict-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.previewDictionary(e));
    });
    document.querySelectorAll('.download-dict-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.downloadDictionary(e));
    });
    document.querySelectorAll('.delete-dict-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteDictionary(e));
    });
  }

  showUpload() {
    this.uploadMode = true;
    this.refresh();
  }

  hideUpload() {
    this.uploadMode = false;
    this.previewData = null;
    this.refresh();
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  async processFile(file) {
    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data) || data.length === 0) {
        alert('Invalid dictionary format. File must contain an array of words.');
        return;
      }

      this.previewData = { file, data };
      this.showFilePreview(file, data);
      
    } catch (error) {
      alert('Invalid JSON file. Please check the format.');
      console.error('File processing error:', error);
    }
  }

  showFilePreview(file, data) {
    const preview = document.getElementById('filePreview');
    const metadata = document.getElementById('metadataSection');
    const uploadBtn = document.getElementById('uploadBtn');
    
    preview.innerHTML = `
      <div class="preview-content">
        <h4>File Preview</h4>
        <div class="file-info">
          <p><strong>File:</strong> ${file.name}</p>
          <p><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Words:</strong> ${data.length}</p>
        </div>
        <div class="sample-words">
          <h5>Sample Words:</h5>
          <div class="words-grid">
            ${data.slice(0, 6).map(word => `
              <div class="word-item">
                <strong>${word.name}</strong>
                <span>${word.trans?.[0] || 'No translation'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    preview.style.display = 'block';
    metadata.style.display = 'block';
    uploadBtn.disabled = false;
  }

  async handleUpload(e) {
    e.preventDefault();
    
    if (!this.previewData) {
      alert('Please select a file first');
      return;
    }

    const formData = new FormData(e.target);
    formData.append('dictionaryFile', this.previewData.file);

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.loading = true;

    try {
      const backendUrl = 'http://localhost:3000';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/admin/dictionaries/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Dictionary uploaded successfully!');
        this.hideUpload();
        await this.loadDictionaries();
        await this.refresh();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      uploadBtn.loading = false;
    }
  }

  async handleSearch() {
    this.currentPage = 1;
    await this.loadDictionaries();
    await this.refresh();
  }

  async changePage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      await this.loadDictionaries();
      await this.refresh();
    }
  }

  async toggleDictionaryStatus(event) {
    const dictId = event.target.dataset.dictId;
    const source = event.target.dataset.source;
    const newStatus = event.target.checked;
    
    try {
      const backendUrl = 'http://localhost:3000';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/admin/dictionaries/${dictId}/toggle-status?source=${source}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update local dictionary data
        const dict = this.dictionaries.find(d => d._id === dictId);
        if (dict) {
          dict.isActive = data.data.isActive;
        }
        await this.refresh();
      } else {
        // Revert toggle on error
        event.target.checked = !newStatus;
        console.error('Failed to update dictionary status');
      }
    } catch (error) {
      // Revert toggle on error
      event.target.checked = !newStatus;
      console.error('Error updating dictionary status:', error);
    }
  }

  previewDictionary(event) {
    const dictId = event.target.closest('.preview-dict-btn').dataset.dictId;
    const dict = this.dictionaries.find(d => d._id === dictId);
    
    if (dict && dict.sampleWords) {
      alert(`Sample words from ${dict.name}:\n\n${dict.sampleWords.map(w => `${w.name}: ${w.trans?.[0] || 'No translation'}`).join('\n')}`);
    } else {
      alert('No preview available for this dictionary');
    }
  }

  downloadDictionary(event) {
    const dictId = event.target.closest('.download-dict-btn').dataset.dictId;
    const dict = this.dictionaries.find(d => d._id === dictId);
    
    if (dict) {
      // Download the dictionary file
      const downloadUrl = `/vocabin-frontend/src/dicts/${dict.filename}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = dict.originalName;
      link.click();
    }
  }

  async deleteDictionary(event) {
    const dictId = event.target.closest('.delete-dict-btn').dataset.dictId;
    const source = event.target.closest('.delete-dict-btn').dataset.source;
    const dict = this.dictionaries.find(d => d._id === dictId);
    
    if (!dict) return;
    
    const actionText = source === 'existing' ? 'deactivate' : 'delete';
    const warningText = source === 'existing' 
      ? `Are you sure you want to deactivate "${dict.name}"? It can be reactivated later.`
      : `Are you sure you want to delete "${dict.name}"? This action cannot be undone.`;
    
    if (confirm(warningText)) {
      try {
        const backendUrl = 'http://localhost:3000';
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const response = await fetch(`${backendUrl}/api/admin/dictionaries/${dictId}?source=${source}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          alert(data.message);
          await this.loadDictionaries();
          await this.refresh();
        } else {
          const error = await response.json();
          alert(`${actionText} failed: ${error.message}`);
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert(`${actionText} failed. Please try again.`);
      }
    }
  }

  async refresh() {
    const container = document.querySelector('.dictionary-management');
    if (container) {
      container.innerHTML = await this.render();
      this.bindEvents();
    }
  }
}

export default DictionaryManagement; 