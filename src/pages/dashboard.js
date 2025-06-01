import apiService from '../services/api.js'
import { mockUser, mockUserProgress, mockWordLists, mockListeningMaterials } from '../data/mockData.js'

export class DashboardPage {
    constructor() {
        this.user = null
        this.userProgress = mockUserProgress
    }

    async render() {
        try {
            // Get user profile from API
            const profileResponse = await apiService.getProfile()
            this.user = profileResponse.user
        } catch (error) {
            // Use mock data for development
            this.user = mockUser
            console.log('Using mock data for dashboard')
        }

        return `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Welcome back, ${this.user.firstName}!</h1>
        </div>
        
        <div class="learning-modes-grid">
          ${this.renderVocabularyCard()}
          ${this.renderListeningCard()}
          ${this.renderReadingCard()}
        </div>
      </div>
    `
    }

    renderVocabularyCard() {
        const progress = this.userProgress.vocabulary
        const progressPercentage = Math.round((progress.wordsLearned / progress.totalWords) * 100)
        
        return `
          <div class="learning-mode-card">
            <div class="card-header vocabulary-header">
              <h2>VOCABULARY</h2>
            </div>
            <div class="card-content">
              <div class="current-learning-section">
                <h3>Current Learning</h3>
                <div class="learning-info">
                  <div class="info-row">
                    <span class="label">List Name</span>
                    <span class="value">IELTS Conversation word list</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total Words</span>
                    <span class="value">${progress.totalWords}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress.wordsLearned}</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
              </div>
              <button 
                class="enter-button vocabulary-enter"
                id="vocabulary-enter-btn"
              >
                ENTER
              </button>
            </div>
          </div>
        `
    }

    renderListeningCard() {
        const progress = this.userProgress.listening
        const progressPercentage = Math.round((progress.sentencesCompleted / progress.totalSentences) * 100)
        
        return `
          <div class="learning-mode-card">
            <div class="card-header listening-header">
              <h2>LISTENING</h2>
            </div>
            <div class="card-content">
              <div class="current-learning-section">
                <h3>Current Learning</h3>
                <div class="learning-info">
                  <div class="info-row">
                    <span class="label">Material Name</span>
                    <span class="value">BBC Daily English Talk</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total Sentence</span>
                    <span class="value">${progress.totalSentences}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress.sentencesCompleted}</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
              </div>
              <button 
                class="enter-button listening-enter"
                id="listening-enter-btn"
              >
                ENTER
              </button>
            </div>
          </div>
        `
    }

    renderReadingCard() {
        const progress = this.userProgress.reading
        const progressPercentage = Math.round((progress.articlesCompleted / progress.totalArticles) * 100)
        
        return `
          <div class="learning-mode-card">
            <div class="card-header reading-header">
              <h2>READING</h2>
            </div>
            <div class="card-content">
              <div class="current-learning-section">
                <h3>Current Learning</h3>
                <div class="learning-info">
                  <div class="info-row">
                    <span class="label">Created Articles & Practice</span>
                    <span class="value">${progress.totalArticles}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress.articlesCompleted}</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
              </div>
              <button 
                class="enter-button reading-enter"
                id="reading-enter-btn"
              >
                ENTER
              </button>
            </div>
          </div>
        `
    }

    mount() {
        this.bindEvents()
    }

    bindEvents() {
        const vocabularyBtn = document.getElementById('vocabulary-enter-btn')
        const listeningBtn = document.getElementById('listening-enter-btn')
        const readingBtn = document.getElementById('reading-enter-btn')

        vocabularyBtn?.addEventListener('click', () => {
            window.location.hash = '#vocabulary'
        })

        listeningBtn?.addEventListener('click', () => {
            window.location.hash = '#listening'
        })

        readingBtn?.addEventListener('click', () => {
            window.location.hash = '#reading'
        })
    }
}

export default DashboardPage 