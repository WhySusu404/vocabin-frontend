import VocabularyService from '../services/vocabularyService.js';

export default class VocabularyPage {
  constructor(route = null) {
    this.name = 'VocabularyPage';
    this.vocabularyService = new VocabularyService();
    this.dictionaries = []; // Available dictionaries
    this.selectedDictionaryId = null; // Currently selected dictionary
    this.dictionary = null;
    this.currentWord = null;
    this.progress = null;
    
    // Parse dictionary ID from route query parameters
    if (route && route.query && route.query.dictionary) {
      this.selectedDictionaryId = route.query.dictionary;
      console.log('🔍 DEBUG: Dictionary ID from route:', this.selectedDictionaryId);
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
    this.audioEnabled = true;
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
            <h2>Click or Press any key to start learning</h2>
            <p>Dictionary: ${this.dictionary?.display_name || 'Loading...'}</p>
          </div>
          <div class="word-practice" id="word-practice" style="display: none;">
            <div class="word-display-section" id="word-display-section">
              <div class="word-info">
                <h3 class="word-title" id="word-title">Loading...</h3>
                <div class="word-actions">
                  <button class="audio-btn" id="play-audio-btn" style="${this.audioEnabled ? '' : 'display: none;'}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                    Play Audio
                  </button>
                </div>
              </div>
              <div class="word-meaning" id="word-meaning">
                <p><strong>What does this word mean?</strong></p>
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
          <h3>Dictionary</h3>
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
          <h3>Progress</h3>
          <p class="chapter-number" id="progress-info">
            ${this.progress ? `${this.progress.completed_words}/${this.dictionary?.total_words || 0}` : '0/0'}
          </p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <span class="setting-label">Audio mode</span>
            <div class="setting-control">
              <span class="setting-status">ON</span>
              <sl-switch id="audio-switch" checked></sl-switch>
            </div>
          </div>
        </div>

        <div class="language-card">
          <div class="setting-item">
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
    console.log('🔍 DEBUG: VocabularyPage mount started');
    
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
    
    console.log('🔍 DEBUG: Selected Dictionary ID:', this.selectedDictionaryId);

    // **CRITICAL FIX**: Set up session storage key with user ID
    const userId = await this.getUserId();
    this.sessionStorageKey = `vocabin_session_${userId}_${this.selectedDictionaryId}`;
    console.log('🔍 DEBUG: Session storage key set to:', this.sessionStorageKey);

    // **CRITICAL FIX**: Restore session state FIRST (for timing/UI state)
    this.restoreSessionState();
    console.log('🔍 DEBUG: Session restored with values:', this.session);

    // **THEN** Load dictionary and progress data (this will override stats with database values)
    await this.loadLearningData();
    
    // **CRITICAL FIX**: If getDictionaryProgress failed, try to get progress from getCurrentWord
    if (!this.progress) {
      console.log('🔍 DEBUG: No progress from getDictionaryProgress, trying getCurrentWord...');
      try {
        const response = await this.vocabularyService.getCurrentWord(this.selectedDictionaryId);
        if (response.dictionary_progress) {
          this.progress = response.dictionary_progress;
          console.log('🔍 DEBUG: Got progress from getCurrentWord:', this.progress);
        }
      } catch (error) {
        console.log('🔍 DEBUG: getCurrentWord also failed:', error);
        // Still proceed, we'll get progress when user starts practice
      }
    }
    
    console.log('🔍 DEBUG: Final state after mount:');
    console.log('🔍 DEBUG: - currentWord:', this.currentWord?.name);
    console.log('🔍 DEBUG: - session stats:', this.session);
    console.log('🔍 DEBUG: - progress from database:', this.progress);
    
    // Bind events and setup
    this.bindEvents();
    this.setupKeyboardListeners();
    
    // Set initial audio button visibility
    this.updateAudioButtonVisibility();
    
    console.log('🔍 DEBUG: VocabularyPage mount completed');
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
      console.log('🔍 DEBUG: Starting loadLearningData...');
      
      // Load dictionary info
      console.log('🔍 DEBUG: Loading dictionary info...');
      const dictResponse = await this.vocabularyService.getDictionary(this.selectedDictionaryId);
      this.dictionary = dictResponse.dictionary;
      console.log('🔍 DEBUG: Dictionary loaded:', {
        id: this.dictionary.id,
        name: this.dictionary.display_name,
        total_words: this.dictionary.total_words
      });
      
      // Update UI with dictionary info
      const dictNameEl = document.getElementById('dictionary-name');
      if (dictNameEl) dictNameEl.textContent = this.dictionary.display_name;
      
      // Load user progress
      console.log('🔍 DEBUG: Loading user progress...');
      try {
        const progressResponse = await this.vocabularyService.getDictionaryProgress(this.selectedDictionaryId);
        console.log('🔍 DEBUG: getDictionaryProgress response:', progressResponse);
        console.log('🔍 DEBUG: getDictionaryProgress FULL response structure:', JSON.stringify(progressResponse, null, 2));
        
        this.progress = progressResponse.progress;
        
        console.log('🔍 DEBUG: Extracted progress object:', this.progress);
        console.log('🔍 DEBUG: Progress FULL object structure:', JSON.stringify(this.progress, null, 2));
        
        // **CRITICAL FIX**: Sync session stats with database values
        if (this.progress) {
          console.log('🔍 DEBUG: Syncing session stats with database...');
          
          // **USE SAME DATA SOURCE AS DICTIONARY SELECTOR**
          // Extract from UserDictionary (overall) instead of calculating from UserWordProgress aggregates
          const overall = this.progress.overall || {};
          
          const completedWords = overall.completed_words || 0;
          const accuracyRate = overall.accuracy_rate || 0; // This is a percentage (75)
          
          // **CRITICAL**: Use the UserDictionary correct_answers and wrong_answers if available
          // These should be the actual stored values, not calculated from aggregates
          let correctAnswers, wrongAnswers, totalInputs;
          
          // Check if we have direct access to UserDictionary data (now in overall section)
          if (overall.correct_answers !== undefined && overall.wrong_answers !== undefined) {
            // Use direct UserDictionary values (same as selector)
            correctAnswers = overall.correct_answers;
            wrongAnswers = overall.wrong_answers;
            totalInputs = correctAnswers + wrongAnswers;
          } else {
            // Fallback: calculate total inputs to match completed words
            // Since completed_words represents successful completions, use that as base
            totalInputs = completedWords;
            correctAnswers = Math.round((totalInputs * accuracyRate) / 100);
            wrongAnswers = totalInputs - correctAnswers;
          }
          
          console.log('🔍 DEBUG: Using UserDictionary values (same as selector):', {
            completedWords,
            accuracyRate: accuracyRate + '%',
            directValues: {
              correct_answers: overall.correct_answers,
              wrong_answers: overall.wrong_answers
            },
            calculated: {
              correctAnswers,
              wrongAnswers,
              totalInputs
            }
          });
          
          // Update session to match database (same as selector shows)
          this.session.correctCount = correctAnswers;
          this.session.wrongCount = wrongAnswers;
          this.session.inputCount = totalInputs;
          this.session.accuracy = accuracyRate; // Use database accuracy directly
          
          console.log('🔍 DEBUG: Updated session stats to match selector:', this.session);
          
          // **CRITICAL**: Update the UI to reflect database values
          this.updateStats();
        }
        
        console.log('🔍 DEBUG: Progress loaded from database:', {
          current_position: this.progress?.overall?.current_position,
          completed_words: this.progress?.overall?.completed_words,
          accuracy_rate: this.progress?.overall?.accuracy_rate,
          words_attempted: this.progress?.word_level_stats?.words_attempted,
          wrong_words_count: this.progress?.word_level_stats?.wrong_words_count
        });
        
      } catch (progressError) {
        // **CRITICAL FIX**: For fresh users, no progress is normal
        console.log('🔍 DEBUG: No progress found (normal for fresh users):', progressError.message);
        this.progress = null; // Will be initialized when user starts practice
      }
      
      // Update progress info
      this.updateProgressDisplay();
      
      console.log('🔍 DEBUG: loadLearningData completed successfully');
    } catch (error) {
      console.error('❌ Failed to load learning data:', error);
      this.showErrorMessage('Failed to load dictionary data. Please try again.');
    }
  }

