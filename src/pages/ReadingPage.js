import VocabularyService from '../services/vocabularyService.js';

export default class ReadingPage {
  constructor(route = null) {
    this.name = 'ReadingPage';
    this.vocabularyService = new VocabularyService();
    
    // Dictionary and articles management
    this.dictionaries = [];
    this.selectedDictionaryId = null;
    this.dictionary = null; // Store dictionary data for word lookup
    this.articles = [];
    this.selectedArticle = null;
    
    // Parse dictionary ID from route query parameters
    if (route && route.query && route.query.dictionary) {
      this.selectedDictionaryId = route.query.dictionary;
    }
    
    // UI state
    this.selectedFilter = 'articles';
    this.readArticles = new Set(); // Track read articles
    this.wordsHighlighted = true;
    
    // Reading session tracking
    this.readingStartTime = null;
    this.wordInteractions = new Set(); // Track which target words user clicked
    this.learnedWords = new Set(); // Track words marked as learned
    this.bookmarkedWords = new Set(); // Track words user wants to review later
    this.readingStats = {
      totalReadingTime: 0,
      articlesRead: 0,
      wordsLearned: 0,
      wordsBookmarked: 0
    };
    
    // Learning progress storage key
    this.progressStorageKey = null;
  }

  // Helper method to get user ID for progress storage
  async getUserId() {
    const { default: apiService } = await import('../services/api.js');
    const currentUser = apiService.getCurrentUser();
    return currentUser ? (currentUser.userId || currentUser.id || currentUser._id || currentUser.email) : 'anonymous';
  }

  async mount() {
    console.log('🔍 DEBUG: ReadingPage mount started');
    
    // Set up progress storage key
    const userId = await this.getUserId();
    this.progressStorageKey = `vocabin_reading_progress_${userId}`;
    
    // Load reading progress
    this.loadReadingProgress();
    
    // Load available dictionaries first
    await this.loadDictionaries();
    
    if (this.dictionaries.length === 0) {
      this.showErrorMessage('No dictionaries available');
      return;
    }
    
    // Set first dictionary as default if none selected
    if (!this.selectedDictionaryId) {
      this.selectedDictionaryId = this.dictionaries[0].id;
    }
    
    // Load dictionary data for word definitions
    await this.loadDictionaryData();
    
    // Load articles for selected dictionary
    await this.loadArticles();
    
    this.bindEvents();
    console.log('🔍 DEBUG: ReadingPage mount completed');
  }

  async loadDictionaries() {
    try {
      const dictResponse = await this.vocabularyService.getDictionaries();
      this.dictionaries = dictResponse.dictionaries;
      console.log('🔍 DEBUG: Dictionaries loaded:', this.dictionaries);
    } catch (error) {
      console.error('❌ Failed to load dictionaries:', error);
      this.showErrorMessage('Failed to load dictionaries. Please try again.');
    }
  }

  async loadDictionaryData() {
    try {
      console.log('🔍 DEBUG: Loading dictionary data using API like other pages...');
      
      // Use the same API pattern as VocabularyPage and ListeningPage
      const dictResponse = await this.vocabularyService.getDictionary(this.selectedDictionaryId);
      this.dictionary = dictResponse.dictionary;
      
      console.log('🔍 DEBUG: Dictionary data loaded via API:', {
        id: this.dictionary.id,
        name: this.dictionary.display_name,
        total_words: this.dictionary.total_words
      });
    } catch (error) {
      console.error('❌ Failed to load dictionary data:', error);
      this.dictionary = null;
      this.showErrorMessage(`Dictionary not found. Please try a different dictionary.`);
    }
  }

  async loadArticles() {
    try {
      console.log('🔍 DEBUG: Loading articles for dictionary:', this.selectedDictionaryId);
      
      // For now, create mock articles since we don't have an articles API endpoint yet
      // This follows the same pattern as the article files we created
      const mockArticles = this.generateMockArticles();
      this.articles = mockArticles;
      
      console.log('🔍 DEBUG: Mock articles loaded:', this.articles.length);
      
      // Update UI
      this.refreshContent();
      
    } catch (error) {
      console.error('❌ Failed to load articles:', error);
      this.articles = [];
      this.showErrorMessage(`No articles available for this dictionary.`);
    }
  }

  generateMockArticles() {
    // Generate articles based on the selected dictionary
    const dictionaryName = this.dictionary?.display_name || 'Unknown';
    const articleCount = 5;
    
    const articles = [];
    
    for (let i = 1; i <= articleCount; i++) {
      articles.push({
        id: `${this.selectedDictionaryId}_article_${i}`,
        title: `${dictionaryName} Reading Article ${i}`,
        topic: this.getTopicForDictionary(dictionaryName),
        difficulty: this.getDifficultyForDictionary(dictionaryName),
        estimatedReadingTime: `${3 + i} min read`,
        targetWords: this.getTargetWordsForDictionary(),
        content: this.generateArticleContent(i, dictionaryName)
      });
    }
    
    return articles;
  }

