const { BOARD_SIZE, CENTER_SQUARE, BONUS_SQUARES } = require('../config/scrabbleConfig');

class Board {
  constructor() {
    this.grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    this.firstMoveMade = false;
  }

  /**
   * Get bonus type for a square
   * @param {number} row
   * @param {number} col
   * @returns {string|null} - Bonus type (TW, DW, TL, DL) or null
   */
  getBonus(row, col) {
    return BONUS_SQUARES[`${row},${col}`] || null;
  }

  /**
   * Check if a square is occupied
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  isOccupied(row, col) {
    return this.grid[row][col] !== null;
  }

  /**
   * Place a tile on the board
   * @param {number} row
   * @param {number} col
   * @param {string} letter
   * @param {number} points
   * @param {boolean} isNew - Whether tile was just placed (for bonus calculation)
   */
  placeTile(row, col, letter, points, isNew = true) {
    this.grid[row][col] = {
      letter: letter,
      points: points,
      isNew: isNew
    };
  }

  /**
   * Remove a tile from the board
   * @param {number} row
   * @param {number} col
   * @returns {object|null} - Removed tile or null
   */
  removeTile(row, col) {
    const tile = this.grid[row][col];
    this.grid[row][col] = null;
    return tile;
  }

  /**
   * Mark all tiles as no longer new (after move is committed)
   */
  commitTiles() {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (this.grid[row][col]) {
          this.grid[row][col].isNew = false;
        }
      }
    }
    this.firstMoveMade = true;
  }

  /**
   * Validate tile placement according to Scrabble rules
   * @param {Array} placedTiles - [{row, col, letter, points}]
   * @returns {object} - {valid: boolean, errors: [string]}
   */
  validatePlacement(placedTiles) {
    const errors = [];

    if (placedTiles.length === 0) {
      return { valid: false, errors: ['No tiles placed'] };
    }

    // Check 1: All tiles must be in the same row or column
    const rows = placedTiles.map(t => t.row);
    const cols = placedTiles.map(t => t.col);
    const sameRow = rows.every(r => r === rows[0]);
    const sameCol = cols.every(c => c === cols[0]);

    if (!sameRow && !sameCol) {
      errors.push('All tiles must be placed in the same row or column');
    }

    // Check 2: Tiles must be contiguous (no gaps between new tiles)
    if (sameRow) {
      const sortedCols = [...cols].sort((a, b) => a - b);
      for (let i = sortedCols[0]; i <= sortedCols[sortedCols.length - 1]; i++) {
        if (!this.isOccupied(rows[0], i) && !placedTiles.some(t => t.row === rows[0] && t.col === i)) {
          errors.push('Tiles must be contiguous with no gaps');
          break;
        }
      }
    } else if (sameCol) {
      const sortedRows = [...rows].sort((a, b) => a - b);
      for (let i = sortedRows[0]; i <= sortedRows[sortedRows.length - 1]; i++) {
        if (!this.isOccupied(i, cols[0]) && !placedTiles.some(t => t.row === i && t.col === cols[0])) {
          errors.push('Tiles must be contiguous with no gaps');
          break;
        }
      }
    }

    // Check 3: First move must cover center square
    if (!this.firstMoveMade) {
      const coversCenter = placedTiles.some(t =>
        t.row === CENTER_SQUARE[0] && t.col === CENTER_SQUARE[1]
      );
      if (!coversCenter) {
        errors.push('First move must cover the center square');
      }
    }

    // Check 4: If not first move, must connect to existing tiles
    if (this.firstMoveMade) {
      const isConnected = this.checkConnection(placedTiles);
      if (!isConnected) {
        errors.push('New tiles must connect to existing tiles on the board');
      }
    }

    // Check 5: Cannot place on occupied squares
    for (const tile of placedTiles) {
      if (this.isOccupied(tile.row, tile.col)) {
        errors.push(`Square (${tile.row}, ${tile.col}) is already occupied`);
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if placed tiles connect to existing tiles
   * @param {Array} placedTiles
   * @returns {boolean}
   */
  checkConnection(placedTiles) {
    for (const tile of placedTiles) {
      // Check adjacent squares (up, down, left, right)
      const adjacents = [
        [tile.row - 1, tile.col],
        [tile.row + 1, tile.col],
        [tile.row, tile.col - 1],
        [tile.row, tile.col + 1]
      ];

      for (const [row, col] of adjacents) {
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          if (this.isOccupied(row, col)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Extract all words formed by the placed tiles
   * @param {Array} placedTiles - [{row, col, letter, points}]
   * @returns {Array} - [{word: string, tiles: [tile], direction: 'horizontal'|'vertical'}]
   */
  getFormedWords(placedTiles) {
    // Temporarily place tiles to analyze
    const tempPlacements = [];
    for (const tile of placedTiles) {
      tempPlacements.push({ row: tile.row, col: tile.col, original: this.grid[tile.row][tile.col] });
      this.placeTile(tile.row, tile.col, tile.letter, tile.points, true);
    }

    const words = [];
    const processedPositions = new Set();

    // Find main word (in the direction of placement)
    const rows = placedTiles.map(t => t.row);
    const cols = placedTiles.map(t => t.col);
    const horizontal = rows.every(r => r === rows[0]);

    if (horizontal) {
      const row = rows[0];
      const mainWord = this.extractWord(row, Math.min(...cols), 'horizontal');
      if (mainWord.word.length > 1) {
        words.push(mainWord);
        mainWord.tiles.forEach(t => processedPositions.add(`${t.row},${t.col},horizontal`));
      }
    } else {
      const col = cols[0];
      const mainWord = this.extractWord(Math.min(...rows), col, 'vertical');
      if (mainWord.word.length > 1) {
        words.push(mainWord);
        mainWord.tiles.forEach(t => processedPositions.add(`${t.row},${t.col},vertical`));
      }
    }

    // Find perpendicular words (cross words)
    for (const tile of placedTiles) {
      const perpDirection = horizontal ? 'vertical' : 'horizontal';
      const perpWord = this.extractWord(
        tile.row,
        tile.col,
        perpDirection
      );

      if (perpWord.word.length > 1) {
        const key = `${perpWord.tiles[0].row},${perpWord.tiles[0].col},${perpDirection}`;
        if (!processedPositions.has(key)) {
          words.push(perpWord);
          processedPositions.add(key);
        }
      }
    }

    // Restore board state
    for (const { row, col, original } of tempPlacements) {
      this.grid[row][col] = original;
    }

    return words;
  }

  /**
   * Extract a complete word starting from a position in a direction
   * @param {number} startRow
   * @param {number} startCol
   * @param {string} direction - 'horizontal' or 'vertical'
   * @returns {object} - {word: string, tiles: [tile], direction: string}
   */
  extractWord(startRow, startCol, direction) {
    const isHorizontal = direction === 'horizontal';

    // Find the actual start of the word
    let row = startRow;
    let col = startCol;

    while (true) {
      const prevRow = isHorizontal ? row : row - 1;
      const prevCol = isHorizontal ? col - 1 : col;

      if (prevRow < 0 || prevCol < 0 || !this.isOccupied(prevRow, prevCol)) {
        break;
      }

      row = prevRow;
      col = prevCol;
    }

    // Extract the full word
    const tiles = [];
    let word = '';

    while (row < BOARD_SIZE && col < BOARD_SIZE && this.isOccupied(row, col)) {
      const tile = this.grid[row][col];
      tiles.push({
        row: row,
        col: col,
        letter: tile.letter,
        points: tile.points,
        isNew: tile.isNew
      });
      word += tile.letter;

      if (isHorizontal) {
        col++;
      } else {
        row++;
      }
    }

    return {
      word: word,
      tiles: tiles,
      direction: direction
    };
  }

  /**
   * Get a serializable version of the board
   * @returns {Array}
   */
  toJSON() {
    return this.grid.map(row =>
      row.map(cell => cell ? { ...cell } : null)
    );
  }
}

module.exports = Board;