  bindEvents() {
    const practiceZone = document.getElementById('practice-zone');
    const playAudioBtn = document.getElementById('play-audio-btn');
    const audioSwitch = document.getElementById('audio-switch');
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

    // Audio button
    playAudioBtn?.addEventListener('click', () => {
      this.playCurrentAudio();
    });

    // Settings toggles
    audioSwitch?.addEventListener('sl-change', (e) => {
      this.audioEnabled = e.target.checked;
      const statusEl = audioSwitch.parentElement.querySelector('.setting-status');
      statusEl.textContent = e.target.checked ? 'ON' : 'OFF';
      
      // Show/hide audio button based on setting
      const audioBtn = document.getElementById('play-audio-btn');
      if (audioBtn) {
        audioBtn.style.display = this.audioEnabled ? '' : 'none';
      }
    });

    hintSwitch?.addEventListener('sl-change', (e) => {
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

  async startPractice() {
    if (this.session.isActive) return;

    this.session.isActive = true;
    this.startTime = Date.now() - (this.session.timeElapsed * 1000); // Account for restored time
    
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
      // Resume existing word - update the display properly
      this.updateWordDisplay();
      this.createVisualWordDisplay();
      this.isTypingWord = true;
    }
  }

  updateWordDisplay() {
    if (!this.currentWord) {
      console.warn('⚠️ No current word to display');
      return;
    }
    
    
    // Update word display - Show Chinese translation and pronunciation
    const wordTitle = document.getElementById('word-title');
    const wordMeaning = document.getElementById('word-meaning');
    
    if (wordTitle) {
      // Display the Chinese translation as the main title
      const chineseTranslations = this.currentWord.trans || [];
      const newTitle = chineseTranslations.join(' / ') || 'No translation available';
      wordTitle.textContent = newTitle;
    }
    
    if (wordMeaning) {
      // Show pronunciation with US/UK labels
      const usPhone = this.currentWord.usphone;
      const ukPhone = this.currentWord.ukphone;
      
      let pronunciationHtml = '';
      if (usPhone || ukPhone) {
        pronunciationHtml = '<div class="pronunciation-container" style="margin-top: 15px; margin-bottom: 15px;">';
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
      
      // Update word display - Make sure this happens
      this.updateWordDisplay();

      // Setup typing interface - user types the English word
      this.currentTypingPosition = 0;
      this.isTypingWord = true;
      this.createVisualWordDisplay();

      // Clear feedback and show ready state
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

  clearCurrentWordDisplay() {
    // Clear any visual feedback
    const wordCharacters = document.getElementById('word-characters');
    if (wordCharacters) {
      wordCharacters.classList.remove('shake');
    }
    
    // Clear any character states
    const charElements = document.querySelectorAll('.char');
    charElements.forEach(char => {
      char.classList.remove('correct', 'error');
    });
    
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

    // User types the English word (name field)
    const targetWord = this.currentWord.name.toLowerCase();
    const charactersHtml = targetWord.split('').map((char, index) => 
      `<span class="char" data-index="${index}">${char}</span>`
    ).join('');

    visualWordInput.innerHTML = `
      <div class="word-characters" id="word-characters">
        ${charactersHtml}
      </div>
    `;
    
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

    // Check if the typed character is correct
    if (this.currentTypingPosition < targetWord.length && typedChar === targetWord[this.currentTypingPosition]) {
      this.markCharacterCorrect(this.currentTypingPosition);
      this.currentTypingPosition++;

      // Check if word is complete
      if (this.currentTypingPosition === targetWord.length) {
        this.completeWord(true);
      }
    } else {
      // Wrong character - show error first, then shake and reset
      this.handleWrongCharacter(typedChar);
    }
  }

  handleWrongCharacter(typedChar) {
    // Increment failure count for current word
    this.currentWordFailureCount++;
    
    // First, mark the current character as error
    this.markCharacterError(this.currentTypingPosition);
    
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

  markCharacterError(index) {
    const charElement = document.querySelector(`[data-index="${index}"]`);
    if (charElement) {
      charElement.classList.add('error');
    }
  }

  markCharacterCorrect(index) {
    const charElement = document.querySelector(`[data-index="${index}"]`);
    if (charElement) {
      charElement.classList.add('correct');
    }
  }

  markCharacterNeutral(index) {
    const charElement = document.querySelector(`[data-index="${index}"]`);
    if (charElement) {
      charElement.classList.remove('correct', 'error');
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
    // Reset failure count when user resets progress manually
    this.currentWordFailureCount = 0;
    const charElements = document.querySelectorAll('.char');
    charElements.forEach(char => {
      char.classList.remove('correct', 'error');
    });
  }

  handleBackspace() {
    if (this.currentTypingPosition > 0) {
      this.currentTypingPosition--;
      this.markCharacterNeutral(this.currentTypingPosition);
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
      feedback.textContent = `Too many attempts! Moving to next word...`;
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

      // Show final message briefly then load new word
      setTimeout(() => {
        if (feedback) {
          feedback.textContent = `Word "${failedWord}" failed too many times. Loading next word...`;
        }
      }, 500);

      // Load next word after brief delay
      setTimeout(async () => {
        await this.loadNextWordWithRetry(failedWord);
      }, 1000);

    } catch (error) {
      this.showErrorMessage('Failed to process answer. Please try again.');
      // Still try to load next word even if there was an error
      setTimeout(async () => {
        await this.loadNextWordWithRetry(failedWord);
      }, 1000);
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
          this.isTypingWord = true;
          this.createVisualWordDisplay();

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
    this.isTypingWord = true;
    this.createVisualWordDisplay();
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
      console.error('Failed to submit answer:', error);
      this.showErrorMessage('Failed to submit answer. Please try again.');
    }
  }

  playCurrentAudio() {
    if (!this.currentWord) return;
    
    try {
      // Use Youdao API for audio
      const audioUrl = this.vocabularyService.generateAudioUrl(this.currentWord.name);
      const audio = new Audio(audioUrl);
      
      // Add error handling for audio loading
      audio.addEventListener('error', () => {
        this.fallbackToTTS();
      });
      
      audio.addEventListener('canplaythrough', () => {
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
      utterance.rate = 0.8; // Slightly slower for learning
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      this.showErrorMessage('Audio not supported in this browser');
    }
  }

  showHint() {
    if (!this.currentWord) return;

    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      const word = this.currentWord.name;
      const hintText = word.length > 2 ? word.substring(0, 2) + '...' : word.substring(0, 1) + '...';
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

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      progress: this.progress, // Save progress object
      currentTypingPosition: this.currentTypingPosition,
      isTypingWord: this.isTypingWord,
      startTime: this.startTime,
      currentWordFailureCount: this.currentWordFailureCount,
      audioEnabled: this.audioEnabled,
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
      this.session = {
        timeElapsed: sessionData.timeElapsed || 0,
        inputCount: sessionData.inputCount || 0,
        correctCount: sessionData.correctCount || 0,
        wrongCount: sessionData.wrongCount || 0,
        accuracy: sessionData.accuracy || 0,
        isActive: false
      };
      
      this.currentWord = sessionData.currentWord;
      this.progress = sessionData.progress; // Restore progress object
      this.currentTypingPosition = sessionData.currentTypingPosition || 0;
      this.isTypingWord = false; // User needs to click to resume
      this.currentWordFailureCount = sessionData.currentWordFailureCount || 0;
      this.audioEnabled = sessionData.audioEnabled !== undefined ? sessionData.audioEnabled : true;
      
      // Update audio switch state
      const audioSwitch = document.getElementById('audio-switch');
      if (audioSwitch) {
        audioSwitch.checked = this.audioEnabled;
        const statusEl = audioSwitch.parentElement.querySelector('.setting-status');
        statusEl.textContent = this.audioEnabled ? 'ON' : 'OFF';
      }
      
      // Update audio button visibility
      const audioBtn = document.getElementById('play-audio-btn');
      if (audioBtn) {
        audioBtn.style.display = this.audioEnabled ? '' : 'none';
      }
      
      // Update UI with restored stats
      this.updateStats();
      this.updateProgressDisplay(); // Update progress display
      
      // If there was an active session, show the word but don't auto-start
      if (sessionData.isActive && this.currentWord) {
        this.showRestoredSession();
      }
      
    } catch (error) {
      console.warn('Failed to restore session state:', error);
      localStorage.removeItem(this.sessionStorageKey);
    }
  }

  updateProgressDisplay() {
    const progressInfoEl = document.getElementById('progress-info');
    if (progressInfoEl) {
      if (this.dictionary && this.progress && this.progress.overall) {
        // **FIX**: Use database completed_words (same as selector) instead of session correctCount
        const completedWords = this.progress.overall.completed_words || 0;
        progressInfoEl.textContent = `${completedWords}/${this.dictionary.total_words}`;
      } else if (this.dictionary) {
        // Fallback to session correct count if no database progress
        progressInfoEl.textContent = `${this.session.correctCount}/${this.dictionary.total_words}`;
      } else {
        progressInfoEl.textContent = '0/0';
      }
    }
  }

  showRestoredSession() {
    const startMessage = document.querySelector('.start-message');
    if (startMessage) {
      let progressText = 'Progress loading...';
      
      if (this.dictionary && this.progress && this.progress.overall) {
        // **FIX**: Use database completed_words (same as selector and progress display)
        const completedWords = this.progress.overall.completed_words || 0;
        progressText = `${completedWords}/${this.dictionary.total_words} words completed`;
      } else if (this.dictionary) {
        // Fallback to session correct count if no database progress
        progressText = `${this.session.correctCount}/${this.dictionary.total_words} words completed`;
      }
        
      startMessage.innerHTML = `
        <h2>Session Restored</h2>
        <p>Dictionary: ${this.dictionary?.display_name || 'Loading...'}</p>
        <p>Session: ${this.session.inputCount} words practiced, ${this.session.accuracy}% accuracy</p>
        <p>Dictionary Progress: ${progressText}</p>
        <p>Click to continue learning</p>
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
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // Save final session state before cleanup
    this.saveSessionState();
    
    
  }

  updateAudioButtonVisibility() {
    const audioBtn = document.getElementById('play-audio-btn');
    const audioSwitch = document.getElementById('audio-switch');
    
    if (audioBtn) {
      audioBtn.style.display = this.audioEnabled ? '' : 'none';
    }
    
    if (audioSwitch) {
      audioSwitch.checked = this.audioEnabled;
      const statusEl = audioSwitch.parentElement.querySelector('.setting-status');
      if (statusEl) {
        statusEl.textContent = this.audioEnabled ? 'ON' : 'OFF';
      }
    }
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
    this.currentWord = null;
    this.progress = null;
    this.isTypingWord = false;
    
    // Update selected dictionary
    this.selectedDictionaryId = newDictionaryId;
    
    // **CRITICAL FIX**: Update session storage key with user ID
    const userId = await this.getUserId();
    this.sessionStorageKey = `vocabin_session_${userId}_${this.selectedDictionaryId}`;
    
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