  getTopicForDictionary(dictionaryName) {
    const topics = {
      'CET-4': ['Business', 'Education', 'Technology', 'Environment', 'Culture'],
      'CET-6': ['Economics', 'Science', 'Literature', 'Philosophy', 'History'],
      'IELTS': ['Academic Writing', 'Research', 'Global Issues', 'Innovation', 'Society'],
      'GRE': ['Psychology', 'Political Science', 'Philosophy', 'Literature', 'Science']
    };
    
    const key = Object.keys(topics).find(k => dictionaryName.includes(k)) || 'CET-4';
    const topicList = topics[key];
    return topicList[Math.floor(Math.random() * topicList.length)];
  }

  getDifficultyForDictionary(dictionaryName) {
    if (dictionaryName.includes('CET-4')) return 'intermediate';
    if (dictionaryName.includes('CET-6')) return 'advanced';
    if (dictionaryName.includes('IELTS')) return 'advanced';
    if (dictionaryName.includes('GRE')) return 'expert';
    return 'intermediate';
  }

  getTargetWordsForDictionary() {
    // Use exact words that appear in our article content templates
    const wordsByLevel = {
      'CET-4': [
        'technology', 'significantly', 'transformed', 'facilitate', 'opportunities',
        'educational', 'institutions', 'adapt', 'approaches', 'prepare',
        'students', 'digital', 'economy', 'development', 'comprehensive',
        'strategic', 'establish', 'fundamental', 'implement'
      ],
      'CET-6': [
        'contemporary', 'economic', 'comprehensive', 'strategic', 'implementation',
        'sustainable', 'development', 'facilitate', 'innovation', 'analysis',
        'demonstrates', 'fundamental', 'technological', 'approaches', 'principles'
      ],
      'IELTS': [
        'academic', 'research', 'demonstrated', 'significance', 'comprehensive',
        'approaches', 'strategic', 'implementation', 'innovative', 'solutions',
        'facilitate', 'sustainable', 'development', 'fundamental', 'establish'
      ],
      'GRE': [
        'contemporary', 'analysis', 'demonstrates', 'significance', 'comprehensive',
        'methodological', 'approaches', 'strategic', 'implementation', 'fundamental',
        'facilitate', 'academic', 'advancement', 'innovative', 'establish'
      ]
    };
    
    const dictionaryName = this.dictionary?.display_name || '';
    let targetWords;
    
    if (dictionaryName.includes('CET-4')) {
      targetWords = wordsByLevel['CET-4'];
    } else if (dictionaryName.includes('CET-6')) {
      targetWords = wordsByLevel['CET-6'];
    } else if (dictionaryName.includes('IELTS')) {
      targetWords = wordsByLevel['IELTS'];
    } else if (dictionaryName.includes('GRE')) {
      targetWords = wordsByLevel['GRE'];
    } else {
      targetWords = wordsByLevel['CET-4']; // default
    }
    
    // Return first 12 words
    return targetWords.slice(0, 12);
  }

