import { mockReadingMaterials } from '../data/mockData.js'

export default class ReadingDetailPage {
  constructor(readingId = 'reading1') {
    this.name = 'ReadingDetailPage';
    this.readingId = readingId;
    this.material = mockReadingMaterials.find(m => m._id === readingId) || mockReadingMaterials[0];
    this.exerciseAnswers = {};
    this.showAnswers = false;
  }

  render() {
    return `
      <div class="reading-detail-container">
        <div class="reading-main-content">
          ${this.renderWordList()}
          ${this.renderReadingContent()}
          ${this.renderExercises()}
        </div>
        
        <div class="reading-sidebar">
          ${this.renderCurrentListInfo()}
          ${this.renderAIGenerateSet()}
        </div>
      </div>
    `;
  }

  renderWordList() {
    return `
      <div class="word-list-section">
        <h2>${this.material.title}</h2>
        <div class="word-tags">
          ${this.material.wordList.map(word => 
            `<span class="word-tag">${word}</span>`
          ).join('')}
        </div>
      </div>
    `;
  }

  renderReadingContent() {
    return `
      <div class="reading-content-section">
        <div class="reading-passage">
          <h3>${this.material.description}</h3>
          <div class="passage-text">
            ${this.formatPassageText(this.material.content)}
          </div>
        </div>
      </div>
    `;
  }

  renderExercises() {
    const exercise = this.material.exercises[0];
    
    return `
      <div class="exercises-section">
        <h3>${exercise.title}</h3>
        <div class="exercise-content">
          ${exercise.questions.map((question, index) => `
            <div class="exercise-question" data-question="${index}">
              <p class="question-text">${question.text}</p>
              <div class="question-input">
                <input 
                  type="text" 
                  id="answer-${index}" 
                  placeholder="Type your answer..."
                  value="${this.exerciseAnswers[index] || ''}"
                />
                <div class="answer-feedback" id="feedback-${index}"></div>
              </div>
            </div>
          `).join('')}
          
          <div class="exercise-actions">
            <sl-button 
              variant="primary" 
              id="show-answers-btn"
              size="large"
            >
              ${this.showAnswers ? 'Hide Answers' : 'Show Answer'}
            </sl-button>
          </div>
        </div>
      </div>
    `;
  }

  renderCurrentListInfo() {
    return `
      <div class="current-list-card">
        <h3>Current List</h3>
        <div class="list-number">13</div>
        <div class="list-date">13 Apr</div>
      </div>
    `;
  }

  renderAIGenerateSet() {
    return `
      <div class="ai-generate-card">
        <h3>AI Generate Set</h3>
        
        <div class="generate-option">
          <label class="option-label">Article Type</label>
          <sl-select value="essay" id="article-type-select">
            <sl-option value="essay">Essay</sl-option>
            <sl-option value="story">Story</sl-option>
            <sl-option value="news">News Article</sl-option>
            <sl-option value="academic">Academic Text</sl-option>
          </sl-select>
        </div>

        <div class="generate-option">
          <label class="option-label">Difficulty level</label>
          <sl-select value="intermediate" id="difficulty-select">
            <sl-option value="beginner">Beginner</sl-option>
            <sl-option value="intermediate">Intermediate</sl-option>
            <sl-option value="advanced">Advanced</sl-option>
          </sl-select>
        </div>

        <div class="generate-option">
          <label class="option-label">Length</label>
          <sl-select value="medium" id="length-select">
            <sl-option value="short">Short (100-200 words)</sl-option>
            <sl-option value="medium">Medium (200-400 words)</sl-option>
            <sl-option value="long">Long (400+ words)</sl-option>
          </sl-select>
        </div>

        <div class="generate-option">
          <label class="option-label">Bold words</label>
          <sl-select value="vocabulary" id="bold-words-select">
            <sl-option value="vocabulary">Vocabulary Words</sl-option>
            <sl-option value="difficult">Difficult Words</sl-option>
            <sl-option value="none">No Bold Words</sl-option>
          </sl-select>
        </div>

        <div class="generate-option">
          <label class="option-label">Exercise</label>
          <sl-select value="fill-blank" id="exercise-select">
            <sl-option value="fill-blank">Fill in the Blank</sl-option>
            <sl-option value="multiple-choice">Multiple Choice</sl-option>
            <sl-option value="comprehension">Reading Comprehension</sl-option>
            <sl-option value="vocabulary">Vocabulary Questions</sl-option>
          </sl-select>
        </div>

        <sl-button 
          variant="primary" 
          size="large" 
          class="create-button"
          id="create-article-btn"
        >
          Create
        </sl-button>
      </div>
    `;
  }

