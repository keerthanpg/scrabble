class BoardRenderer {
  constructor(element) {
    this.element = element;
    this.grid = [];
    this.bonusSquares = this.initBonusSquares();
    this.pendingTiles = [];
    this.tilePoints = {
      'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
      'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
      'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
      'Y': 4, 'Z': 10, '_': 0
    };
  }

  /**
   * Initialize bonus squares layout
   * @returns {Map}
   */
  initBonusSquares() {
    const bonuses = new Map();

    // Triple Word
    [[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]].forEach(([r,c]) => {
      bonuses.set(`${r},${c}`, 'tw');
    });

    // Double Word
    [[1,1],[2,2],[3,3],[4,4],[1,13],[2,12],[3,11],[4,10],
     [7,7], // Center square - double word score
     [10,4],[11,3],[12,2],[13,1],[10,10],[11,11],[12,12],[13,13]].forEach(([r,c]) => {
      bonuses.set(`${r},${c}`, 'dw');
    });

    // Triple Letter
    [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]].forEach(([r,c]) => {
      bonuses.set(`${r},${c}`, 'tl');
    });

    // Double Letter
    [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],
     [7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]].forEach(([r,c]) => {
      bonuses.set(`${r},${c}`, 'dl');
    });

    return bonuses;
  }

  /**
   * Render the board
   * @param {Array} boardData - 15x15 array
   */
  render(boardData) {
    this.element.innerHTML = '';

    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const cell = this.createCell(row, col, boardData[row][col]);
        this.element.appendChild(cell);
      }
    }
  }

  /**
   * Create a board cell
   * @param {number} row
   * @param {number} col
   * @param {object} tileData
   * @returns {HTMLElement}
   */
  createCell(row, col, tileData) {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;

    // Add bonus square class
    const bonus = this.bonusSquares.get(`${row},${col}`);
    if (bonus && !tileData) {
      cell.classList.add(`bonus-${bonus}`);
    }

    // Add tile if present
    if (tileData) {
      const tile = this.createTileElement(tileData);
      cell.appendChild(tile);
    }

    return cell;
  }

  /**
   * Create a tile element
   * @param {object} tileData
   * @returns {HTMLElement}
   */
  createTileElement(tileData) {
    const tile = document.createElement('div');
    tile.className = 'tile';

    if (tileData.isNew) {
      tile.classList.add('new-tile');
      tile.draggable = true; // Make new tiles draggable
    }

    // Letter
    const letterSpan = document.createElement('span');
    letterSpan.textContent = tileData.letter === '_' ? '?' : tileData.letter;
    tile.appendChild(letterSpan);

    // Points
    const pointsSpan = document.createElement('span');
    pointsSpan.className = 'tile-points';
    pointsSpan.textContent = tileData.points;
    tile.appendChild(pointsSpan);

    return tile;
  }

  /**
   * Update board with new state
   * @param {Array} boardData
   */
  update(boardData) {
    this.render(boardData);
  }

  /**
   * Place a pending tile on the board
   * @param {number} row
   * @param {number} col
   * @param {string} letter
   */
  placePendingTile(row, col, letter) {
    const cell = this.getCell(row, col);
    if (!cell || cell.querySelector('.tile')) return false;

    const points = this.tilePoints[letter];
    const tile = this.createTileElement({ letter, points, isNew: true });

    cell.appendChild(tile);
    cell.classList.remove('bonus-tw', 'bonus-dw', 'bonus-tl', 'bonus-dl');

    this.pendingTiles.push({ row, col, letter, points });
    return true;
  }

  /**
   * Clear all pending tiles
   */
  clearPendingTiles() {
    this.pendingTiles.forEach(({ row, col }) => {
      const cell = this.getCell(row, col);
      if (cell) {
        const tile = cell.querySelector('.tile');
        if (tile) {
          cell.removeChild(tile);
        }

        // Restore bonus square display
        const bonus = this.bonusSquares.get(`${row},${col}`);
        if (bonus) {
          cell.classList.add(`bonus-${bonus}`);
        }
      }
    });

    this.pendingTiles = [];
  }

  /**
   * Get pending tiles
   * @returns {Array}
   */
  getPendingTiles() {
    return this.pendingTiles;
  }

  /**
   * Get a cell element
   * @param {number} row
   * @param {number} col
   * @returns {HTMLElement}
   */
  getCell(row, col) {
    return this.element.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }
}
