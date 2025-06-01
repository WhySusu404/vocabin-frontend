import apiService from './api.js';

class VocabularyService {
  constructor() {
    this.api = apiService;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // ==== DICTIONARY MANAGEMENT ====

  /**
   * Get all available dictionaries
   */
  async getDictionaries(options = {}) {
    const { category, difficulty, forceRefresh = false } = options;
    const cacheKey = `dictionaries_${category || 'all'}_${difficulty || 'all'}`;
    
    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/api/dictionaries?${queryString}` : '/api/dictionaries';
      
      const response = await this.api.request(endpoint);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      return response;
    } catch (error) {
      console.error('Failed to get dictionaries:', error);
      throw error;
    }
  }

  /**
   * Get specific dictionary by ID
   */
  async getDictionary(dictionaryId) {
    try {
      const response = await this.api.request(`/api/dictionaries/${dictionaryId}`);
      return response;
    } catch (error) {
      console.error('Failed to get dictionary:', error);
      throw error;
    }
  }

  /**
   * Get dictionary statistics
   */
  async getDictionaryStats(dictionaryId) {
    try {
      const response = await this.api.request(`/api/dictionaries/${dictionaryId}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to get dictionary stats:', error);
      throw error;
    }
  }

  /**
   * Get words from dictionary with pagination
   */
  async getDictionaryWords(dictionaryId, options = {}) {
    const { page = 1, limit = 50, startIndex = null } = options;
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (startIndex !== null) params.append('start_index', startIndex.toString());
      
      const response = await this.api.request(
        `/api/dictionaries/${dictionaryId}/words?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get dictionary words:', error);
      throw error;
    }
  }

  /**
   * Get specific word by index
   */
  async getWordByIndex(dictionaryId, wordIndex) {
    try {
      const response = await this.api.request(
        `/api/dictionaries/${dictionaryId}/words/${wordIndex}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get word by index:', error);
      throw error;
    }
  }