  formatPassageText(content) {
    // Split content into paragraphs and format
    const paragraphs = content.split('\n\n');
    return paragraphs.map(paragraph => {
      if (paragraph.trim() === '') return '';
      
      // Bold the vocabulary words in the text
      let formattedParagraph = paragraph;
      this.material.wordList.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        formattedParagraph = formattedParagraph.replace(regex, `<strong>${word}</strong>`);
      });
      
      return `<p>${formattedParagraph}</p>`;
    }).join('');
  }

  mount() {
    this.bindEvents();
  }

  bindEvents() {
    const showAnswersBtn = document.getElementById('show-answers-btn');
    const createArticleBtn = document.getElementById('create-article-btn');

    // Show/hide answers
    showAnswersBtn?.addEventListener('click', () => {
      this.toggleAnswers();
    });

    // Create new article
    createArticleBtn?.addEventListener('click', () => {
      this.generateNewArticle();
    });

    // Exercise input handling
    this.material.exercises[0].questions.forEach((question, index) => {
      const input = document.getElementById(`answer-${index}`);
      input?.addEventListener('input', (e) => {
        this.exerciseAnswers[index] = e.target.value;
        this.checkAnswer(index);
      });
    });

    // Back navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.location.hash = '#reading';
      }
    });
  }

  toggleAnswers() {
    this.showAnswers = !this.showAnswers;
    const exercise = this.material.exercises[0];
    
    exercise.questions.forEach((question, index) => {
      const feedback = document.getElementById(`feedback-${index}`);
      const input = document.getElementById(`answer-${index}`);
      
      if (feedback && input) {
        if (this.showAnswers) {
          feedback.textContent = `Correct answer: ${question.answer}`;
          feedback.className = 'answer-feedback show-answer';
          input.value = question.answer;
          this.exerciseAnswers[index] = question.answer;
        } else {
          feedback.textContent = '';
          feedback.className = 'answer-feedback';
        }
      }
    });

    const btn = document.getElementById('show-answers-btn');
    if (btn) {
      btn.textContent = this.showAnswers ? 'Hide Answers' : 'Show Answer';
    }
  }

  checkAnswer(questionIndex) {
    if (this.showAnswers) return;
    
    const exercise = this.material.exercises[0];
    const question = exercise.questions[questionIndex];
    const userAnswer = this.exerciseAnswers[questionIndex]?.toLowerCase().trim();
    const correctAnswer = question.answer.toLowerCase().trim();
    const feedback = document.getElementById(`feedback-${questionIndex}`);
    
    if (!feedback || !userAnswer) return;
    
    if (userAnswer === correctAnswer) {
      feedback.textContent = 'Correct! ✓';
      feedback.className = 'answer-feedback correct';
    } else if (userAnswer.length > 0) {
      feedback.textContent = 'Try again...';
      feedback.className = 'answer-feedback incorrect';
    } else {
      feedback.textContent = '';
      feedback.className = 'answer-feedback';
    }
  }

  generateNewArticle() {
    const articleType = document.getElementById('article-type-select')?.value;
    const difficulty = document.getElementById('difficulty-select')?.value;
    const length = document.getElementById('length-select')?.value;
    const boldWords = document.getElementById('bold-words-select')?.value;
    const exerciseType = document.getElementById('exercise-select')?.value;

    // Simulate AI generation (in real app, this would call an API)
    console.log('Generating new article with settings:', {
      articleType,
      difficulty,
      length,
      boldWords,
      exerciseType
    });

    // Show loading state
    const createBtn = document.getElementById('create-article-btn');
    if (createBtn) {
      createBtn.loading = true;
      createBtn.textContent = 'Creating...';
      
      setTimeout(() => {
        createBtn.loading = false;
        createBtn.textContent = 'Create';
        alert('New article generated! (This is a demo - in the real app, the content would update)');
      }, 2000);
    }
  }

  cleanup() {
    console.log('Reading detail page cleanup');
  }
} 