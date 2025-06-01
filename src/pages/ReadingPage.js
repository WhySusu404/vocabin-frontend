import { mockReadingMaterials, mockReadingByDate } from '../data/mockData.js'

export default class ReadingPage {
  constructor() {
    this.name = 'ReadingPage';
    this.readingMaterials = mockReadingMaterials;
    this.readingByDate = mockReadingByDate;
    this.selectedFilter = 'date';
  }

  render() {
    return `
      <div class="reading-container">
        <div class="reading-header">
          <div class="reading-title-section">
            <div class="reading-icon">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="10" y="15" width="40" height="30" rx="2" fill="#87ceeb"/>
                <rect x="15" y="10" width="30" height="25" rx="2" fill="#5b9bcf"/>
                <rect x="20" y="5" width="20" height="20" rx="2" fill="#4a8bc4"/>
              </svg>
            </div>
            <div class="reading-text">
              <h1>Reading & Practice</h1>
              <p>Smart, personalized English practice that fits your life.</p>
            </div>
          </div>
        </div>

        <div class="reading-steps">
          ${this.renderSteps()}
        </div>

        <div class="reading-content">
          <div class="filter-section">
            <div class="filter-tabs">
              <button class="filter-tab ${this.selectedFilter === 'date' ? 'active' : ''}" 
                      id="date-filter">
                By Date
              </button>
              <button class="filter-tab ${this.selectedFilter === 'category' ? 'active' : ''}" 
                      id="category-filter">
                By Category
              </button>
            </div>
          </div>

          <div class="reading-materials">
            ${this.selectedFilter === 'date' ? this.renderDateGrid() : this.renderCategoryList()}
          </div>
        </div>
      </div>
    `;
  }

  renderSteps() {
    const steps = [
      {
        number: 1,
        title: "STEP 1",
        description: "Got high error words list from vocabulary learning"
      },
      {
        number: 2,
        title: "STEP 2", 
        description: "Select high error words list by date or vocabulary lists"
      },
      {
        number: 3,
        title: "STEP 3",
        description: "Enter Reading & Practice mode and finish AI generate setting"
      },
      {
        number: 4,
        title: "STEP 4",
        description: "Create article and exercise and start your learning"
      }
    ];

    return `
      <div class="steps-container">
        ${steps.map((step, index) => `
          <div class="step-item ${index === 0 ? 'active' : ''}">
            <h3>${step.title}</h3>
            <p>${step.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderDateGrid() {
    return `
      <div class="date-grid">
        ${this.readingByDate.map(item => `
          <div class="date-item" data-reading-id="${item.id}">
            <div class="date-number">${item.number}</div>
            <div class="date-label">${item.date}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCategoryList() {
    return `
      <div class="category-grid">
        ${this.readingMaterials.map(material => `
          <div class="reading-material-card" data-reading-id="${material._id}">
            <div class="material-header">
              <h3>${material.title}</h3>
              <span class="difficulty-badge ${material.difficulty}">${material.difficulty}</span>
            </div>
            <p class="material-description">${material.description}</p>
            <div class="material-meta">
              <span class="word-count">${material.wordList.length} words</span>
              <span class="created-date">${new Date(material.createdDate).toLocaleDateString()}</span>
            </div>
            <button class="start-reading-btn">Start Reading</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  mount() {
    this.bindEvents();
  }

  bindEvents() {
    const dateFilter = document.getElementById('date-filter');
    const categoryFilter = document.getElementById('category-filter');

    // Filter switching
    dateFilter?.addEventListener('click', () => {
      this.selectedFilter = 'date';
      this.refreshContent();
    });

    categoryFilter?.addEventListener('click', () => {
      this.selectedFilter = 'category';
      this.refreshContent();
    });

    // Date grid item clicks
    document.addEventListener('click', (e) => {
      const dateItem = e.target.closest('.date-item');
      if (dateItem) {
        const readingId = dateItem.dataset.readingId;
        this.openReading(readingId);
      }

      const materialCard = e.target.closest('.reading-material-card');
      if (materialCard) {
        const readingId = materialCard.dataset.readingId;
        this.openReading(readingId);
      }

      const startBtn = e.target.closest('.start-reading-btn');
      if (startBtn) {
        e.stopPropagation();
        const materialCard = startBtn.closest('.reading-material-card');
        const readingId = materialCard.dataset.readingId;
        this.openReading(readingId);
      }
    });
  }

  refreshContent() {
    const readingMaterials = document.querySelector('.reading-materials');
    if (readingMaterials) {
      readingMaterials.innerHTML = this.selectedFilter === 'date' ? 
        this.renderDateGrid() : this.renderCategoryList();
    }

    // Update filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.classList.remove('active');
      if ((tab.id === 'date-filter' && this.selectedFilter === 'date') ||
          (tab.id === 'category-filter' && this.selectedFilter === 'category')) {
        tab.classList.add('active');
      }
    });
  }

  openReading(readingId) {
    // Navigate to reading detail page
    window.location.hash = `#reading/${readingId}`;
  }

  cleanup() {
    console.log('Reading page cleanup');
  }
} 