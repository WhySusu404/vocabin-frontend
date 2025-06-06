import VocabularyService from '../services/vocabularyService.js';

export default class ListeningPage {
  constructor(route = null) {
    this.name = 'ListeningPage';
    this.vocabularyService = new VocabularyService();
    this.dictionaries = []; // Available dictionaries
    this.selectedDictionaryId = null; // Currently selected dictionary
    this.dictionary = null;
    this.currentWord = null;
    this.progress = null;
    
    // Parse dictionary ID from route query parameters
    if (route && route.query && route.query.dictionary) {
      this.selectedDictionaryId = route.query.dictionary;
      console.log('🔍 DEBUG: Listening Dictionary ID from route:', this.selectedDictionaryId);
    }
    
    // Session state
    this.session = {
      timeElapsed: 0,
      inputCount: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      isActive: false
    };
    
    // Learning state
    this.timer = null;
    this.startTime = null;
    this.currentTypingPosition = 0;
    this.isTypingWord = false;
    this.keyboardHandler = null;
    this.sessionStorageKey = null; // Will be set when selectedDictionaryId is available
    this.currentWordFailureCount = 0;
    this.maxFailuresPerWord = 3;
    this.audioElement = null;
    this.userInput = []; // Track what user has typed
    this.autoReplayEnabled = true;
    this.hintEnabled = false;
    this.playbackSpeed = 'normal';
  }

  // Helper method to get user ID for session storage
  async getUserId() {
    const { default: apiService } = await import('../services/api.js');
    const currentUser = apiService.getCurrentUser();
    return currentUser ? (currentUser.userId || currentUser.id || currentUser._id || currentUser.email) : 'anonymous';
  }

  render() {
    return `
      <div class="vocabulary-container">
        ${this.renderLeftPanel()}
        ${this.renderMainArea()}
        ${this.renderRightPanel()}
      </div>
    `;
  }

  renderLeftPanel() {
    return `
      <div class="vocabulary-left-panel">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Time</span>
            <span class="stat-value" id="timer-display">${this.formatTime(this.session.timeElapsed)}</span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Words</span>
            <span class="stat-value" id="input-count">${this.session.inputCount}</span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Correct</span>
            <span class="stat-value" id="correct-count">${this.session.correctCount}</span>
          </div>
        </div>

        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value" id="accuracy-display">${this.session.accuracy}%</span>
          </div>
        </div>
      </div>
    `;
  }

