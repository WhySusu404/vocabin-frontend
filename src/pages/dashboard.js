import apiService from '../services/api.js'
import VocabularyService from '../services/vocabularyService.js'
import DictionaryService from '../services/dictionaryService.js'

export class DashboardPage {
    constructor() {
        this.user = null
        this.vocabularyService = new VocabularyService()
        this.dictionaryService = new DictionaryService()
        this.userProgress = {
            vocabulary: null,
            listening: null,
            reading: null
        }
        this.dictionaries = []
        this.userDictionaries = []
        this.useLocalData = false
    }

    async render() {
        try {
            // Get user profile from API
            const profileResponse = await apiService.getProfile()
            this.user = profileResponse.user
        } catch (error) {
            // Use mock user for development
            this.user = {
                firstName: 'Student',
                lastName: 'User',
                email: 'student@example.com'
            }
        }

        try {
            // Get user dictionaries and progress
            await this.loadUserProgress()
        } catch (error) {
            console.error('Failed to load user progress:', error)
            // Try to load local data as fallback
            try {
                await this.loadLocalProgress()
                this.useLocalData = true
            } catch (localError) {
                console.error('Failed to load local progress:', localError)
                // Set default empty progress
                this.userProgress = {
                    vocabulary: null,
                    listening: null,
                    reading: null
                }
            }
        }

        return `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Welcome back, ${this.user.firstName}!</h1>
          ${this.useLocalData ? '<p class="dev-notice">Using local dictionary data</p>' : ''}
        </div>
        
        <div class="learning-modes-grid">
          ${this.renderVocabularyCard()}
          ${this.renderListeningCard()}
          ${this.renderReadingCard()}
        </div>
      </div>
    `
    }

    async loadUserProgress() {
        try {
            // Get all dictionaries and user progress
            const [dictionariesResponse, userProgressResponse] = await Promise.all([
                this.vocabularyService.getDictionaries(),
                this.vocabularyService.getUserDictionaries()
            ])

            this.dictionaries = dictionariesResponse.dictionaries || []
            this.userDictionaries = userProgressResponse.dictionaries || []

            // Process progress for each learning mode
            this.processVocabularyProgress()
            this.processListeningProgress()
            this.processReadingProgress()

        } catch (error) {
            console.error('Error loading user progress:', error)
            throw error
        }
    }

    async loadLocalProgress() {
        try {
            // Load dictionaries from local files
            this.dictionaries = await this.dictionaryService.getDictionaries()
            
            // Generate mock user progress
            this.userDictionaries = this.dictionaryService.generateMockUserProgress()

            // Process progress for each learning mode
            this.processVocabularyProgress()
            this.processListeningProgress()
            this.processReadingProgress()

        } catch (error) {
            console.error('Error loading local progress:', error)
            throw error
        }
    }

    processVocabularyProgress() {
        // Find first dictionary with vocabulary progress, or just first dictionary
        const vocabDictionaries = this.userDictionaries.filter(userDict => 
            userDict.dictionary && 
            (userDict.dictionary.category === 'vocabulary' || 
             userDict.dictionary.category === 'general' ||
             !userDict.dictionary.category) // Default to vocabulary if no category
        )

        let selectedDict = null
        let progress = null

        if (vocabDictionaries.length > 0) {
            // Find first dictionary with progress
            selectedDict = vocabDictionaries.find(dict => dict.progress && dict.progress.completed_words > 0)
            
            // If no progress found, use first available vocabulary dictionary
            if (!selectedDict) {
                selectedDict = vocabDictionaries[0]
            }
        } else {
            // No vocabulary dictionaries with progress, use first available dictionary
            const firstDict = this.dictionaries[0]
            if (firstDict) {
                selectedDict = {
                    dictionary: firstDict,
                    progress: null
                }
            }
        }

        if (selectedDict) {
            const dict = selectedDict.dictionary
            progress = selectedDict.progress

            this.userProgress.vocabulary = {
                dictionaryId: dict.id,
                listName: dict.display_name || dict.name,
                totalWords: dict.total_words || 0,
                wordsLearned: progress ? progress.completed_words : 0,
                accuracy: progress ? Math.round(progress.accuracy_rate || 0) : 0,
                status: progress ? progress.status : 'not_started'
            }
        }
    }

