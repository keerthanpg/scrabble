const { TILE_DISTRIBUTION } = require('../config/scrabbleConfig');

class TileBag {
  constructor() {
    this.tiles = [];
    this.initializeTiles();
    this.shuffle();
  }

  /**
   * Initialize the tile bag with standard Scrabble distribution
   */
  initializeTiles() {
    this.tiles = [];

    for (const [letter, config] of Object.entries(TILE_DISTRIBUTION)) {
      for (let i = 0; i < config.count; i++) {
        this.tiles.push({
          letter: letter,
          points: config.points
        });
      }
    }
  }

  /**
   * Shuffle the tiles using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  /**
   * Draw tiles from the bag
   * @param {number} count - Number of tiles to draw
   * @returns {Array} - Array of drawn tiles
   */
  draw(count) {
    const drawn = [];
    const actualCount = Math.min(count, this.tiles.length);

    for (let i = 0; i < actualCount; i++) {
      drawn.push(this.tiles.pop());
    }

    return drawn;
  }

  /**
   * Return tiles to the bag (for swapping) and reshuffle
   * @param {Array} tiles - Tiles to return
   */
  returnTiles(tiles) {
    this.tiles.push(...tiles);
    this.shuffle();
  }

  /**
   * Get number of remaining tiles
   * @returns {number}
   */
  remaining() {
    return this.tiles.length;
  }

  /**
   * Check if bag is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.tiles.length === 0;
  }
}

module.exports = TileBag;
