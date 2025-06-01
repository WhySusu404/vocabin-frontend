import VocabularyService from '../services/vocabularyService.js';

export default class VocabularyLearning {
  constructor(options = {}) {
    this.name = 'VocabularyLearning';
    this.vocabularyService = new VocabularyService();
    
    // Initialize state
    this.dictionaryId = options.dictionaryId;
    this.dictionary = null;
    this.currentWord = null;
    this.progress = null;
    this.session = {
      startTime: null,
      timeElapsed: 0,
      totalAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      isActive: false
    };
    
    // Learning settings
    this.settings = {
      showDefinition: true,
      showExample: true,
      enableAudio: true,
      autoPlay: false,
      shuffleMode: false,
      reviewMode: false
    };
    
    // UI state
    this.isLoading = false;
    this.showAnswer = false;
    this.userAnswer = '';
    this.feedbackMessage = '';
    this.timer = null;
    this.audioEnabled = true;
  }

  render() {
    return `
      <div class="vocabulary-learning">
        ${this.renderHeader()}
        ${this.renderMainContent()}
        ${this.renderSidebar()}
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="learning-header">
        <div class="header-left">
          <button class="back-btn" id="back-btn">
            ← Back to Dictionaries
          </button>
          <div class="dictionary-info">
            <h2>${this.dictionary?.display_name || 'Loading...'}</h2>
            <p class="dictionary-subtitle">${this.dictionary?.description || ''}</p>
          </div>
        </div>
        
        <div class="header-progress">
          ${this.renderProgressInfo()}
        </div>
        
        <div class="header-actions">
          <button class="settings-btn" id="settings-btn" title="Settings">
            ⚙️
          </button>
          <button class="pause-btn" id="pause-btn" title="Pause learning">
            ${this.session.isActive ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
    `;
  }

