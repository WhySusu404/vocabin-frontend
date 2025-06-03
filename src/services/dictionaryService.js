class DictionaryService {
    constructor() {
        this.dictionaries = []
        this.loadedDictionaries = new Map()
        this.initialized = false
    }

    async initialize() {
        if (this.initialized) return

        // Define available dictionaries with their metadata
        this.dictionaries = [
            {
                id: 'gre-computer-based-test',
                name: 'GRE-computer-based-test',
                display_name: 'GRE Computer Based Test',
                description: 'GRE vocabulary for computer-based test',
                file_path: './src/dicts/GRE-computer-based-test.json',
                total_words: 0, // Will be calculated after loading
                difficulty_level: 'advanced',
                category: 'vocabulary'
            },
            {
                id: 'gre3000-3-t',
                name: 'GRE3000_3_T',
                display_name: 'GRE 3000 Core Vocabulary',
                description: 'Essential GRE vocabulary - 3000 words',
                file_path: './src/dicts/GRE3000_3_T.json',
                total_words: 0,
                difficulty_level: 'advanced',
                category: 'vocabulary'
            },
            {
                id: 'ielts-3-t',
                name: 'IELTS_3_T',
                display_name: 'IELTS Core Vocabulary',
                description: 'Essential IELTS vocabulary',
                file_path: './src/dicts/IELTS_3_T.json',
                total_words: 0,
                difficulty_level: 'intermediate',
                category: 'vocabulary'
            },
            {
                id: 'cet6-t',
                name: 'CET6_T',
                display_name: 'CET-6 Vocabulary',
                description: 'College English Test Level 6 vocabulary',
                file_path: './src/dicts/CET6_T.json',
                total_words: 0,
                difficulty_level: 'intermediate',
                category: 'vocabulary'
            },
            {
                id: 'cet4-t',
                name: 'CET4_T',
                display_name: 'CET-4 Vocabulary',
                description: 'College English Test Level 4 vocabulary',
                file_path: './src/dicts/CET4_T.json',
                total_words: 0,
                difficulty_level: 'beginner',
                category: 'vocabulary'
            }
        ]

        this.initialized = true
    }

    async loadDictionary(dictionaryId) {
        if (this.loadedDictionaries.has(dictionaryId)) {
            return this.loadedDictionaries.get(dictionaryId)
        }

        const dictInfo = this.dictionaries.find(d => d.id === dictionaryId)
        if (!dictInfo) {
            throw new Error(`Dictionary ${dictionaryId} not found`)
        }

        try {
            const response = await fetch(dictInfo.file_path)
            if (!response.ok) {
                throw new Error(`Failed to load dictionary: ${response.status}`)
            }

            const words = await response.json()
            
            // Update total words count
            dictInfo.total_words = words.length

            const dictionaryData = {
                ...dictInfo,
                words
            }

            this.loadedDictionaries.set(dictionaryId, dictionaryData)
            return dictionaryData

        } catch (error) {
            console.error(`Error loading dictionary ${dictionaryId}:`, error)
            throw error
        }
    }

    async getDictionaries() {
        await this.initialize()
        
        // Load word counts for each dictionary if not already loaded
        const loadPromises = this.dictionaries.map(async (dict) => {
            if (dict.total_words === 0) {
                try {
                    const response = await fetch(dict.file_path)
                    if (response.ok) {
                        const words = await response.json()
                        dict.total_words = words.length
                        console.log(`Loaded ${dict.name}: ${dict.total_words} words`)
                    }
                } catch (error) {
                    console.warn(`Failed to get word count for ${dict.name}:`, error)
                    // Set a default count if loading fails
                    dict.total_words = 1000 // Default estimate
                }
            }
        })

        await Promise.all(loadPromises)
        return this.dictionaries
    }

    async getDictionary(dictionaryId) {
        await this.initialize()
        const dictInfo = this.dictionaries.find(d => d.id === dictionaryId)
        return dictInfo || null
    }

    // Generate mock user progress for local development
    generateMockUserProgress() {
        const dictionaries = this.dictionaries.slice(0, 3) // First 3 dictionaries
        
        return dictionaries.map((dict, index) => {
            const hasProgress = index < 2 // First 2 have progress
            const totalWords = dict.total_words || 1000
            const progress = hasProgress ? {
                completed_words: Math.floor(totalWords * (0.1 + index * 0.15)), // 10%, 25%
                correct_answers: Math.floor(totalWords * (0.08 + index * 0.12)),
                wrong_answers: Math.floor(totalWords * (0.02 + index * 0.03)),
                current_position: Math.floor(totalWords * (0.1 + index * 0.15)),
                status: index === 0 ? 'in_progress' : 'in_progress',
                accuracy_rate: 75 + index * 5,
                completion_percentage: Math.round((0.1 + index * 0.15) * 100),
                last_accessed: new Date().toISOString(),
                started_at: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
            } : null

            return {
                dictionary: dict,
                progress
            }
        })
    }
}

export default DictionaryService 