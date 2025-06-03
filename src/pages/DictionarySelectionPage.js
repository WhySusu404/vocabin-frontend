// import DictionarySelector from '../components/DictionarySelector.js';

// export default class DictionarySelectionPage {
//   constructor() {
//     this.name = 'DictionarySelectionPage';
//     this.dictionarySelector = null;
//   }

//   render() {
//     return `
//       <div class="dictionary-selection-page">
//         <div id="dictionary-selection-content"></div>
//       </div>
//     `;
//   }

//   async mount() {
//     // Load CSS for vocabulary components
//     await this.loadVocabularyStyles();
    
//     // Initialize and mount the dictionary selector
//     this.dictionarySelector = new DictionarySelector();
    
//     const container = document.getElementById('dictionary-selection-content');
//     if (container) {
//       container.innerHTML = this.dictionarySelector.render();
//       await this.dictionarySelector.mount();
//     }
//   }

//   async loadVocabularyStyles() {
//     // Check if vocabulary styles are already loaded
//     if (document.querySelector('link[href*="vocabulary.css"]')) {
//       return;
//     }
    
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = './src/styles/vocabulary.css';
//     document.head.appendChild(link);
    
//     // Wait for styles to load
//     return new Promise((resolve) => {
//       link.onload = resolve;
//       link.onerror = resolve; // Continue even if styles fail to load
//     });
//   }

//   cleanup() {
//     // Clean up dictionary selector
//     if (this.dictionarySelector && this.dictionarySelector.cleanup) {
//       this.dictionarySelector.cleanup();
//     }
    
//   }
// } 