  renderMainArea() {
    return `
      <div class="vocabulary-main-area">
        <div class="practice-zone" id="practice-zone">
          <div class="start-message">
            <h2>Click or Press any key to start listening</h2>
            <p>Dictionary: ${this.dictionary?.display_name || 'Loading...'}</p>
          </div>
          <div class="word-practice" id="word-practice" style="display: none;">
            <div class="word-display-section" id="word-display-section">
              <div class="word-info">
                <h3 class="word-title" id="word-title">Loading...</h3>
                <div class="word-actions">
                  <button class="audio-btn" id="play-audio-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                    Play Audio
                  </button>
                </div>
              </div>
              <div class="word-meaning" id="word-meaning">
                <p><strong>Listen carefully and type the word you hear</strong></p>
              </div>
            </div>
            <div class="word-typing-area">
              <div class="visual-word-input" id="visual-word-input"></div>
              <div class="word-feedback" id="word-feedback"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderRightPanel() {
    return `
      <div class="vocabulary-right-panel">
        <div class="dictionary-selector-card">
          <h3>Material Name</h3>
          <div class="dictionary-dropdown-container">
            <select id="dictionary-select" class="dictionary-dropdown">
              ${this.dictionaries.map(dict => 
                `<option value="${dict.id}" ${dict.id === this.selectedDictionaryId ? 'selected' : ''}>
                  ${dict.display_name} (${dict.progress ? dict.progress.completed_words || 0 : 0}/${dict.total_words})
                </option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="chapter-card">
          <h3>Sentences</h3>
          <p class="chapter-number" id="progress-info">
            ${this.progress ? `${this.progress.completed_words}/${this.dictionary?.total_words || 0}` : '400'}
          </p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <span class="setting-label">Auto replay</span>
            <div class="setting-control">
              <span class="setting-status">ON</span>
              <sl-switch id="auto-replay-switch" checked></sl-switch>
            </div>
          </div>
        </div>

        <div class="language-card">
          <div class="setting-item">
            <sl-select value="normal" id="speed-select">
              <sl-option value="slow">Slow</sl-option>
              <sl-option value="normal">Normal</sl-option>
              <sl-option value="fast">Fast</sl-option>
            </sl-select>
            <span class="setting-label">Show hint</span>
            <div class="setting-control">
              <span class="setting-status">OFF</span>
              <sl-switch id="hint-switch"></sl-switch>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async mount() {
    // Load available dictionaries
    await this.loadDictionaries();
    
    if (this.dictionaries.length === 0) {
      console.log('🔍 DEBUG: No dictionaries available');
      this.showErrorMessage('No dictionaries available');
      return;
    }
    
    // Set first dictionary as default if none selected
    if (!this.selectedDictionaryId) {
      this.selectedDictionaryId = this.dictionaries[0].id;
    }

    // **CRITICAL FIX**: Set up session storage key with user ID
    const userId = await this.getUserId();
    this.sessionStorageKey = `vocabin_listening_session_${userId}_${this.selectedDictionaryId}`;

    // Load dictionary and progress data
    await this.loadLearningData();
    
    // Restore session state if available
    this.restoreSessionState();
    
    // Bind events and setup
    this.bindEvents();
    this.setupKeyboardListeners();
    this.setupAudio();
  }

  async loadDictionaries() {
    try {
      console.log('🔍 DEBUG: Starting loadDictionaries...');
      
      const dictResponse = await this.vocabularyService.getDictionaries();
      this.dictionaries = dictResponse.dictionaries;
      console.log('🔍 DEBUG: Dictionaries loaded:', this.dictionaries);
      
      // Load progress data for each dictionary
      await this.loadDictionariesProgress();
      
      // Update the dropdown with loaded dictionaries
      this.updateDictionaryDropdown();
      
    } catch (error) {
      console.error('❌ Failed to load dictionaries:', error);
      this.showErrorMessage('Failed to load dictionaries. Please try again.');
    }
  }

  async loadDictionariesProgress() {
    try {
      console.log('🔍 DEBUG: Loading progress for all dictionaries...');
      
      // Load progress for each dictionary
      for (let dict of this.dictionaries) {
        try {
          const progressResponse = await this.vocabularyService.getDictionaryProgress(dict.id);
          dict.progress = progressResponse.progress.overall; // Store the overall progress
          console.log('🔍 DEBUG: Progress for', dict.display_name, ':', dict.progress.completed_words);
        } catch (error) {
          // **CRITICAL FIX**: For fresh users, no progress is normal - don't show errors
          console.log('🔍 DEBUG: No progress found for', dict.display_name, '(normal for fresh users)');
          dict.progress = { 
            completed_words: 0,
            status: 'not_started',
            accuracy_rate: 0,
            current_position: 0
          }; // Default progress for fresh users
        }
      }
    } catch (error) {
      console.error('❌ Failed to load dictionaries progress:', error);
    }
  }

  updateDictionaryDropdown() {
    const dictionarySelect = document.getElementById('dictionary-select');
    if (dictionarySelect && this.dictionaries.length > 0) {
      dictionarySelect.innerHTML = this.dictionaries.map(dict => 
        `<option value="${dict.id}" ${dict.id === this.selectedDictionaryId ? 'selected' : ''}>
          ${dict.display_name} (${dict.progress ? dict.progress.completed_words || 0 : 0}/${dict.total_words})
        </option>`
      ).join('');
    }
  }

  async loadLearningData() {
    try {
      // Load dictionary info
      const dictResponse = await this.vocabularyService.getDictionary(this.selectedDictionaryId);
      this.dictionary = dictResponse.dictionary;
      
      // Update UI with dictionary info
      const dictNameEl = document.getElementById('dictionary-name');
      if (dictNameEl) dictNameEl.textContent = this.dictionary.display_name;
      
      // Load user progress - handle fresh users gracefully
      try {
        const progressResponse = await this.vocabularyService.getDictionaryProgress(this.selectedDictionaryId);
        this.progress = progressResponse.progress;
      } catch (progressError) {
        // **CRITICAL FIX**: For fresh users, no progress is normal
        console.log('🔍 DEBUG: No progress found (normal for fresh users):', progressError.message);
        this.progress = null; // Will be initialized when user starts practice
      }
      
      // Update progress info
      this.updateProgressDisplay();
      
    } catch (error) {
      console.error('❌ Failed to load learning data:', error);
      this.showErrorMessage('Failed to load dictionary data. Please try again.');
    }
  }

  bindEvents() {
    const practiceZone = document.getElementById('practice-zone');
    const playAudioBtn = document.getElementById('play-audio-btn');
    const autoReplaySwitch = document.getElementById('auto-replay-switch');
    const speedSelect = document.getElementById('speed-select');
    const hintSwitch = document.getElementById('hint-switch');
    const dictionarySelect = document.getElementById('dictionary-select');

    // Dictionary selection
    dictionarySelect?.addEventListener('change', async (e) => {
      const newDictionaryId = e.target.value;
      if (newDictionaryId !== this.selectedDictionaryId) {
        await this.changeDictionary(newDictionaryId);
      }
    });

    // Start practice on click
    practiceZone?.addEventListener('click', () => {
      this.startPractice();
    });

    // Audio controls
    playAudioBtn?.addEventListener('click', () => {
      this.playCurrentAudio();
    });

    // Settings toggles
    autoReplaySwitch?.addEventListener('sl-change', (e) => {
      this.autoReplayEnabled = e.target.checked;
      const statusEl = autoReplaySwitch.parentElement.querySelector('.setting-status');
      statusEl.textContent = e.target.checked ? 'ON' : 'OFF';
    });

    speedSelect?.addEventListener('sl-change', (e) => {
      this.playbackSpeed = e.target.value;
    });

    hintSwitch?.addEventListener('sl-change', (e) => {
      this.hintEnabled = e.target.checked;
      const statusEl = hintSwitch.parentElement.querySelector('.setting-status');
      statusEl.textContent = e.target.checked ? 'ON' : 'OFF';
      if (e.target.checked) {
        this.showHint();
      } else {
        this.hideHint();
      }
    });
  }

  setupKeyboardListeners() {
    this.keyboardHandler = (e) => {
      if (!this.session.isActive && e.target.tagName !== 'INPUT') {
        this.startPractice();
        return;
      }
      
      if (this.session.isActive && this.isTypingWord) {
        this.handleCharacterInput(e);
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  setupAudio() {
    this.audioElement = new Audio();
    this.audioElement.addEventListener('ended', () => {
      // Auto-enable typing after audio finishes
      if (this.session.isActive) {
        this.isTypingWord = true;
      }
    });
  }

  async startPractice() {
    if (this.session.isActive) return;

    this.session.isActive = true;
    
    // Cap restored time to prevent unrealistic values (max 24 hours)
    const maxTimeElapsed = 24 * 60 * 60; // 24 hours in seconds
    const cappedTimeElapsed = Math.min(this.session.timeElapsed, maxTimeElapsed);
    
    this.startTime = Date.now() - (cappedTimeElapsed * 1000); // Account for restored time
    
    // Hide start message, show practice area
    const startMessage = document.querySelector('.start-message');
    const wordPractice = document.getElementById('word-practice');
    
    if (startMessage) startMessage.style.display = 'none';
    if (wordPractice) wordPractice.style.display = 'block';

    // Start timer
    this.timer = setInterval(() => {
      this.updateTimer();
      this.saveSessionState(); // Save state periodically
    }, 1000);

    // Load next word if we don't have a current word, otherwise resume
    if (!this.currentWord) {
      await this.loadNextWord();
    } else {
      // Resume existing word
      this.updateWordDisplay();
      this.createVisualWordDisplay();
      this.isTypingWord = true;
    }
  }

  async loadNextWord() {
    try {
      // Clear any existing visual state first
      this.clearCurrentWordDisplay();
      
      const response = await this.vocabularyService.getCurrentWord(this.selectedDictionaryId);
      
      this.currentWord = response.word;
      this.progress = response.dictionary_progress;
      
      // Reset failure count for new word
      this.currentWordFailureCount = 0;
      
      // Update progress info
      this.updateProgressDisplay();

      // Update word display
      this.updateWordDisplay();

      // Setup typing interface
      this.currentTypingPosition = 0;
      this.isTypingWord = false; // Don't allow typing until audio is played
      this.userInput = []; // Reset user input
      this.createVisualWordDisplay();

      // Play audio automatically
      this.playCurrentAudio();

      // Clear feedback
      const feedback = document.getElementById('word-feedback');
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'word-feedback';
      }
      
      // Save session state
      this.saveSessionState();
      
    } catch (error) {
      console.error('❌ Failed to load next word:', error);
      this.showErrorMessage('Failed to load next word. Please try again.');
      
      // If loading next word fails, try to restore typing state
      setTimeout(() => {
        this.isTypingWord = true;
      }, 2000);
    }
  }

  updateWordDisplay() {
    if (!this.currentWord) {
      console.warn('⚠️ No current word to display');
      return;
    }
    
    // Update word display - For listening mode, don't show translation
    const wordTitle = document.getElementById('word-title');
    const wordMeaning = document.getElementById('word-meaning');
    
    if (wordTitle) {
      // For listening mode, show generic title instead of translation
      wordTitle.textContent = 'Listen and Type the Word';
    }
    
    if (wordMeaning) {
      // Show pronunciation with US/UK labels and the instruction
      const usPhone = this.currentWord.usphone;
      const ukPhone = this.currentWord.ukphone;
      
      let pronunciationHtml = '';
      if (usPhone || ukPhone) {
        pronunciationHtml += '<div class="pronunciation-container" style="margin-top: 15px; margin-bottom: 15px;">';
        if (usPhone) {
          pronunciationHtml += `<span class="pronunciation-item">🇺🇸 US: /${usPhone}/</span>`;
        }
        if (ukPhone && ukPhone !== usPhone) {
          pronunciationHtml += `<span class="pronunciation-item">🇬🇧 UK: /${ukPhone}/</span>`;
        }
        pronunciationHtml += '</div>';
      }
      
      wordMeaning.innerHTML = pronunciationHtml;
    }
  }

  clearCurrentWordDisplay() {
    // Clear any visual feedback
    const wordCharacters = document.getElementById('word-characters');
    if (wordCharacters) {
      wordCharacters.classList.remove('shake');
    }
    
    // Clear feedback
    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'word-feedback';
    }
  }

  createVisualWordDisplay() {
    const visualWordInput = document.getElementById('visual-word-input');
    if (!visualWordInput || !this.currentWord) {
      return;
    }

    // User types the English word (name field) - show underscores and user input
    const targetWord = this.currentWord.name;
    const charactersHtml = targetWord.split('').map((char, index) => {
      const displayChar = this.userInput[index] || '_';
      const isCorrect = this.userInput[index] && this.userInput[index].toLowerCase() === char.toLowerCase();
      const isTyped = this.userInput[index] !== undefined;
      
      let cssClass = 'char';
      if (isTyped) {
        cssClass += isCorrect ? ' correct' : ' incorrect';
      }
      
      return `<span class="${cssClass}" data-index="${index}">${displayChar}</span>`;
    }).join('');

    visualWordInput.innerHTML = `
      <div class="word-characters" id="word-characters">
        ${charactersHtml}
      </div>
    `;
  }

  playCurrentAudio() {
    if (!this.currentWord) return;

    try {
      // Use Youdao API for audio like VocabularyPage
      const audioUrl = this.vocabularyService.generateAudioUrl(this.currentWord.name);
      const audio = new Audio(audioUrl);
      
      // Set playback speed
      audio.playbackRate = this.getPlaybackSpeed();
      
      // Add error handling for audio loading
      audio.addEventListener('error', () => {
        this.fallbackToTTS();
      });
      
      audio.addEventListener('ended', () => {
        this.isTypingWord = true;
      });
      
      audio.play().catch((error) => {
        this.fallbackToTTS();
      });
      
    } catch (error) {
      this.fallbackToTTS();
    }
  }

  fallbackToTTS() {
    // Fallback to text-to-speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(this.currentWord.name);
      utterance.lang = 'en-US';
      utterance.rate = this.getPlaybackSpeed();
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        this.isTypingWord = true;
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback: enable typing immediately
      this.isTypingWord = true;
    }
  }

  getPlaybackSpeed() {
    switch(this.playbackSpeed) {
      case 'slow': return 0.7;
      case 'fast': return 1.3;
      default: return 1.0;
    }
  }

  handleCharacterInput(e) {
    if (!this.session.isActive || !this.currentWord || !this.isTypingWord) return;

    // Ignore special keys
    if (e.key.length > 1 && e.key !== 'Backspace') return;

    e.preventDefault();

    const targetWord = this.currentWord.name.toLowerCase();
    const typedChar = e.key.toLowerCase();

    if (e.key === 'Backspace') {
      this.handleBackspace();
      return;
    }

    // Store the user input and check if it's correct
    if (this.currentTypingPosition < targetWord.length) {
      this.userInput[this.currentTypingPosition] = e.key;
      const isCorrect = typedChar === targetWord[this.currentTypingPosition];
      
      if (isCorrect) {
        this.currentTypingPosition++;
        
        // Refresh display
        this.createVisualWordDisplay();
        
        // Check if word is complete
        if (this.currentTypingPosition === targetWord.length) {
          this.completeWord(true);
        }
      } else {
        // Wrong character - refresh display first, then handle error
        this.createVisualWordDisplay();
        this.handleWrongCharacter(typedChar);
      }
    }
  }

  handleWrongCharacter(typedChar) {
    // Increment failure count for current word
    this.currentWordFailureCount++;
    
    // Check if max failures reached
    if (this.currentWordFailureCount >= this.maxFailuresPerWord) {
      // Add word to wrong words and move to next
      setTimeout(() => {
        this.handleMaxFailures();
      }, 200);
    } else {
      // After a brief delay, shake and reset
      setTimeout(() => {
        this.shakeWordAndReset();
      }, 200);
    }
  }

  handleBackspace() {
    if (this.currentTypingPosition > 0) {
      this.currentTypingPosition--;
      this.userInput[this.currentTypingPosition] = undefined;
      this.createVisualWordDisplay();
    }
  }

  shakeWordAndReset() {
    const wordCharacters = document.getElementById('word-characters');
    if (wordCharacters) {
      wordCharacters.classList.add('shake');
      
      setTimeout(() => {
        wordCharacters.classList.remove('shake');
        this.resetWordProgress();
      }, 600);
    }
  }

  resetWordProgress() {
    this.currentTypingPosition = 0;
    this.userInput = []; // Clear user input
    this.createVisualWordDisplay(); // Refresh display
    
    // Auto-replay if enabled
    if (this.autoReplayEnabled) {
      setTimeout(() => {
        this.playCurrentAudio();
      }, 500);
    } else {
      this.isTypingWord = true;
    }
  }

  async handleMaxFailures() {
    this.isTypingWord = false;
    this.session.inputCount++;
    this.session.wrongCount++;

    // Clear the current word display immediately
    const wordCharacters = document.getElementById('word-characters');
    if (wordCharacters) {
      wordCharacters.classList.add('shake');
    }

    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      feedback.textContent = `Too many attempts! The word was: ${this.currentWord.name}`;
      feedback.className = 'word-feedback incorrect';
    }

    const failedWord = this.currentWord?.name; // Store the failed word name

    try {
      // Submit as incorrect answer to advance in the backend
      await this.vocabularyService.submitWordAnswer({
        dictionaryId: this.selectedDictionaryId,
        word: this.currentWord.name,
        wordIndex: this.currentWord.index,
        isCorrect: false,
        userAnswer: '',
        responseTime: 0
      });

      this.updateStats();

      // Load next word after brief delay
      setTimeout(async () => {
        await this.loadNextWordWithRetry(failedWord);
      }, 2000);

    } catch (error) {
      this.showErrorMessage('Failed to process answer. Please try again.');
      // Still try to load next word even if there was an error
      setTimeout(async () => {
        await this.loadNextWordWithRetry(failedWord);
      }, 2000);
    }
  }

  async loadNextWordWithRetry(previousWord, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Clear any existing visual state first
        this.clearCurrentWordDisplay();
        
        const response = await this.vocabularyService.getCurrentWord(this.selectedDictionaryId);
        
        // Check if we got a different word
        if (response.word && response.word.name !== previousWord) {
          this.currentWord = response.word;
          this.progress = response.dictionary_progress;
          
          // Reset failure count for new word
          this.currentWordFailureCount = 0;
          
          // Update progress info
          this.updateProgressDisplay();

          // Update word display
          this.updateWordDisplay();

          // Setup typing interface
          this.currentTypingPosition = 0;
          this.isTypingWord = false; // Don't allow typing until audio is played
          this.userInput = []; // Reset user input
          this.createVisualWordDisplay();

          // Play audio automatically
          this.playCurrentAudio();

          // Clear feedback
          const feedback = document.getElementById('word-feedback');
          if (feedback) {
            feedback.textContent = '';
            feedback.className = 'word-feedback';
          }
          
          // Save session state
          this.saveSessionState();
          return; // Success!
          
        } else {
          console.warn(`⚠️ API returned same word "${response.word?.name}", retrying...`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error('❌ All attempts failed, falling back to regular loadNextWord');
          await this.loadNextWord();
          return;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    console.warn('⚠️ Could not get different word after retries, using what we have');
    // If we can't get a different word, at least reset the current one
    this.currentWordFailureCount = 0;
    this.currentTypingPosition = 0;
    this.userInput = [];
    this.createVisualWordDisplay();
    this.playCurrentAudio();
  }

  async completeWord(isCorrect) {
    this.isTypingWord = false;
    this.session.inputCount++;
    
    if (isCorrect) {
      this.session.correctCount++;
    } else {
      this.session.wrongCount++;
    }

    try {
      // Submit answer to backend
      await this.vocabularyService.submitWordAnswer({
        dictionaryId: this.selectedDictionaryId,
        word: this.currentWord.name,
        wordIndex: this.currentWord.index,
        isCorrect,
        userAnswer: isCorrect ? this.currentWord.name : '',
        responseTime: 0 // Could track actual response time
      });

      const feedback = document.getElementById('word-feedback');
      if (feedback) {
        if (isCorrect) {
          feedback.textContent = 'Correct! ✓';
          feedback.className = 'word-feedback correct';
        } else {
          feedback.textContent = `Incorrect. The word was: ${this.currentWord.name}`;
          feedback.className = 'word-feedback incorrect';
        }
      }

      this.updateStats();

      // Load next word after a delay
      setTimeout(() => {
        this.loadNextWord();
      }, 2000);

    } catch (error) {
      this.showErrorMessage('Failed to submit answer. Please try again.');
    }
  }

  showHint() {
    if (!this.currentWord) return;

    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      const word = this.currentWord.name;
      const hintText = `${word.length} letters, starts with "${word[0]}"`;
      feedback.textContent = `Hint: ${hintText}`;
      feedback.className = 'word-feedback hint';
    }
  }

  hideHint() {
    const feedback = document.getElementById('word-feedback');
    if (feedback && feedback.classList.contains('hint')) {
      feedback.textContent = '';
      feedback.className = 'word-feedback';
    }
  }

  updateTimer() {
    if (!this.startTime) return;
    
    this.session.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = this.formatTime(this.session.timeElapsed);
    }
  }

  updateStats() {
    // Update words count (total attempts)
    const inputCount = document.getElementById('input-count');
    if (inputCount) inputCount.textContent = this.session.inputCount;

    // Update correct count
    const correctCount = document.getElementById('correct-count');
    if (correctCount) correctCount.textContent = this.session.correctCount;

    // Update accuracy - now includes both correct and wrong in total
    const totalAttempts = this.session.correctCount + this.session.wrongCount;
    this.session.accuracy = totalAttempts > 0 
      ? Math.round((this.session.correctCount / totalAttempts) * 100)
      : 0;
    
    const accuracyDisplay = document.getElementById('accuracy-display');
    if (accuracyDisplay) accuracyDisplay.textContent = `${this.session.accuracy}%`;
    
    // Save session state after updating stats
    this.saveSessionState();
  }

  updateProgressDisplay() {
    const progressInfoEl = document.getElementById('progress-info');
    if (progressInfoEl) {
      if (this.dictionary) {
        // Use session correct count for progress instead of backend completed_words
        progressInfoEl.textContent = `${this.session.correctCount}/${this.dictionary.total_words}`;
      } else {
        progressInfoEl.textContent = '0/0';
      }
    }
  }

  formatTime(seconds) {
    // Cap the maximum time at 24 hours to prevent unrealistic values
    const maxSeconds = 24 * 60 * 60; // 24 hours
    const clampedSeconds = Math.min(seconds, maxSeconds);
    
    const hours = Math.floor(clampedSeconds / 3600);
    const minutes = Math.floor((clampedSeconds % 3600) / 60);
    const remainingSeconds = clampedSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    errorDiv.querySelector('.error-close').addEventListener('click', () => {
      errorDiv.remove();
    });
  }

  saveSessionState() {
    if (!this.sessionStorageKey) return;
    
    const sessionData = {
      ...this.session,
      currentWord: this.currentWord,
      progress: this.progress,
      currentTypingPosition: this.currentTypingPosition,
      isTypingWord: this.isTypingWord,
      startTime: this.startTime,
      currentWordFailureCount: this.currentWordFailureCount,
      userInput: this.userInput,
      autoReplayEnabled: this.autoReplayEnabled,
      hintEnabled: this.hintEnabled,
      playbackSpeed: this.playbackSpeed,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.sessionStorageKey, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  }

  restoreSessionState() {
    if (!this.sessionStorageKey) return;
    
    try {
      const savedData = localStorage.getItem(this.sessionStorageKey);
      if (!savedData) return;
      
      const sessionData = JSON.parse(savedData);
      
      // Check if session data is not too old (max 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - sessionData.timestamp > maxAge) {
        localStorage.removeItem(this.sessionStorageKey);
        return;
      }
      
      // Restore session state
      // Cap time to prevent unrealistic values (max 24 hours)
      const maxTimeElapsed = 24 * 60 * 60; // 24 hours in seconds
      const cappedTimeElapsed = Math.min(sessionData.timeElapsed || 0, maxTimeElapsed);
      
      this.session = {
        timeElapsed: cappedTimeElapsed,
        inputCount: sessionData.inputCount || 0,
        correctCount: sessionData.correctCount || 0,
        wrongCount: sessionData.wrongCount || 0,
        accuracy: sessionData.accuracy || 0,
        isActive: false
      };
      
      this.currentWord = sessionData.currentWord;
      this.progress = sessionData.progress;
      this.currentTypingPosition = sessionData.currentTypingPosition || 0;
      this.isTypingWord = false; // User needs to click to resume
      this.currentWordFailureCount = sessionData.currentWordFailureCount || 0;
      this.userInput = sessionData.userInput || [];
      this.autoReplayEnabled = sessionData.autoReplayEnabled !== undefined ? sessionData.autoReplayEnabled : true;
      this.hintEnabled = sessionData.hintEnabled !== undefined ? sessionData.hintEnabled : false;
      this.playbackSpeed = sessionData.playbackSpeed || 'normal';
      
      // Update settings controls
      const autoReplaySwitch = document.getElementById('auto-replay-switch');
      if (autoReplaySwitch) {
        autoReplaySwitch.checked = this.autoReplayEnabled;
        const statusEl = autoReplaySwitch.parentElement.querySelector('.setting-status');
        statusEl.textContent = this.autoReplayEnabled ? 'ON' : 'OFF';
      }
      
      const hintSwitch = document.getElementById('hint-switch');
      if (hintSwitch) {
        hintSwitch.checked = this.hintEnabled;
        const statusEl = hintSwitch.parentElement.querySelector('.setting-status');
        statusEl.textContent = this.hintEnabled ? 'ON' : 'OFF';
      }
      
      const speedSelect = document.getElementById('speed-select');
      if (speedSelect) {
        speedSelect.value = this.playbackSpeed;
      }
      
      // Update UI with restored stats
      this.updateStats();
      this.updateProgressDisplay();
      
      // If there was an active session, show the word but don't auto-start
      if (sessionData.isActive && this.currentWord) {
        this.showRestoredSession();
      }
      
    } catch (error) {
      console.warn('Failed to restore session state:', error);
      localStorage.removeItem(this.sessionStorageKey);
    }
  }

  showRestoredSession() {
    const startMessage = document.querySelector('.start-message');
    if (startMessage) {
      const progressText = this.dictionary ? 
        `${this.session.correctCount}/${this.dictionary.total_words} words completed` : 
        'Progress loading...';
        
      startMessage.innerHTML = `
        <h2>Listening Session Restored</h2>
        <p>Dictionary: ${this.dictionary?.display_name || 'Loading...'}</p>
        <p>Session: ${this.session.inputCount} words practiced, ${this.session.accuracy}% accuracy</p>
        <p>Dictionary Progress: ${progressText}</p>
        <p>Click to continue listening practice</p>
      `;
    }
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    
    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // Stop any playing audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    
    // Save final session state before cleanup
    this.saveSessionState();
    
    
  }

  async changeDictionary(newDictionaryId) {
    console.log('🔍 DEBUG: Changing dictionary to:', newDictionaryId);
    
    // Save current session state before switching
    this.saveSessionState();
    
    // Reset session state for new dictionary
    this.session = {
      timeElapsed: 0,
      inputCount: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      isActive: false
    };
    
    // Clear current state
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.currentWord = null;
    this.progress = null;
    this.isTypingWord = false;
    this.userInput = [];
    
    // Update selected dictionary
    this.selectedDictionaryId = newDictionaryId;
    
    // **CRITICAL FIX**: Update session storage key with user ID
    const userId = await this.getUserId();
    this.sessionStorageKey = `vocabin_listening_session_${userId}_${this.selectedDictionaryId}`;
    
    // Restore session state for new dictionary
    this.restoreSessionState();
    
    // Load new dictionary data
    await this.loadLearningData();
    
    // Update the dropdown with latest progress
    await this.loadDictionariesProgress();
    this.updateDictionaryDropdown();
    
    // Update UI
    this.updateStats();
    this.updateProgressDisplay();
    
    // Reset practice area
    const startMessage = document.querySelector('.start-message');
    const wordPractice = document.getElementById('word-practice');
    
    if (startMessage) startMessage.style.display = 'block';
    if (wordPractice) wordPractice.style.display = 'none';
    
    console.log('🔍 DEBUG: Dictionary changed successfully');
  }
} 