  /**
   * Search words in dictionary
   */
  async searchWords(dictionaryId, searchTerm, limit = 20) {
    try {
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      params.append('limit', limit.toString());
      
      const response = await this.api.request(
        `/api/dictionaries/${dictionaryId}/search?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to search words:', error);
      throw error;
    }
  }

  /**
   * Get random words from dictionary
   */
  async getRandomWords(dictionaryId, count = 10) {
    try {
      const params = new URLSearchParams();
      params.append('count', count.toString());
      
      const response = await this.api.request(
        `/api/dictionaries/${dictionaryId}/random?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get random words:', error);
      throw error;
    }
  }

  // ==== USER PROGRESS MANAGEMENT ====

  /**
   * Get user's progress across all dictionaries
   */
  async getUserDictionaries() {
    try {
      const response = await this.api.request('/api/user/dictionaries');
      return response;
    } catch (error) {
      console.error('Failed to get user dictionaries:', error);
      throw error;
    }
  }

  /**
   * Start learning a dictionary
   */
  async startDictionary(dictionaryId) {
    try {
      const response = await this.api.request(`/api/user/dictionaries/${dictionaryId}/start`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Failed to start dictionary:', error);
      throw error;
    }
  }

  /**
   * Get current word for learning
   */
  async getCurrentWord(dictionaryId) {
    try {
      const response = await this.api.request(`/api/user/dictionaries/${dictionaryId}/current-word`);
      return response;
    } catch (error) {
      console.error('Failed to get current word:', error);
      throw error;
    }
  }

  /**
   * Submit answer for a word
   */
  async submitWordAnswer(answerData) {
    try {
      const response = await this.api.request('/api/user/word-answer', {
        method: 'POST',
        body: JSON.stringify(answerData)
      });
      return response;
    } catch (error) {
      console.error('Failed to submit word answer:', error);
      throw error;
    }
  }

  /**
   * Get detailed progress for specific dictionary
   */
  async getDictionaryProgress(dictionaryId) {
    try {
      const response = await this.api.request(`/api/user/dictionaries/${dictionaryId}/progress`);
      return response;
    } catch (error) {
      console.error('Failed to get dictionary progress:', error);
      throw error;
    }
  }

  /**
   * Update learning progress
   */
  async updateProgress(dictionaryId, progressData) {
    try {
      const response = await this.api.request(`/api/user/dictionaries/${dictionaryId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(progressData)
      });
      return response;
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  }

  // ==== WRONG WORDS MANAGEMENT ====

  /**
   * Get user's wrong words
   */
  async getWrongWords(options = {}) {
    const { dictionaryId, includeResolved = false, limit = 50, sortBy = 'urgency' } = options;
    
    try {
      const params = new URLSearchParams();
      if (dictionaryId) params.append('dictionaryId', dictionaryId);
      params.append('includeResolved', includeResolved.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      
      const response = await this.api.request(`/api/wrong-words?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get wrong words:', error);
      throw error;
    }
  }

  /**
   * Get wrong words for specific dictionary
   */
  async getDictionaryWrongWords(dictionaryId, options = {}) {
    const { includeResolved = false, limit = 50 } = options;
    
    try {
      const params = new URLSearchParams();
      params.append('includeResolved', includeResolved.toString());
      params.append('limit', limit.toString());
      
      const response = await this.api.request(
        `/api/wrong-words/dictionaries/${dictionaryId}?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get dictionary wrong words:', error);
      throw error;
    }
  }

  /**
   * Get high priority wrong words for review
   */
  async getHighPriorityWords(options = {}) {
    const { minPriority = 4, limit = 20 } = options;
    
    try {
      const params = new URLSearchParams();
      params.append('minPriority', minPriority.toString());
      params.append('limit', limit.toString());
      
      const response = await this.api.request(`/api/wrong-words/high-priority?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get high priority words:', error);
      throw error;
    }
  }

  /**
   * Mark wrong word review attempt
   */
  async reviewWrongWord(wrongWordId, reviewData) {
    try {
      const response = await this.api.request(`/api/wrong-words/${wrongWordId}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      return response;
    } catch (error) {
      console.error('Failed to review wrong word:', error);
      throw error;
    }
  }

  /**
   * Mark wrong word as resolved
   */
  async markAsResolved(wrongWordId) {
    try {
      const response = await this.api.request(`/api/wrong-words/${wrongWordId}/resolved`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Failed to mark as resolved:', error);
      throw error;
    }
  }

  /**
   * Update learning notes for wrong word
   */
  async updateLearningNotes(wrongWordId, notes) {
    try {
      const response = await this.api.request(`/api/wrong-words/${wrongWordId}/notes`, {
        method: 'PUT',
        body: JSON.stringify(notes)
      });
      return response;
    } catch (error) {
      console.error('Failed to update learning notes:', error);
      throw error;
    }
  }

  /**
   * Get wrong words analytics
   */
  async getWrongWordsAnalytics(timeframe = 30) {
    try {
      const params = new URLSearchParams();
      params.append('timeframe', timeframe.toString());
      
      const response = await this.api.request(`/api/wrong-words/analytics?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get wrong words analytics:', error);
      throw error;
    }
  }

  // ==== UTILITY METHODS ====

  /**
   * Generate audio URL for word pronunciation
   */
  generateAudioUrl(word, type = 2) {
    if (!word) return null;
    const encodedWord = encodeURIComponent(word.trim());
    return `https://dict.youdao.com/dictvoice?audio=${encodedWord}&type=${type}`;
  }

  /**
   * Play word audio
   */
  async playWordAudio(word, type = 2) {
    try {
      const audioUrl = this.generateAudioUrl(word, type);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onloadeddata = () => {
          audio.play().then(resolve).catch(reject);
        };
        audio.onerror = () => {
          reject(new Error(`Failed to load audio for word: ${word}`));
        };
      });
    } catch (error) {
      console.error('Failed to play word audio:', error);
      throw error;
    }
  }

  /**
   * Format dictionary categories for display
   */
  formatDictionaryCategories(dictionaries) {
    const categoryGroups = {};
    
    dictionaries.forEach(dict => {
      const category = dict.category || 'General';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(dict);
    });
    
    return categoryGroups;
  }

  /**
   * Calculate learning statistics
   */
  calculateLearningStats(userDictionaries) {
    const stats = {
      totalDictionaries: userDictionaries.length,
      completedDictionaries: 0,
      inProgressDictionaries: 0,
      totalWordsLearned: 0,
      overallAccuracy: 0,
      averageCompletion: 0
    };

    if (userDictionaries.length === 0) return stats;

    let totalCorrect = 0;
    let totalAttempts = 0;
    let totalCompletion = 0;

    userDictionaries.forEach(dict => {
      if (dict.progress) {
        if (dict.progress.status === 'completed') {
          stats.completedDictionaries++;
        } else if (dict.progress.status === 'in_progress') {
          stats.inProgressDictionaries++;
        }
        
        stats.totalWordsLearned += dict.progress.completed_words || 0;
        totalCorrect += dict.progress.correct_answers || 0;
        totalAttempts += (dict.progress.correct_answers || 0) + (dict.progress.wrong_answers || 0);
        totalCompletion += dict.progress.completion_percentage || 0;
      }
    });

    if (totalAttempts > 0) {
      stats.overallAccuracy = Math.round((totalCorrect / totalAttempts) * 100 * 100) / 100;
    }

    stats.averageCompletion = Math.round((totalCompletion / userDictionaries.length) * 100) / 100;

    return stats;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key) {
    this.cache.delete(key);
  }
}

export default VocabularyService; 