  generateArticleContent(articleIndex, dictionaryName) {
    // Generate sample content for different dictionaries
    // IMPORTANT: Use exact words that match our target vocabulary
    const templates = {
      'CET-4': [
        "Technology has significantly transformed our daily lives and continues to facilitate new opportunities. Educational institutions must adapt their approaches to prepare students for this digital economy. The development of comprehensive solutions requires strategic thinking to establish fundamental principles.",
        "Environmental protection is a significant challenge that requires technological innovation. We must implement comprehensive policies to facilitate sustainable development. Educational approaches need to establish new strategies for environmental awareness.",
        "The digital economy presents new opportunities for students and educational institutions. Technology can facilitate learning and help establish comprehensive development programs. Strategic implementation of these approaches is fundamental."
      ],
      'CET-6': [
        "Contemporary economic theories emphasize the significance of comprehensive policy frameworks. Strategic implementation of sustainable development principles can facilitate innovation. The analysis demonstrates fundamental changes in technological approaches.",
        "Economic development requires comprehensive analysis of contemporary challenges. Strategic implementation of innovative policies can facilitate sustainable growth. These fundamental principles establish new approaches to development.",
        "The intersection of technology and economics demonstrates significant changes. Contemporary analysis shows that strategic implementation can facilitate comprehensive development of fundamental principles."
      ],
      'IELTS': [
        "Academic research has demonstrated the significance of comprehensive approaches to global challenges. Strategic implementation of innovative solutions can facilitate sustainable development. These fundamental principles establish new perspectives for analysis.",
        "Research demonstrates that comprehensive analysis is fundamental to academic success. Strategic approaches can facilitate innovative solutions and establish new perspectives for sustainable development.",
        "Academic institutions must implement comprehensive strategies for research and development. These approaches demonstrate the significance of innovative analysis in establishing fundamental principles."
      ],
      'GRE': [
        "Contemporary analysis demonstrates the significance of comprehensive methodological approaches. Strategic implementation of fundamental principles can facilitate academic advancement. These comprehensive frameworks establish new perspectives for scholarly analysis.",
        "Academic research demonstrates that comprehensive analysis is fundamental to contemporary scholarship. Strategic implementation of innovative methodologies can facilitate advancement in various disciplines.",
        "The significance of comprehensive analysis in contemporary research cannot be understated. Strategic implementation of fundamental principles helps establish innovative approaches to academic advancement."
      ]
    };
    
    const key = Object.keys(templates).find(k => dictionaryName.includes(k)) || 'CET-4';
    const contentList = templates[key];
    
    const selectedContent = contentList[articleIndex % contentList.length];
    
    // Return the content with some additional context
    return `${selectedContent}\n\nThis article provides an opportunity to practice reading comprehension while learning vocabulary in context. The highlighted words represent key terms that are commonly used in academic and professional settings.`;
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
              <p>Learn vocabulary through contextual reading with interactive learning features.</p>
            </div>
          </div>
          
          <!-- Dictionary Selector -->
          <div class="dictionary-selector">
            <label for="reading-dictionary-select">Choose Dictionary:</label>
            <select id="reading-dictionary-select" class="dictionary-dropdown">
              ${this.dictionaries.map(dict => 
                `<option value="${dict.id}" ${dict.id === this.selectedDictionaryId ? 'selected' : ''}>
                  ${dict.display_name}
                </option>`
              ).join('')}
            </select>
          </div>
          
          <!-- Reading Statistics -->
          <div class="reading-stats">
            <div class="stat-item">
              <span class="stat-value">${this.readingStats.articlesRead}</span>
              <span class="stat-label">Articles Read</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.readingStats.wordsLearned}</span>
              <span class="stat-label">Words Learned</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.formatTime(this.readingStats.totalReadingTime)}</span>
              <span class="stat-label">Reading Time</span>
            </div>
          </div>
        </div>

        <div class="reading-steps">
          ${this.renderSteps()}
        </div>

        <div class="reading-content">
          ${this.selectedArticle ? this.renderArticleView() : this.renderArticleList()}
        </div>
      </div>
    `;
  }

  renderSteps() {
    const steps = [
      {
        number: 1,
        title: "STEP 1",
        description: "Select a dictionary and browse available reading articles"
      },
      {
        number: 2,
        title: "STEP 2", 
        description: "Read articles with highlighted vocabulary words in context"
      },
      {
        number: 3,
        title: "STEP 3",
        description: "Click words to see definitions and mark them as learned"
      },
      {
        number: 4,
        title: "STEP 4",
        description: "Track your progress and build your vocabulary knowledge"
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

  renderArticleList() {
    if (this.articles.length === 0) {
      return `
        <div class="no-articles">
          <h3>No Articles Available</h3>
          <p>Please select a different dictionary or check back later.</p>
        </div>
      `;
    }

    return `
      <div class="article-controls">
        <div class="article-stats">
          <span>Available Articles: ${this.articles.length}</span>
          <span>Read: ${this.readArticles.size}</span>
          <span>Learned Words: ${this.learnedWords.size}</span>
        </div>
        <div class="article-controls-right">
          <button class="toggle-highlights-btn" id="toggle-highlights">
            ${this.wordsHighlighted ? 'Hide' : 'Show'} Word Highlights
          </button>
          <button class="view-bookmarks-btn" id="view-bookmarks">
            📚 Bookmarked Words (${this.bookmarkedWords.size})
          </button>
        </div>
      </div>
      
      <div class="articles-grid">
        ${this.articles.map(article => `
          <div class="article-card ${this.readArticles.has(article.id) ? 'read' : ''}" data-article-id="${article.id}">
            <div class="article-header">
              <h3>${article.title}</h3>
              <div class="article-meta">
                <span class="difficulty-badge ${article.difficulty}">${article.difficulty}</span>
                <span class="reading-time">${article.estimatedReadingTime}</span>
              </div>
            </div>
            <div class="article-info">
              <span class="topic-tag">${article.topic}</span>
              <span class="word-count">${article.targetWords.length} target words</span>
              <span class="learned-words">Learned: ${this.getLearnedWordsInArticle(article).length}/${article.targetWords.length}</span>
            </div>
            <button class="read-article-btn">
              ${this.readArticles.has(article.id) ? 'Read Again' : 'Start Reading'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderArticleView() {
    if (!this.selectedArticle) return '';

    const highlightedContent = this.highlightTargetWords(
      this.selectedArticle.content, 
      this.selectedArticle.targetWords
    );

    const learnedCount = this.selectedArticle.targetWords.filter(word => 
      this.learnedWords.has(word.toLowerCase())
    ).length;

    return `
      <div class="article-reader">
        <div class="article-reader-header">
          <button class="back-btn" id="back-to-list">← Back to Articles</button>
          <div class="reading-controls">
            <button class="toggle-highlights-btn" id="toggle-highlights">
              ${this.wordsHighlighted ? 'Hide' : 'Show'} Highlights
            </button>
            <span class="reading-progress">
              Clicked: ${this.wordInteractions.size}/${this.selectedArticle.targetWords.length} | 
              Learned: ${learnedCount}/${this.selectedArticle.targetWords.length}
            </span>
          </div>
        </div>
        
        <article class="article-content">
          <header class="article-title">
            <h1>${this.selectedArticle.title}</h1>
            <div class="article-metadata">
              <span class="difficulty-badge ${this.selectedArticle.difficulty}">${this.selectedArticle.difficulty}</span>
              <span class="topic-tag">${this.selectedArticle.topic}</span>
              <span class="reading-time">${this.selectedArticle.estimatedReadingTime}</span>
            </div>
          </header>
          
          <div class="article-body" id="article-body">
            ${highlightedContent}
          </div>
          
          <footer class="article-footer">
            <div class="target-words-summary">
              <h4>Target Vocabulary (${this.selectedArticle.targetWords.length} words):</h4>
              <div class="word-tags">
                ${this.selectedArticle.targetWords.map(word => {
                  const isClicked = this.wordInteractions.has(word.toLowerCase());
                  const isLearned = this.learnedWords.has(word.toLowerCase());
                  const isBookmarked = this.bookmarkedWords.has(word.toLowerCase());
                  return `
                    <span class="word-tag ${isClicked ? 'clicked' : ''} ${isLearned ? 'learned' : ''} ${isBookmarked ? 'bookmarked' : ''}" 
                          data-word="${word.toLowerCase()}">
                      ${word}
                      ${isLearned ? ' ✓' : ''}
                      ${isBookmarked ? ' 📚' : ''}
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
            
            <div class="reading-actions">
              <button class="complete-reading-btn" id="complete-reading">Mark as Complete</button>
            </div>
          </footer>
        </article>
      </div>
    `;
  }

  highlightTargetWords(content, targetWords) {
    if (!this.wordsHighlighted) return content;
    
    console.log('🔍 DEBUG: Highlighting words:', targetWords);
    console.log('🔍 DEBUG: Content preview:', content.substring(0, 200));
    
    let highlightedContent = content;
    
    // Sort words by length (longest first) to avoid partial word replacements
    const sortedWords = [...targetWords].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      // Create regex for word boundaries to match whole words only (case insensitive)
      const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      
      const matches = content.match(regex);
      if (matches) {
        console.log(`🔍 DEBUG: Found matches for "${word}":`, matches);
      }
      
      highlightedContent = highlightedContent.replace(regex, (match) => {
        const wordLower = word.toLowerCase();
        const isClicked = this.wordInteractions.has(wordLower);
        const isLearned = this.learnedWords.has(wordLower);
        const isBookmarked = this.bookmarkedWords.has(wordLower);
        
        let classes = 'highlighted-word';
        if (isClicked) classes += ' clicked';
        if (isLearned) classes += ' learned';
        if (isBookmarked) classes += ' bookmarked';
        
        console.log(`🔍 DEBUG: Highlighting "${match}" with classes:`, classes);
        
        return `<span class="${classes}" data-word="${wordLower}" style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 3px; padding: 2px 4px; cursor: pointer;">${match}</span>`;
      });
    });
    
    console.log('🔍 DEBUG: Final highlighted content preview:', highlightedContent.substring(0, 300));
    
    return highlightedContent;
  }

  bindEvents() {
    // Dictionary selection
    const dictionarySelect = document.getElementById('reading-dictionary-select');
    dictionarySelect?.addEventListener('change', async (e) => {
      const newDictionaryId = e.target.value;
      if (newDictionaryId !== this.selectedDictionaryId) {
        await this.changeDictionary(newDictionaryId);
      }
    });

    // Article selection and reading controls
    document.addEventListener('click', (e) => {
      // Article card clicks
      const articleCard = e.target.closest('.article-card');
      if (articleCard) {
        const articleId = articleCard.dataset.articleId;
        this.openArticle(articleId);
        return;
      }

      // Read article button
      const readBtn = e.target.closest('.read-article-btn');
      if (readBtn) {
        e.stopPropagation();
        const articleCard = readBtn.closest('.article-card');
        const articleId = articleCard.dataset.articleId;
        this.openArticle(articleId);
        return;
      }

      // Back to list button
      if (e.target.id === 'back-to-list') {
        this.closeArticle();
        return;
      }

      // Toggle highlights button
      if (e.target.id === 'toggle-highlights') {
        this.toggleHighlights();
        return;
      }

      // View bookmarks button
      if (e.target.id === 'view-bookmarks') {
        this.showBookmarkedWords();
        return;
      }

      // Highlighted word clicks
      const highlightedWord = e.target.closest('.highlighted-word');
      if (highlightedWord) {
        this.handleWordClick(highlightedWord);
        return;
      }

      // Word tag clicks
      const wordTag = e.target.closest('.word-tag');
      if (wordTag) {
        this.handleWordTagClick(wordTag);
        return;
      }

      // Quick review button
      if (e.target.id === 'quick-review') {
        this.startQuickReview();
        return;
      }

      // Complete reading button
      if (e.target.id === 'complete-reading') {
        this.completeReading();
        return;
      }
    });
  }

  async changeDictionary(newDictionaryId) {
    console.log('🔍 DEBUG: Changing dictionary to:', newDictionaryId);
    
    this.selectedDictionaryId = newDictionaryId;
    this.selectedArticle = null;
    
    // Load new dictionary data and articles
    await this.loadDictionaryData();
    await this.loadArticles();
    
    this.refreshContent();
  }

  openArticle(articleId) {
    this.selectedArticle = this.articles.find(article => article.id === articleId);
    if (this.selectedArticle) {
      this.readingStartTime = Date.now();
      this.wordInteractions.clear();
      this.refreshContent();
      
      // Scroll to top of article
      setTimeout(() => {
        document.querySelector('.article-reader')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  closeArticle() {
    // Save reading time if article was being read
    if (this.readingStartTime && this.selectedArticle) {
      const readingTime = Math.floor((Date.now() - this.readingStartTime) / 1000);
      this.readingStats.totalReadingTime += readingTime;
    }
    
    this.selectedArticle = null;
    this.readingStartTime = null;
    this.wordInteractions.clear();
    this.saveReadingProgress();
    this.refreshContent();
  }

  toggleHighlights() {
    this.wordsHighlighted = !this.wordsHighlighted;
    
    if (this.selectedArticle) {
      // Update article content
      const articleBody = document.getElementById('article-body');
      if (articleBody) {
        articleBody.innerHTML = this.highlightTargetWords(
          this.selectedArticle.content, 
          this.selectedArticle.targetWords
        );
      }
    }
    
    // Update button text
    const toggleBtns = document.querySelectorAll('#toggle-highlights');
    toggleBtns.forEach(btn => {
      btn.textContent = `${this.wordsHighlighted ? 'Hide' : 'Show'} ${this.selectedArticle ? 'Highlights' : 'Word Highlights'}`;
    });
  }

  async handleWordClick(wordElement) {
    const word = wordElement.dataset.word;
    if (!word) return;

    // Mark word as clicked
    this.wordInteractions.add(word);
    wordElement.classList.add('clicked');
    
    // Update word tag in footer
    const wordTag = document.querySelector(`[data-word="${word}"].word-tag`);
    if (wordTag) {
      wordTag.classList.add('clicked');
    }
    
    // Update progress counter
    const progressEl = document.querySelector('.reading-progress');
    if (progressEl) {
      const learnedCount = this.selectedArticle.targetWords.filter(w => 
        this.learnedWords.has(w.toLowerCase())
      ).length;
      progressEl.innerHTML = `
        Clicked: ${this.wordInteractions.size}/${this.selectedArticle.targetWords.length} | 
        Learned: ${learnedCount}/${this.selectedArticle.targetWords.length}
      `;
    }
    
    // Show word definition modal
    await this.showWordDefinitionModal(word, wordElement);
  }

  async showWordDefinitionModal(word, element) {
    // Find word definition in dictionary
    const wordData = this.findWordInDictionary(word);
    
    const modal = document.createElement('div');
    modal.className = 'word-definition-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <div class="word-header">
              <h3 class="word-title">${word}</h3>
              <div class="word-meta">
                ${wordData?.usphone ? `<span class="pronunciation">🇺🇸 /${wordData.usphone}/</span>` : ''}
                ${wordData?.ukphone && wordData.ukphone !== wordData.usphone ? `<span class="pronunciation">🇬🇧 /${wordData.ukphone}/</span>` : ''}
                ${wordData ? `<button class="audio-btn" id="modal-play-audio-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                  Play
                </button>` : ''}
              </div>
            </div>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            ${this.renderWordDefinition(wordData)}
          </div>
          <div class="modal-footer">
            <button class="bookmark-word-btn ${this.bookmarkedWords.has(word) ? 'bookmarked' : ''}" 
                    data-word="${word}">
              <span class="btn-icon">📚</span>
              <span class="btn-text">${this.bookmarkedWords.has(word) ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            <button class="mark-learned-btn ${this.learnedWords.has(word) ? 'learned' : ''}" 
                    data-word="${word}">
              <span class="btn-icon">✓</span>
              <span class="btn-text">${this.learnedWords.has(word) ? 'Learned' : 'Mark as Learned'}</span>
            </button>
            <button class="practice-word-btn" data-word="${word}">
              <span class="btn-icon">🎯</span>
              <span class="btn-text">Practice</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind modal events
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target === modal.querySelector('.modal-overlay')) {
        modal.remove();
      }
    });
    
    // Audio button event
    const audioBtn = modal.querySelector('#modal-play-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.playWordAudio(word);
      });
    }
    
    modal.querySelector('.bookmark-word-btn').addEventListener('click', () => {
      this.toggleBookmarkWord(word);
      modal.remove();
      this.refreshContent();
    });

    modal.querySelector('.mark-learned-btn').addEventListener('click', () => {
      this.markWordAsLearned(word);
      modal.remove();
      this.refreshContent();
    });

    modal.querySelector('.practice-word-btn').addEventListener('click', () => {
      this.practiceWord(word);
      modal.remove();
    });
  }

  findWordInDictionary(word) {
    // The dictionary loaded via API might have a different structure
    // Let's handle both the direct word list and the API response structure
    
    if (!this.dictionary) {
      return null;
    }
    
    // If dictionary has a words array (from API)
    if (this.dictionary.words && Array.isArray(this.dictionary.words)) {
      return this.dictionary.words.find(entry => 
        entry.name && entry.name.toLowerCase() === word.toLowerCase()
      );
    }
    
    // If dictionary is a direct array (legacy format)
    if (Array.isArray(this.dictionary)) {
      return this.dictionary.find(entry => 
        entry.name && entry.name.toLowerCase() === word.toLowerCase()
      );
    }
    
    // **NEW**: If we have the dictionary data but no match yet, try the dictionary content
    // Load dictionary file content if available
    try {
      const dictionaryName = this.dictionary?.display_name || '';
      if (dictionaryName.includes('CET-4')) {
        // For CET-4, try to load from the static JSON file
        return this.findWordInStaticDictionary(word, 'CET4_T');
      } else if (dictionaryName.includes('CET-6')) {
        return this.findWordInStaticDictionary(word, 'CET6_T');
      } else if (dictionaryName.includes('IELTS')) {
        return this.findWordInStaticDictionary(word, 'IELTS_3_T');
      } else if (dictionaryName.includes('GRE')) {
        return this.findWordInStaticDictionary(word, 'GRE_3_T');
      }
    } catch (error) {
      console.log('Could not load from static dictionary:', error);
    }
    
    // For now, return a mock definition since we don't have word-level API access yet
    return {
      name: word,
      trans: [`Translation of ${word}`],
      usphone: 'sample',
      ukphone: 'sample'
    };
  }

  // New method to search in static dictionary files
  async findWordInStaticDictionary(word, dictionaryFile) {
    try {
      // Try to import the dictionary file dynamically
      const dictModule = await import(`../dicts/${dictionaryFile}.json`);
      const dictionaryData = dictModule.default;
      
      // Search for the word in the dictionary
      const foundWord = dictionaryData.find(entry => 
        entry.name && entry.name.toLowerCase() === word.toLowerCase()
      );
      
      if (foundWord) {
        console.log('✅ Found word in static dictionary:', foundWord);
        return foundWord;
      }
    } catch (error) {
      console.log('Could not load static dictionary file:', error);
    }
    
    return null;
  }

  // Add audio playback functionality (same as VocabularyPage)
  playWordAudio(word) {
    if (!word) return;
    
    try {
      // Use Youdao API for audio (same as VocabularyPage)
      const audioUrl = this.vocabularyService.generateAudioUrl(word);
      const audio = new Audio(audioUrl);
      
      // Add error handling for audio loading
      audio.addEventListener('error', () => {
        this.fallbackToTTS(word);
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log('🔊 Audio loaded successfully for:', word);
      });
      
      audio.play().catch((error) => {
        console.log('Audio play failed, falling back to TTS:', error);
        this.fallbackToTTS(word);
      });
      
    } catch (error) {
      console.log('Audio generation failed, falling back to TTS:', error);
      this.fallbackToTTS(word);
    }
  }
  
  // Fallback to text-to-speech (same as VocabularyPage)
  fallbackToTTS(word) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // Slightly slower for learning
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      this.showErrorMessage('Audio not supported in this browser');
    }
  }

  renderWordDefinition(wordData) {
    if (!wordData) {
      return `
        <div class="word-definition">
          <div class="definition-content">
            <div class="no-definition">
              <div class="no-def-icon">📖</div>
              <p>Definition not available in this dictionary.</p>
              <p class="suggestion">This word will be marked for your vocabulary practice.</p>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="word-definition">
        <div class="definition-content">
          <div class="word-meanings">
            <h5>Chinese Translations:</h5>
            <ul class="meanings-list">
              ${wordData.trans && wordData.trans.length > 0 
                ? wordData.trans.map((translation, index) => `
                    <li class="meaning-item">
                      <span class="translation-number">${index + 1}.</span>
                      <span class="translation-text">${translation}</span>
                    </li>
                  `).join('') 
                : '<li class="meaning-item">Translation will be available in vocabulary practice</li>'
              }
            </ul>
          </div>
          ${wordData.usphone || wordData.ukphone ? `
            <div class="word-phonetics">
              <h5>Pronunciation:</h5>
              <div class="phonetics-container">
                ${wordData.usphone ? `
                  <div class="phonetic-item">
                    <span class="phonetic-label">🇺🇸 US:</span>
                    <span class="phonetic-value">/${wordData.usphone}/</span>
                  </div>
                ` : ''}
                ${wordData.ukphone && wordData.ukphone !== wordData.usphone ? `
                  <div class="phonetic-item">
                    <span class="phonetic-label">🇬🇧 UK:</span>
                    <span class="phonetic-value">/${wordData.ukphone}/</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  toggleBookmarkWord(word) {
    if (this.bookmarkedWords.has(word)) {
      this.bookmarkedWords.delete(word);
      this.readingStats.wordsBookmarked = Math.max(0, this.readingStats.wordsBookmarked - 1);
    } else {
      this.bookmarkedWords.add(word);
      this.readingStats.wordsBookmarked++;
    }
    
    this.saveReadingProgress();
    this.updateWordVisualState(word);
  }

  markWordAsLearned(word) {
    if (!this.learnedWords.has(word)) {
      this.learnedWords.add(word);
      this.readingStats.wordsLearned++;
      this.saveReadingProgress();
      
      // Also save to backend for vocabulary practice integration
      this.saveWordProgress(word);
    }
    
    this.updateWordVisualState(word);
  }

  async saveWordProgress(word) {
    try {
      // This integrates with vocabulary practice - mark word as encountered in reading
      const wordData = this.findWordInDictionary(word);
      if (wordData) {
        // You can implement backend integration here
        console.log('📚 Word learned through reading:', word);
      }
    } catch (error) {
      console.error('Failed to save word progress:', error);
    }
  }

  updateWordVisualState(word) {
    // Update all instances of the word in the UI
    const wordElements = document.querySelectorAll(`[data-word="${word}"]`);
    wordElements.forEach(element => {
      if (this.learnedWords.has(word)) {
        element.classList.add('learned');
      }
      if (this.bookmarkedWords.has(word)) {
        element.classList.add('bookmarked');
      } else {
        element.classList.remove('bookmarked');
      }
    });
    
    // Update word tags
    const wordTag = document.querySelector(`[data-word="${word}"].word-tag`);
    if (wordTag) {
      const isLearned = this.learnedWords.has(word);
      const isBookmarked = this.bookmarkedWords.has(word);
      
      // Update text content
      wordTag.innerHTML = `
        ${word}
        ${isLearned ? ' ✓' : ''}
        ${isBookmarked ? ' 📚' : ''}
      `;
    }
  }

  practiceWord(word) {
    // Navigate to vocabulary practice with this specific word
    window.location.hash = `#vocabulary?dictionary=${this.selectedDictionaryId}&word=${word}`;
  }

  showBookmarkedWords() {
    if (this.bookmarkedWords.size === 0) {
      this.showInfoMessage('No bookmarked words yet. Click on words while reading to bookmark them!');
      return;
    }
    
    const bookmarkedList = Array.from(this.bookmarkedWords).map(word => {
      const wordData = this.findWordInDictionary(word);
      const firstTranslation = wordData?.trans?.[0] || 'No definition available';
      
      return `
        <div class="bookmarked-word-item" data-word="${word}">
          <div class="word-info">
            <strong>${word}</strong>
            <span class="word-meaning">${firstTranslation}</span>
          </div>
          <div class="word-actions">
            <button class="practice-btn" data-word="${word}">Practice</button>
            <button class="remove-bookmark-btn" data-word="${word}">Remove</button>
          </div>
        </div>
      `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'bookmarks-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>📚 Bookmarked Words (${this.bookmarkedWords.size})</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="bookmarked-words-list">
              ${bookmarkedList}
            </div>
          </div>
          <div class="modal-footer">
            <button class="practice-all-btn">Practice All Bookmarked Words</button>
            <button class="export-bookmarks-btn">Export Word List</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target === modal.querySelector('.modal-overlay')) modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('practice-btn')) {
        const word = e.target.dataset.word;
        this.practiceWord(word);
        modal.remove();
      } else if (e.target.classList.contains('remove-bookmark-btn')) {
        const word = e.target.dataset.word;
        this.toggleBookmarkWord(word);
        e.target.closest('.bookmarked-word-item').remove();
        
        // Update counter
        modal.querySelector('h3').textContent = `📚 Bookmarked Words (${this.bookmarkedWords.size})`;
      }
    });
  }

  startQuickReview() {
    const clickedWords = Array.from(this.wordInteractions);
    
    if (clickedWords.length === 0) {
      this.showInfoMessage('Click on some words first to start a review!');
      return;
    }
    
    this.showQuickReviewModal(clickedWords);
  }

  showQuickReviewModal(words) {
    const reviewItems = words.map(word => {
      const wordData = this.findWordInDictionary(word);
      const isLearned = this.learnedWords.has(word);
      
      return `
        <div class="review-item ${isLearned ? 'learned' : ''}" data-word="${word}">
          <div class="review-word">
            <h4>${word}</h4>
            ${wordData?.usphone ? `<span class="phone">/${wordData.usphone}/</span>` : ''}
          </div>
          <div class="review-definition">
            ${wordData?.trans?.[0] || 'No definition available'}
          </div>
          <div class="review-actions">
            <button class="mark-learned-btn ${isLearned ? 'learned' : ''}" data-word="${word}">
              ${isLearned ? '✓ Learned' : 'Mark as Learned'}
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'quick-review-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>🎯 Quick Vocabulary Review</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Review the words you clicked on in this article:</p>
            <div class="review-list">
              ${reviewItems}
            </div>
          </div>
          <div class="modal-footer">
            <button class="mark-all-learned-btn">Mark All as Learned</button>
            <button class="practice-these-btn">Practice These Words</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('mark-learned-btn')) {
        const word = e.target.dataset.word;
        this.markWordAsLearned(word);
        e.target.textContent = '✓ Learned';
        e.target.classList.add('learned');
        e.target.closest('.review-item').classList.add('learned');
      }
    });
    
    modal.querySelector('.mark-all-learned-btn').addEventListener('click', () => {
      words.forEach(word => this.markWordAsLearned(word));
      modal.remove();
      this.refreshContent();
    });
    
    modal.querySelector('.practice-these-btn').addEventListener('click', () => {
      // Navigate to vocabulary practice
      window.location.hash = `#vocabulary?dictionary=${this.selectedDictionaryId}`;
      modal.remove();
    });
  }

  handleWordTagClick(wordTagElement) {
    const word = wordTagElement.dataset.word;
    if (!word) return;
    
    // Find and highlight the word in the article
    const highlightedWords = document.querySelectorAll(`[data-word="${word}"].highlighted-word`);
    highlightedWords.forEach(el => {
      el.style.animation = 'pulse 1s ease-in-out';
      setTimeout(() => {
        el.style.animation = '';
      }, 1000);
    });
  }

  completeReading() {
    if (!this.selectedArticle) return;
    
    // Mark article as read
    this.readArticles.add(this.selectedArticle.id);
    this.readingStats.articlesRead++;
    
    // Calculate reading time
    const readingTime = this.readingStartTime 
      ? Math.floor((Date.now() - this.readingStartTime) / 1000)
      : 0;
    
    this.readingStats.totalReadingTime += readingTime;
    
    // Save progress
    this.saveReadingProgress();
    
    // Show completion stats
    const learnedInArticle = this.selectedArticle.targetWords.filter(word => 
      this.learnedWords.has(word.toLowerCase())
    ).length;
    
    const completionInfo = `
      <div class="reading-completion">
        <h3>✅ Reading Complete!</h3>
        <div class="completion-stats">
          <p><strong>Article:</strong> "${this.selectedArticle.title}"</p>
          <p><strong>Reading time:</strong> ${this.formatTime(readingTime)}</p>
          <p><strong>Words clicked:</strong> ${this.wordInteractions.size}/${this.selectedArticle.targetWords.length}</p>
          <p><strong>Words learned:</strong> ${learnedInArticle}/${this.selectedArticle.targetWords.length}</p>
          <p><strong>Total words learned:</strong> ${this.readingStats.wordsLearned}</p>
        </div>
        <div class="completion-actions">
          <button class="continue-reading-btn">Continue Reading</button>
          <button class="practice-vocabulary-btn">Practice Vocabulary</button>
        </div>
      </div>
    `;
    
    this.showCompletionModal(completionInfo);
  }

  showCompletionModal(content) {
    const modal = document.createElement('div');
    modal.className = 'completion-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          ${content}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    modal.querySelector('.continue-reading-btn').addEventListener('click', () => {
      modal.remove();
      this.closeArticle();
    });
    
    modal.querySelector('.practice-vocabulary-btn').addEventListener('click', () => {
      window.location.hash = `#vocabulary?dictionary=${this.selectedDictionaryId}`;
      modal.remove();
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
        this.closeArticle();
      }
    }, 10000);
  }

  // Utility methods
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getLearnedWordsInArticle(article) {
    return article.targetWords.filter(word => 
      this.learnedWords.has(word.toLowerCase())
    );
  }

  // Progress persistence
  saveReadingProgress() {
    if (!this.progressStorageKey) return;
    
    const progressData = {
      readArticles: Array.from(this.readArticles),
      learnedWords: Array.from(this.learnedWords),
      bookmarkedWords: Array.from(this.bookmarkedWords),
      readingStats: this.readingStats,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.progressStorageKey, JSON.stringify(progressData));
      console.log('📚 Reading progress saved');
    } catch (error) {
      console.warn('Failed to save reading progress:', error);
    }
  }

  loadReadingProgress() {
    if (!this.progressStorageKey) return;
    
    try {
      const savedData = localStorage.getItem(this.progressStorageKey);
      if (!savedData) return;
      
      const progressData = JSON.parse(savedData);
      
      // Check if data is not too old (max 30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - progressData.timestamp > maxAge) {
        localStorage.removeItem(this.progressStorageKey);
        return;
      }
      
      // Restore progress
      this.readArticles = new Set(progressData.readArticles || []);
      this.learnedWords = new Set(progressData.learnedWords || []);
      this.bookmarkedWords = new Set(progressData.bookmarkedWords || []);
      this.readingStats = {
        totalReadingTime: 0,
        articlesRead: 0,
        wordsLearned: 0,
        wordsBookmarked: 0,
        ...progressData.readingStats
      };
      
      console.log('📚 Reading progress restored');
    } catch (error) {
      console.warn('Failed to restore reading progress:', error);
      localStorage.removeItem(this.progressStorageKey);
    }
  }

  refreshContent() {
    const readingContent = document.querySelector('.reading-content');
    if (readingContent) {
      readingContent.innerHTML = this.selectedArticle ? this.renderArticleView() : this.renderArticleList();
    }
    
    // Update dictionary selector
    const dictionarySelect = document.getElementById('reading-dictionary-select');
    if (dictionarySelect && this.dictionaries.length > 0) {
      dictionarySelect.innerHTML = this.dictionaries.map(dict => 
        `<option value="${dict.id}" ${dict.id === this.selectedDictionaryId ? 'selected' : ''}>
          ${dict.display_name}
        </option>`
      ).join('');
    }
    
    // Update statistics
    const statsElements = document.querySelectorAll('.reading-stats .stat-value');
    if (statsElements.length >= 3) {
      statsElements[0].textContent = this.readingStats.articlesRead;
      statsElements[1].textContent = this.readingStats.wordsLearned;
      statsElements[2].textContent = this.formatTime(this.readingStats.totalReadingTime);
    }
  }

  showErrorMessage(message) {
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
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);

    errorDiv.querySelector('.error-close')?.addEventListener('click', () => {
      errorDiv.remove();
    });
  }

  showInfoMessage(message) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
      <div class="info-content">
        <span class="info-icon">ℹ️</span>
        <span class="info-message">${message}</span>
        <button class="info-close">×</button>
      </div>
    `;

    document.body.appendChild(infoDiv);
    
    setTimeout(() => {
      if (infoDiv.parentNode) {
        infoDiv.remove();
      }
    }, 4000);

    infoDiv.querySelector('.info-close')?.addEventListener('click', () => {
      infoDiv.remove();
    });
  }

  cleanup() {
    console.log('Reading page cleanup');
    
    // Save final progress
    this.saveReadingProgress();
    
    // Clean up any modals or tooltips
    const modals = document.querySelectorAll('.word-definition-modal, .bookmarks-modal, .quick-review-modal, .completion-modal');
    modals.forEach(modal => modal.remove());
    
    const notifications = document.querySelectorAll('.error-notification, .info-notification');
    notifications.forEach(notification => notification.remove());
    
    // Clean up audio resources
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }
} 