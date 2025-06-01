// Mock Data for VocaBin Frontend
// Based on the database schema from README.md

export const mockUser = {
  _id: "user123",
  email: "suyun@example.com",
  firstName: "Suyun",
  lastName: "Kim",
  role: "learner",
  profileImage: "avatar-suyun.jpg",
  registrationDate: "2024-01-15T08:00:00Z",
  lastLogin: "2024-03-20T14:30:00Z",
  isActive: true,
  learningPreferences: {
    difficulty: "intermediate",
    studyTime: 30,
    reminderEnabled: true,
    language: "english",
    dictionMode: true,
    paraphrase: true
  },
  statistics: {
    totalWordsLearned: 342,
    currentStreak: 12,
    longestStreak: 28,
    totalStudyTime: 1250,
    vocabularyProgress: 200, // words completed
    listeningProgress: 400, // sentences completed  
    readingProgress: 15, // articles completed
    vocabularyTotal: 1204,
    listeningTotal: 4009,
    readingTotal: 20
  }
};

export const mockWordLists = [
  {
    _id: "wordlist1",
    title: "IELTS Conversation word list",
    description: "Essential vocabulary for IELTS speaking section",
    isPublic: true,
    createdBy: "admin1",
    difficulty: "intermediate",
    createdDate: "2024-02-01T08:00:00Z",
    lastModified: "2024-03-15T10:30:00Z",
    totalWords: 1204,
    completedWords: 200,
    chapter: 4,
    words: ["word1", "word2", "word3"]
  },
  {
    _id: "wordlist2", 
    title: "Business English Essentials",
    description: "Key vocabulary for professional communication",
    isPublic: true,
    createdBy: "admin1",
    difficulty: "advanced",
    createdDate: "2024-01-20T09:00:00Z",
    lastModified: "2024-03-10T15:45:00Z",
    totalWords: 856,
    completedWords: 125,
    chapter: 2,
    words: ["word4", "word5", "word6"]
  }
];

export const mockWords = {
  "word1": {
    _id: "word1",
    word: "catch",
    definition: "to take hold of something, especially something that is moving",
    pronunciation: "/kætʃ/",
    examples: ["I tried to catch the ball", "Can you catch what I'm saying?"],
    audioFile: "catch.mp3",
    difficulty: "beginner",
    partOfSpeech: "verb"
  },
  "word2": {
    _id: "word2", 
    word: "typical",
    definition: "showing the characteristics expected of or popularly associated with a particular person, situation, or thing",
    pronunciation: "/ˈtɪpɪkəl/",
    examples: ["It's typical weather for this time of year", "That's a typical response"],
    audioFile: "typical.mp3",
    difficulty: "intermediate",
    partOfSpeech: "adjective"
  },
  "word3": {
    _id: "word3",
    word: "terrible",
    definition: "extremely bad or serious",
    pronunciation: "/ˈterəbəl/",
    examples: ["The weather was terrible", "I feel terrible about what happened"],
    audioFile: "terrible.mp3", 
    difficulty: "intermediate",
    partOfSpeech: "adjective"
  }
};

export const mockListeningMaterials = [
  {
    _id: "listening1",
    title: "BBC Daily English Talk",
    description: "Daily conversations and news discussions",
    audioFile: "bbc-daily-talk.mp3",
    transcript: "Welcome to BBC Daily English Talk. Today we'll discuss...",
    difficulty: "intermediate",
    duration: 180,
    totalSentences: 4009,
    completedSentences: 400,
    exercises: [
      {
        question: "What is the main topic of today's discussion?",
        options: ["Weather", "News", "Sports", "Technology"],
        correct: 1
      }
    ]
  }
];

export const mockReadingMaterials = [
  {
    _id: "reading1",
    title: "Essay one words list",
    description: "A Typical Day on a Strange Planet",
    difficulty: "intermediate",
    createdDate: "2024-04-13T00:00:00Z",
    wordList: ["catch", "typical", "noise", "project", "terrible", "describe", "ever", "planet"],
    content: `A Typical Day on a Strange Planet

Last month, I was chosen for a special project—to explore a newly discovered planet far from Earth. It was the most exciting adventure I had ever been on! When we landed, everything seemed typical at first. The sky was blue, the ground was solid, and there was no sign of danger. But soon, we heard a strange noise coming from the mountains. It wasn't like anything I could describe—a mix of whispering and deep growls.

As we moved closer, something jumped out of the bushes. I tried to catch a glimpse of it, but it disappeared too quickly. Suddenly, the ground started shaking, and a terrible storm rolled in. Lightning flashed across the sky, and strong winds made it hard to move. We had no choice but to run back to our spaceship. Although the mission didn't go as planned, it was still the most thrilling project I had ever worked on. And that strange noise? I'm still trying to describe it!`,
    exercises: [
      {
        type: "fill-in-blank",
        title: "Fill in the Blank",
        questions: [
          {
            text: "This is the most exciting science fiction movie I have _____ watched! 🚀",
            answer: "ever",
            options: ["ever", "never", "always", "often"]
          },
          {
            text: "The scientist was working on a new _____ to explore Mars. 🪐", 
            answer: "project",
            options: ["project", "planet", "spaceship", "adventure"]
          },
          {
            text: "I tried to _____ the falling book, but I was too slow. 📚",
            answer: "catch", 
            options: ["catch", "throw", "drop", "hold"]
          }
        ]
      }
    ]
  }
];

export const mockReadingByDate = [
  { number: 20, date: "17 Apr", id: "reading20" },
  { number: 13, date: "13 Apr", id: "reading13" }, 
  { number: 11, date: "11 Apr", id: "reading11" },
  { number: 3, date: "27 Mar", id: "reading3" },
  { number: 6, date: "21 Mar", id: "reading6" },
  { number: 21, date: "20 Mar", id: "reading21" },
  { number: 16, date: "12 Mar", id: "reading16" },
  { number: 19, date: "11 Mar", id: "reading19" },
  { number: 11, date: "09 Mar", id: "reading11" },
  { number: 10, date: "06 Mar", id: "reading10" },
  { number: 5, date: "05 Mar", id: "reading5" },
  { number: 7, date: "01 Mar", id: "reading7" },
  { number: 9, date: "28 Feb", id: "reading9" }
];

export const mockUserProgress = {
  vocabulary: {
    currentListId: "wordlist1",
    currentChapter: 4,
    wordsLearned: 200,
    totalWords: 1204,
    accuracy: 85,
    lastSession: "2024-03-20T14:00:00Z"
  },
  listening: {
    currentMaterialId: "listening1", 
    sentencesCompleted: 400,
    totalSentences: 4009,
    accuracy: 78,
    lastSession: "2024-03-19T16:30:00Z"
  },
  reading: {
    articlesCompleted: 15,
    totalArticles: 20,
    currentArticleId: "reading1",
    lastSession: "2024-03-18T11:20:00Z"
  }
};

export const mockLearningSession = {
  vocabulary: {
    timeElapsed: 0,
    inputCount: 0,
    correctCount: 0,
    accuracy: 0,
    isActive: false,
    currentWord: null,
    mode: "flashcard" // flashcard, quiz, test
  }
}; 