    processListeningProgress() {
        // For listening, we need separate listening-specific progress
        // In a real implementation, this would track listening sessions/sentences
        // For now, we'll simulate listening progress differently from vocabulary
        
        let selectedDict = null
        let listeningProgress = null

        if (this.userDictionaries.length > 0) {
            // Use the second dictionary if available for listening, to differentiate from vocabulary
            const listeningDict = this.userDictionaries.length > 1 
                ? this.userDictionaries[1] 
                : this.userDictionaries[0]
            
            selectedDict = listeningDict
        } else if (this.dictionaries.length > 0) {
            // Use second dictionary or first if only one available
            const dict = this.dictionaries.length > 1 ? this.dictionaries[1] : this.dictionaries[0]
            selectedDict = {
                dictionary: dict,
                progress: null
            }
        }

        if (selectedDict) {
            const dict = selectedDict.dictionary
            const vocabProgress = selectedDict.progress
            
            // Create listening-specific progress (simulate listening sentences based on words)
            if (vocabProgress) {
                // Simulate listening progress as different from vocabulary progress
                const totalSentences = Math.floor(dict.total_words * 0.3) // Assume 30% of words as sentences
                const sentencesCompleted = Math.floor(vocabProgress.completed_words * 0.2) // Listening typically lower progress
                
                listeningProgress = {
                    totalSentences,
                    sentencesCompleted,
                    accuracy: Math.max(60, vocabProgress.accuracy_rate - 10), // Listening typically harder
                    status: sentencesCompleted > 0 ? 'in_progress' : 'not_started'
                }
            } else {
                const totalSentences = Math.floor(dict.total_words * 0.3)
                listeningProgress = {
                    totalSentences,
                    sentencesCompleted: 0,
                    accuracy: 0,
                    status: 'not_started'
                }
            }

            this.userProgress.listening = {
                dictionaryId: dict.id,
                materialName: dict.display_name || dict.name,
                totalSentences: listeningProgress.totalSentences,
                sentencesCompleted: listeningProgress.sentencesCompleted,
                accuracy: listeningProgress.accuracy,
                status: listeningProgress.status
            }
        }
    }

    processReadingProgress() {
        // For reading, we'll simulate based on available dictionaries
        // In a real implementation, this would have separate reading materials
        const readingDictionaries = this.userDictionaries.filter(userDict => 
            userDict.dictionary && userDict.progress
        )

        let totalArticles = 20 // Default number of articles
        let articlesCompleted = 0

        if (readingDictionaries.length > 0) {
            // Calculate based on dictionary progress
            const completedDicts = readingDictionaries.filter(dict => 
                dict.progress && dict.progress.status === 'completed'
            ).length
            
            articlesCompleted = Math.min(completedDicts * 5, totalArticles) // 5 articles per completed dictionary
        }

        this.userProgress.reading = {
            totalArticles,
            articlesCompleted,
            status: articlesCompleted > 0 ? 'in_progress' : 'not_started'
        }
    }

    renderVocabularyCard() {
        const progress = this.userProgress.vocabulary
        const progressPercentage = progress ? Math.round((progress.wordsLearned / progress.totalWords) * 100) : 0
        
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
                    <span class="value">${progress ? progress.listName : 'No dictionary selected'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total Words</span>
                    <span class="value">${progress ? progress.totalWords : 0}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress ? progress.wordsLearned : 0}</span>
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
        const progressPercentage = progress ? Math.round((progress.sentencesCompleted / progress.totalSentences) * 100) : 0
        
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
                    <span class="value">${progress ? progress.materialName : 'No material selected'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total Sentences</span>
                    <span class="value">${progress ? progress.totalSentences : 0}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress ? progress.sentencesCompleted : 0}</span>
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
        const progressPercentage = progress ? Math.round((progress.articlesCompleted / progress.totalArticles) * 100) : 0
        
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
                    <span class="value">${progress ? progress.totalArticles : 0}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Finished</span>
                    <span class="value">${progress ? progress.articlesCompleted : 0}</span>
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
        // Use setTimeout to ensure DOM elements are available after render
        setTimeout(() => {
            const vocabularyBtn = document.getElementById('vocabulary-enter-btn')
            const listeningBtn = document.getElementById('listening-enter-btn')
            const readingBtn = document.getElementById('reading-enter-btn')

            vocabularyBtn?.addEventListener('click', (e) => {
                e.preventDefault()
                console.log('Vocabulary button clicked')
                // Navigate to vocabulary page
                const dictionaryId = this.userProgress.vocabulary?.dictionaryId
                if (dictionaryId) {
                    window.location.hash = `#vocabulary?dictionary=${dictionaryId}`
                } else {
                    window.location.hash = '#vocabulary'
                }
            })

            listeningBtn?.addEventListener('click', (e) => {
                e.preventDefault()
                console.log('Listening button clicked')
                // Navigate to listening page
                const dictionaryId = this.userProgress.listening?.dictionaryId
                if (dictionaryId) {
                    window.location.hash = `#listening?dictionary=${dictionaryId}`
                } else {
                    window.location.hash = '#listening'
                }
            })

            readingBtn?.addEventListener('click', (e) => {
                e.preventDefault()
                console.log('Reading button clicked')
                // Navigate to reading page
                window.location.hash = '#reading'
            })
        }, 100)
    }
}

export default DashboardPage 