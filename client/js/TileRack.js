class TileRack {
  constructor(element) {
    this.element = element;
    this.tiles = [];
    this.tilePoints = {
      'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
      'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
      'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
      'Y': 4, 'Z': 10, '_': 0
    };
  }

  /**
   * Render the tile rack
   * @param {Array} tiles - Array of letter strings
   */
  render(tiles) {
    // Filter out '?' (hidden opponent tiles that shouldn't be rendered)
    this.tiles = tiles.filter(letter => letter !== '?');
    this.element.innerHTML = '';

    this.tiles.forEach((letter, index) => {
      const tileElement = this.createTileElement(letter, index);
      this.element.appendChild(tileElement);
    });
  }

  /**
   * Create a tile element
   * @param {string} letter
   * @param {number} index
   * @returns {HTMLElement}
   */
  createTileElement(letter, index) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.draggable = true;
    tile.dataset.letter = letter;
    tile.dataset.index = index;
    tile.dataset.points = this.tilePoints[letter];

    // Letter
    const letterSpan = document.createElement('span');
    letterSpan.textContent = letter === '_' ? '?' : letter;
    tile.appendChild(letterSpan);

    // Points
    const pointsSpan = document.createElement('span');
    pointsSpan.className = 'tile-points';
    pointsSpan.textContent = this.tilePoints[letter];
    tile.appendChild(pointsSpan);

    return tile;
  }

  /**
   * Remove a tile from the rack
   * @param {string} letter
   */
  removeTile(letter) {
    const index = this.tiles.indexOf(letter);
    if (index > -1) {
      this.tiles.splice(index, 1);
      this.render(this.tiles);
    }
  }

  /**
   * Add a tile to the rack
   * @param {string} letter
   */
  addTile(letter) {
    this.tiles.push(letter);
    this.render(this.tiles);
  }

  /**
   * Get all tiles
   * @returns {Array}
   */
  getTiles() {
    return this.tiles;
  }

  /**
   * Clear the rack
   */
  clear() {
    this.tiles = [];
    this.element.innerHTML = '';
  }
}