  renderProgressInfo() {
    if (!this.progress) return '<div class="progress-placeholder">Loading progress...</div>';
    
    const percentage = this.progress.completion_percentage || 0;
    const currentPos = this.progress.current_position || 0;
    const totalWords = this.progress.total_words || 0;
    
    return `
      <div class="progress-info">
        <div class="progress-stats">
          <span class="progress-text">${currentPos} / ${totalWords} words</span>
          <span class="progress-percentage">${percentage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }

  renderMainContent() {
    if (this.isLoading) {
      return `
        <div class="main-content loading">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading your learning session...</p>
          </div>
        </div>
      `;
    }

    if (!this.session.isActive) {
      return `
        <div class="main-content start-screen">
          ${this.renderStartScreen()}
        </div>
      `;
    }

    return `
      <div class="main-content learning-active">
        ${this.renderWordCard()}
        ${this.renderAnswerSection()}
        ${this.renderFeedback()}
      </div>
    `;
  }

  renderStartScreen() {
    return `
      <div class="start-screen-content">
        <div class="start-info">
          <h3>Ready to Learn?</h3>
          <p>You're about to start learning vocabulary from <strong>${this.dictionary?.display_name}</strong></p>
          
          <div class="start-stats">
            <div class="stat-item">
              <span class="stat-label">Total Words</span>
              <span class="stat-value">${this.dictionary?.total_words || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Your Progress</span>
              <span class="stat-value">${this.progress?.completion_percentage || 0}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Words Completed</span>
              <span class="stat-value">${this.progress?.completed_words || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="start-actions">
          <button class="start-learning-btn primary-btn" id="start-learning-btn">
            🚀 Start Learning
          </button>
          <button class="preview-words-btn secondary-btn" id="preview-words-btn">
            👁️ Preview Words
          </button>
        </div>
      </div>
    `;
  }

  renderWordCard() {
    if (!this.currentWord) {
      return `
        <div class="word-card loading">
          <p>Loading next word...</p>
        </div>
      `;
    }

    const word = this.currentWord;
    
    return `
      <div class="word-card">
        <div class="word-header">
          <div class="word-info">
            <h3 class="word-name">${word.name}</h3>
            <div class="word-meta">
              <span class="word-index">Word ${word.index + 1}</span>
              ${word.audioUrl ? `
                <button class="audio-btn" id="audio-btn" data-word="${word.name}">
                  🔊 Play
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="word-content">
          ${this.settings.showDefinition && word.trans ? `
            <div class="word-definition">
              <h4>Definition:</h4>
              <p>${Array.isArray(word.trans) ? word.trans[0] : word.trans}</p>
            </div>
          ` : ''}
          
          ${this.settings.showExample && word.example ? `
            <div class="word-example">
              <h4>Example:</h4>
              <p>${word.example}</p>
            </div>
          ` : ''}
          
          ${word.phonetic ? `
            <div class="word-phonetic">
              <h4>Pronunciation:</h4>
              <p>${word.phonetic}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderAnswerSection() {
    if (this.showAnswer) {
      return this.renderAnswerReview();
    }

    return `
      <div class="answer-section">
        <div class="answer-prompt">
          <h4>How well do you know this word?</h4>
          <p>Rate your understanding or type the meaning</p>
        </div>
        
        <div class="answer-input">
          <textarea 
            id="user-answer" 
            placeholder="Type the meaning of this word..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="answer-actions">
          <div class="difficulty-buttons">
            <button class="difficulty-btn" data-difficulty="1" title="I don't know this word">
              😰 Don't Know
            </button>
            <button class="difficulty-btn" data-difficulty="2" title="I'm not sure">
              🤔 Not Sure
            </button>
            <button class="difficulty-btn" data-difficulty="3" title="I think I know">
              😐 Maybe
            </button>
            <button class="difficulty-btn" data-difficulty="4" title="I know this well">
              😊 I Know
            </button>
            <button class="difficulty-btn" data-difficulty="5" title="I know this perfectly">
              🎯 Perfect
            </button>
          </div>
          
          <div class="submit-actions">
            <button class="submit-btn primary-btn" id="submit-answer-btn">
              ✓ Submit Answer
            </button>
            <button class="skip-btn secondary-btn" id="skip-btn">
              ⏭️ Skip
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAnswerReview() {
    const isCorrect = this.lastAnswerCorrect;
    const correctAnswer = this.currentWord?.trans ? 
      (Array.isArray(this.currentWord.trans) ? this.currentWord.trans[0] : this.currentWord.trans) : 
      'No definition available';

    return `
      <div class="answer-review ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="review-header">
          <div class="result-icon">
            ${isCorrect ? '✅' : '❌'}
          </div>
          <h4>${isCorrect ? 'Correct!' : 'Not quite right'}</h4>
        </div>
        
        <div class="review-content">
          <div class="correct-answer">
            <h5>Correct Answer:</h5>
            <p>${correctAnswer}</p>
          </div>
          
          ${this.userAnswer ? `
            <div class="user-answer">
              <h5>Your Answer:</h5>
              <p>${this.userAnswer}</p>
            </div>
          ` : ''}
          
          ${this.feedbackMessage ? `
            <div class="feedback-message">
              <p>${this.feedbackMessage}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="review-actions">
          <button class="continue-btn primary-btn" id="continue-btn">
            Next Word →
          </button>
          <button class="repeat-audio-btn secondary-btn" id="repeat-audio-btn">
            🔊 Repeat Audio
          </button>
        </div>
      </div>
    `;
  }

  renderFeedback() {
    if (!this.feedbackMessage) return '';
    
    return `
      <div class="feedback-container">
        <div class="feedback-message ${this.lastAnswerCorrect ? 'success' : 'error'}">
          ${this.feedbackMessage}
        </div>
      </div>
    `;
  }

  renderSidebar() {
    return `
      <div class="learning-sidebar">
        ${this.renderSessionStats()}
        ${this.renderLearningSettings()}
        ${this.renderQuickActions()}
      </div>
    `;
  }

  renderSessionStats() {
    const accuracy = this.session.totalAnswered > 0 ? 
      Math.round((this.session.correctAnswers / this.session.totalAnswered) * 100) : 0;
    
    return `
      <div class="stats-card">
        <h4>Session Stats</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Time</span>
            <span class="stat-value" id="session-timer">${this.formatTime(this.session.timeElapsed)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Answered</span>
            <span class="stat-value">${this.session.totalAnswered}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Correct</span>
            <span class="stat-value">${this.session.correctAnswers}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">${accuracy}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Streak</span>
            <span class="stat-value">${this.session.currentStreak}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderLearningSettings() {
    return `
      <div class="settings-card">
        <h4>Settings</h4>
        <div class="settings-list">
          <div class="setting-item">
            <label for="show-definition">Show Definition</label>
            <input type="checkbox" id="show-definition" ${this.settings.showDefinition ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label for="show-example">Show Example</label>
            <input type="checkbox" id="show-example" ${this.settings.showExample ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label for="enable-audio">Enable Audio</label>
            <input type="checkbox" id="enable-audio" ${this.settings.enableAudio ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label for="auto-play">Auto-play Audio</label>
            <input type="checkbox" id="auto-play" ${this.settings.autoPlay ? 'checked' : ''}>
          </div>
        </div>
      </div>
    `;
  }

  renderQuickActions() {
    return `
      <div class="actions-card">
        <h4>Quick Actions</h4>
        <div class="action-buttons">
          <button class="action-btn" id="wrong-words-btn">
            ❌ Review Wrong Words
          </button>
          <button class="action-btn" id="reset-progress-btn">
            🔄 Reset Progress
          </button>
          <button class="action-btn" id="export-progress-btn">
            📊 Export Progress
          </button>
        </div>
      </div>
    `;
  }

  async mount() {
    if (!this.dictionaryId) {
      throw new Error('Dictionary ID is required');
    }
    
    await this.loadLearningData();
    this.bindEvents();
    this.startSessionTimer();
  }

  async loadLearningData() {
    this.isLoading = true;
    this.updateContent();

    try {
      // Load dictionary info and user progress
      const [dictionaryResponse, progressResponse] = await Promise.all([
        this.vocabularyService.getDictionary(this.dictionaryId),
        this.vocabularyService.getDictionaryProgress(this.dictionaryId)
      ]);

      this.dictionary = dictionaryResponse.dictionary;
      this.progress = progressResponse.progress.overall;
      
      console.log('✅ Loaded learning data:', {
        dictionary: this.dictionary.display_name,
        progress: this.progress.completion_percentage + '%'
      });
      
    } catch (error) {
      console.error('❌ Failed to load learning data:', error);
      this.showErrorMessage('Failed to load learning session. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateContent();
    }
  }

  async loadCurrentWord() {
    try {
      const response = await this.vocabularyService.getCurrentWord(this.dictionaryId);
      this.currentWord = response.word;
      this.progress = response.dictionary_progress;
      
      // Auto-play audio if enabled
      if (this.settings.autoPlay && this.settings.enableAudio && this.currentWord?.audioUrl) {
        setTimeout(() => this.playWordAudio(this.currentWord.name), 500);
      }
      
      this.updateContent();
      
    } catch (error) {
      console.error('❌ Failed to load current word:', error);
      this.showErrorMessage('Failed to load next word. Please try again.');
    }
  }

  async submitAnswer(userAnswer, difficulty = 3) {
    try {
      const answerData = {
        dictionaryId: this.dictionaryId,
        word: this.currentWord.name,
        wordIndex: this.currentWord.index,
        isCorrect: difficulty >= 3, // Consider difficulty 3+ as correct
        userAnswer: userAnswer,
        responseTime: Date.now() - this.answerStartTime,
        userDifficulty: difficulty
      };

      const response = await this.vocabularyService.submitWordAnswer(answerData);
      
      // Update session stats
      this.session.totalAnswered++;
      if (answerData.isCorrect) {
        this.session.correctAnswers++;
        this.session.currentStreak++;
        this.session.bestStreak = Math.max(this.session.bestStreak, this.session.currentStreak);
      } else {
        this.session.wrongAnswers++;
        this.session.currentStreak = 0;
      }
      
      // Update progress
      this.progress = response.result.dictionary_progress;
      this.lastAnswerCorrect = answerData.isCorrect;
      this.showAnswer = true;
      
      // Set feedback message
      this.feedbackMessage = answerData.isCorrect ? 
        this.getPositiveFeedback() : 
        this.getNegativeFeedback();
      
      // Load next word data for quick transition
      if (response.result.next_word) {
        this.nextWord = response.result.next_word;
      }
      
      this.updateContent();
      
    } catch (error) {
      console.error('❌ Failed to submit answer:', error);
      this.showErrorMessage('Failed to submit answer. Please try again.');
    }
  }

  async continueToNextWord() {
    this.showAnswer = false;
    this.userAnswer = '';
    this.feedbackMessage = '';
    this.answerStartTime = Date.now();
    
    if (this.nextWord) {
      this.currentWord = this.nextWord;
      this.nextWord = null;
      this.updateContent();
    } else {
      await this.loadCurrentWord();
    }
  }

  async playWordAudio(word) {
    if (!this.audioEnabled || !this.settings.enableAudio) return;
    
    try {
      await this.vocabularyService.playWordAudio(word);
    } catch (error) {
      console.log('Audio playback failed:', error.message);
    }
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      // Navigate back to dictionary selection page
      window.location.hash = 'dictionaries';
    });

    // Start learning
    const startBtn = document.getElementById('start-learning-btn');
    startBtn?.addEventListener('click', () => this.startLearning());

    // Audio button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'audio-btn') {
        const word = e.target.dataset.word;
        this.playWordAudio(word);
      }
    });

    // Difficulty buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('difficulty-btn')) {
        const difficulty = parseInt(e.target.dataset.difficulty);
        const userAnswer = document.getElementById('user-answer')?.value || '';
        this.submitAnswer(userAnswer, difficulty);
      }
    });

    // Submit answer
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn?.addEventListener('click', () => {
      const userAnswer = document.getElementById('user-answer')?.value || '';
      this.submitAnswer(userAnswer, 3); // Default to neutral difficulty
    });

    // Continue to next word
    document.addEventListener('click', (e) => {
      if (e.target.id === 'continue-btn') {
        this.continueToNextWord();
      }
    });

    // Settings checkboxes
    document.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.handleSettingChange(e.target.id, e.target.checked);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
      }
      
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        if (this.currentWord) {
          this.playWordAudio(this.currentWord.name);
        }
      }
    });
  }

  async startLearning() {
    this.session.isActive = true;
    this.session.startTime = Date.now();
    this.answerStartTime = Date.now();
    
    await this.loadCurrentWord();
  }

  startSessionTimer() {
    this.timer = setInterval(() => {
      if (this.session.isActive && this.session.startTime) {
        this.session.timeElapsed = Math.floor((Date.now() - this.session.startTime) / 1000);
        this.updateSessionTimer();
      }
    }, 1000);
  }

  updateSessionTimer() {
    const timerDisplay = document.getElementById('session-timer');
    if (timerDisplay) {
      timerDisplay.textContent = this.formatTime(this.session.timeElapsed);
    }
  }

  handleSettingChange(settingId, value) {
    switch (settingId) {
      case 'show-definition':
        this.settings.showDefinition = value;
        break;
      case 'show-example':
        this.settings.showExample = value;
        break;
      case 'enable-audio':
        this.settings.enableAudio = value;
        break;
      case 'auto-play':
        this.settings.autoPlay = value;
        break;
    }
    
    this.updateContent();
  }

  getPositiveFeedback() {
    const messages = [
      'Great job! 🎉',
      'Excellent! Keep it up! ⭐',
      'Perfect! You\'re on fire! 🔥',
      'Well done! 👏',
      'Fantastic! 🌟',
      'You\'re doing amazing! 💪'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getNegativeFeedback() {
    const messages = [
      'Don\'t worry, keep practicing! 💪',
      'That\'s okay, you\'ll get it next time! 🌱',
      'Learning takes time, stay strong! 🚀',
      'Every mistake is a step forward! 📈',
      'You\'re improving with each try! ⭐',
      'Keep going, you\'ve got this! 🎯'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  updateContent() {
    const container = document.querySelector('.vocabulary-learning');
    if (container) {
      container.innerHTML = this.render();
      this.bindEvents();
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
    setTimeout(() => errorDiv.remove(), 5000);
    
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
      errorDiv.remove();
    });
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('VocabularyLearning cleanup');
  }
} 