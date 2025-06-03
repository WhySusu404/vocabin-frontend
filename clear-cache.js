// Simple cache clearing utility
// Run this in browser console to clear all VocaBin related storage

console.log('🧹 Clearing VocaBin cache and storage...');

// Clear localStorage
const keys = Object.keys(localStorage);
const vocabinKeys = keys.filter(key => key.includes('vocabin'));
console.log('📦 Found VocaBin localStorage keys:', vocabinKeys);

vocabinKeys.forEach(key => {
  console.log(`🗑️ Removing ${key}:`, localStorage.getItem(key));
  localStorage.removeItem(key);
});

// Clear sessionStorage
const sessionKeys = Object.keys(sessionStorage);
const vocabinSessionKeys = sessionKeys.filter(key => key.includes('vocabin'));
console.log('📦 Found VocaBin sessionStorage keys:', vocabinSessionKeys);

vocabinSessionKeys.forEach(key => {
  console.log(`🗑️ Removing ${key}:`, sessionStorage.getItem(key));
  sessionStorage.removeItem(key);
});

console.log('✅ VocaBin cache cleared! Please refresh the page.');
console.log('💡 To run this again, copy and paste this entire script in console.'); 