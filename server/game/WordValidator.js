const fs = require('fs').promises;
const path = require('path');

class WordValidator {
  constructor() {
    this.dictionary = new Set();
    this.isLoaded = false;
  }

  /**
   * Load dictionary from file
   * @param {string} dictionaryPath - Path to dictionary file
   */
  async loadDictionary(dictionaryPath) {
    try {
      const fullPath = path.resolve(dictionaryPath);
      const data = await fs.readFile(fullPath, 'utf-8');

      // Split by newlines, trim whitespace, convert to uppercase
      const words = data
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0);

      // Add all words to Set for O(1) lookup
      words.forEach(word => this.dictionary.add(word));

      this.isLoaded = true;
      console.log(`Dictionary loaded: ${this.dictionary.size} words`);

      return true;
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      throw error;
    }
  }

  /**
   * Check if a word is valid
   * @param {string} word - Word to validate
   * @returns {boolean}
   */
  isValid(word) {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded yet');
    }
    return this.dictionary.has(word.toUpperCase());
  }

  /**
   * Validate multiple words
   * @param {Array} words - Array of words to validate
   * @returns {object} - {allValid: boolean, invalidWords: Array}
   */
  validateWords(words) {
    const invalidWords = [];

    for (const word of words) {
      if (!this.isValid(word)) {
        invalidWords.push(word);
      }
    }

    return {
      allValid: invalidWords.length === 0,
      invalidWords: invalidWords
    };
  }
}

module.exports = WordValidator;
