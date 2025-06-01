import { mockWords, mockLearningSession } from '../data/mockData.js'

export default class ListeningPage {
  constructor() {
    this.name = 'ListeningPage';
    this.session = { ...mockLearningSession.vocabulary };
    this.timer = null;
    this.startTime = null;
    this.currentTypingPosition = 0;
    this.isTypingWord = false;
    this.audioElement = null;
    this.userInput = []; // Track what user has typed
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
            <span class="stat-label">Input</span>
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
            <h2>Click or Press any key to start</h2>
          </div>
          <div class="word-practice" id="word-practice" style="display: none;">
            <div class="audio-control-section" id="audio-control-section">
              <div class="audio-instructions">
                <p><strong>Listen carefully and type the word you hear</strong></p>
              </div>
              <div class="audio-controls">
                <button class="audio-btn play-btn" id="play-audio-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                  Play Audio
                </button>
                <button class="audio-btn replay-btn" id="replay-audio-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  Replay
                </button>
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
        <div class="list-info-card">
          <h3>Material Name</h3>
          <p class="list-title">BBC Daily English<br>Listening</p>
        </div>

        <div class="chapter-card">
          <h3>Sentences</h3>
          <p class="chapter-number">400</p>
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

  mount() {
    this.bindEvents();
    this.setupKeyboardListeners();
    this.setupAudio();
  }

  bindEvents() {
    const practiceZone = document.getElementById('practice-zone');
    const autoReplaySwitch = document.getElementById('auto-replay-switch');
    const hintSwitch = document.getElementById('hint-switch');
    const playAudioBtn = document.getElementById('play-audio-btn');
    const replayAudioBtn = document.getElementById('replay-audio-btn');

    // Start practice on click
    practiceZone?.addEventListener('click', () => {
      this.startPractice();
    });

    // Audio controls
    playAudioBtn?.addEventListener('click', () => {
      this.playCurrentAudio();
    });

    replayAudioBtn?.addEventListener('click', () => {
      this.playCurrentAudio();
    });

    // Settings toggles
    autoReplaySwitch?.addEventListener('sl-change', (e) => {
      const statusEl = autoReplaySwitch.parentElement.querySelector('.setting-status');
      statusEl.textContent = e.target.checked ? 'ON' : 'OFF';
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
    document.addEventListener('keydown', (e) => {
      if (!this.session.isActive && e.target.tagName !== 'INPUT') {
        this.startPractice();
        return;
      }
      
      if (this.session.isActive && this.isTypingWord) {
        this.handleCharacterInput(e);
      }
    });
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

  startPractice() {
    if (this.session.isActive) return;

    this.session.isActive = true;
    this.startTime = Date.now();
    
    // Hide start message, show practice area
    const startMessage = document.querySelector('.start-message');
    const wordPractice = document.getElementById('word-practice');
    
    if (startMessage) startMessage.style.display = 'none';
    if (wordPractice) wordPractice.style.display = 'block';

    // Start timer
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);

    // Load first word
    this.loadNextWord();
  }

  loadNextWord() {
    // For demo, cycle through available words
    const words = Object.values(mockWords);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    this.session.currentWord = randomWord;
    this.currentTypingPosition = 0;
    this.isTypingWord = false; // Don't allow typing until audio is played
    this.userInput = []; // Reset user input

    // Create visual word display (without showing the actual word)
    this.createVisualWordDisplay();

    // Play audio automatically
    this.playCurrentAudio();

    // Clear feedback
    const feedback = document.getElementById('word-feedback');
    if (feedback) feedback.textContent = '';
  }

  createVisualWordDisplay() {
    const visualWordInput = document.getElementById('visual-word-input');
    if (!visualWordInput || !this.session.currentWord) return;

    const word = this.session.currentWord.word;
    // Show user input and underscores for remaining positions
    const charactersHtml = word.split('').map((char, index) => {
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
    if (!this.session.currentWord) return;

    // For demo purposes, we'll use Text-to-Speech API
    // In a real app, you'd load the actual audio file
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(this.session.currentWord.word);
      utterance.rate = this.getPlaybackSpeed();
      utterance.lang = 'en-US';
      
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
    const speedSelect = document.getElementById('speed-select');
    const speed = speedSelect?.value || 'normal';
    
    switch(speed) {
      case 'slow': return 0.7;
      case 'fast': return 1.3;
      default: return 1.0;
    }
  }

  showHint() {
    if (!this.session.currentWord) return;
    
    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      feedback.textContent = `Hint: ${this.session.currentWord.word.length} letters, starts with "${this.session.currentWord.word[0]}"`;
      feedback.className = 'word-feedback hint';
    }
  }

  hideHint() {
    const feedback = document.getElementById('word-feedback');
    if (feedback && feedback.classList.contains('hint')) {
      feedback.textContent = '';
    }
  }

  handleCharacterInput(e) {
    if (!this.session.isActive || !this.session.currentWord || !this.isTypingWord) return;

    // Ignore special keys
    if (e.key.length > 1 && e.key !== 'Backspace') return;

    e.preventDefault();

    const word = this.session.currentWord.word.toLowerCase();
    const typedChar = e.key.toLowerCase();

    if (e.key === 'Backspace') {
      this.handleBackspace();
      return;
    }

    // Store the user input and check if it's correct
    if (this.currentTypingPosition < word.length) {
      this.userInput[this.currentTypingPosition] = e.key;
      const isCorrect = typedChar === word[this.currentTypingPosition];
      
      if (isCorrect) {
        this.currentTypingPosition++;
        
        // Refresh display
        this.createVisualWordDisplay();
        
        // Check if word is complete
        if (this.currentTypingPosition === word.length) {
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
    // After a brief delay, shake and reset
    setTimeout(() => {
      this.shakeWordAndReset();
    }, 200);
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
    const autoReplaySwitch = document.getElementById('auto-replay-switch');
    if (autoReplaySwitch?.checked) {
      setTimeout(() => {
        this.playCurrentAudio();
      }, 500);
    } else {
      this.isTypingWord = true;
    }
  }

  completeWord(isCorrect) {
    this.isTypingWord = false;
    this.session.inputCount++;
    
    if (isCorrect) {
      this.session.correctCount++;
    }

    const feedback = document.getElementById('word-feedback');
    if (feedback) {
      if (isCorrect) {
        feedback.textContent = 'Correct! ✓';
        feedback.className = 'word-feedback correct';
      } else {
        feedback.textContent = `Incorrect. The word was: ${this.session.currentWord.word}`;
        feedback.className = 'word-feedback incorrect';
      }
    }

    this.updateStats();

    // Load next word after a delay
    setTimeout(() => {
      this.loadNextWord();
    }, 2000);
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
    // Update input count
    const inputCount = document.getElementById('input-count');
    if (inputCount) inputCount.textContent = this.session.inputCount;

    // Update correct count
    const correctCount = document.getElementById('correct-count');
    if (correctCount) correctCount.textContent = this.session.correctCount;

    // Update accuracy
    this.session.accuracy = this.session.inputCount > 0 
      ? Math.round((this.session.correctCount / this.session.inputCount) * 100)
      : 0;
    
    const accuracyDisplay = document.getElementById('accuracy-display');
    if (accuracyDisplay) accuracyDisplay.textContent = `${this.session.accuracy}%`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    console.log('Listening page cleanup');
  }
} 