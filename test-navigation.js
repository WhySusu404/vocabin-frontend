// Navigation Test Script
// Run this in the browser console to test navigation

console.log('🧪 Starting Navigation Test...');

// Test 1: Check if router is available
console.log('1. Router available:', typeof window.router !== 'undefined');

// Test 2: Check registered routes
if (window.router) {
  console.log('2. Registered routes:', window.router.routes.size);
  for (let [path, route] of window.router.routes) {
    console.log(`   - ${path}: ${route.component.name || route.component}`);
  }
}

// Test 3: Test navigation to vocabulary
console.log('3. Testing navigation to vocabulary...');
window.location.hash = '#vocabulary';

// Test 4: Check current route after navigation
setTimeout(() => {
  console.log('4. Current hash:', window.location.hash);
  console.log('5. Current route:', window.router?.getCurrentRoute());
}, 1000);

// Test 5: Test direct route finding
if (window.router) {
  console.log('6. Finding vocabulary route:', window.router.findRoute('vocabulary'));
  console.log('7. Finding listening route:', window.router.findRoute('listening'));
  console.log('8. Finding reading route:', window.router.findRoute('reading'));
}

// Test 6: Check if components are available
console.log('9. Testing component imports...');
import('./src/pages/VocabularyPage.js').then(module => {
  console.log('   VocabularyPage loaded:', module.default);
}).catch(err => {
  console.error('   VocabularyPage failed:', err);
});

import('./src/pages/ListeningPage.js').then(module => {
  console.log('   ListeningPage loaded:', module.default);
}).catch(err => {
  console.error('   ListeningPage failed:', err);
});

import('./src/pages/ReadingPage.js').then(module => {
  console.log('   ReadingPage loaded:', module.default);
}).catch(err => {
  console.error('   ReadingPage failed:', err);
});

console.log('🧪 Navigation test complete. Check results above.'); 