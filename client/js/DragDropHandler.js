class DragDropHandler {
  constructor(boardRenderer, tileRack, onTilePlaced, onTileReturned) {
    this.boardRenderer = boardRenderer;
    this.tileRack = tileRack;
    this.onTilePlaced = onTilePlaced;
    this.onTileReturned = onTileReturned;
    this.draggedTile = null;

    this.setupDragAndDrop();
  }

  /**
   * Setup drag and drop event listeners
   */
  setupDragAndDrop() {
    // Rack tile drag events
    this.tileRack.element.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('tile')) {
        this.draggedTile = {
          letter: e.target.dataset.letter,
          points: e.target.dataset.points,
          element: e.target
        };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    this.tileRack.element.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('tile')) {
        e.target.classList.remove('dragging');
        this.draggedTile = null;
      }
    });

    // Board cell drop events
    this.boardRenderer.element.addEventListener('dragover', (e) => {
      e.preventDefault();
      const cell = e.target.closest('.board-cell');

      if (cell && !cell.querySelector('.tile')) {
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('drop-target');
      }
    });

    this.boardRenderer.element.addEventListener('dragleave', (e) => {
      const cell = e.target.closest('.board-cell');
      if (cell) {
        cell.classList.remove('drop-target');
      }
    });

    this.boardRenderer.element.addEventListener('drop', (e) => {
      e.preventDefault();
      const cell = e.target.closest('.board-cell');

      if (cell && !cell.querySelector('.tile') && this.draggedTile) {
        cell.classList.remove('drop-target');

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const letter = this.draggedTile.letter;

        if (this.draggedTile.fromBoard) {
          // Moving tile from one board position to another
          const oldRow = this.draggedTile.row;
          const oldCol = this.draggedTile.col;

          // Remove from old position
          const oldCell = this.boardRenderer.getCell(oldRow, oldCol);
          if (oldCell) {
            const tile = oldCell.querySelector('.tile');
            if (tile) {
              oldCell.removeChild(tile);
            }

            // Restore bonus display on old cell
            const bonus = this.boardRenderer.bonusSquares.get(`${oldRow},${oldCol}`);
            if (bonus) {
              oldCell.classList.add(`bonus-${bonus}`);
            }
          }

          // Update pending tiles array - remove old position
          const pendingIndex = this.boardRenderer.pendingTiles.findIndex(
            t => t.row === oldRow && t.col === oldCol
          );
          if (pendingIndex > -1) {
            this.boardRenderer.pendingTiles.splice(pendingIndex, 1);
          }

          // Place at new position
          const success = this.boardRenderer.placePendingTile(row, col, letter);

          if (success && this.onTilePlaced) {
            this.onTilePlaced({ row, col, letter });
          }
        } else {
          // Placing tile from rack to board
          const success = this.boardRenderer.placePendingTile(row, col, letter);

          if (success) {
            // Remove from rack
            this.tileRack.removeTile(letter);

            // Notify parent
            if (this.onTilePlaced) {
              this.onTilePlaced({ row, col, letter });
            }
          }
        }
      }
    });

    // Board tile drag events (for moving tiles on board or returning to rack)
    this.boardRenderer.element.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('tile') && e.target.classList.contains('new-tile')) {
        const cell = e.target.closest('.board-cell');
        const letter = e.target.textContent.trim().replace(/[0-9]/g, '');
        // Handle blank tiles represented as '?'
        const actualLetter = letter === '?' ? '_' : letter;

        this.draggedTile = {
          letter: actualLetter,
          points: e.target.querySelector('.tile-points')?.textContent || '0',
          row: parseInt(cell.dataset.row),
          col: parseInt(cell.dataset.col),
          element: e.target,
          fromBoard: true
        };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    this.boardRenderer.element.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('tile')) {
        e.target.classList.remove('dragging');
      }
    });

    // Rack drop events (for returning tiles)
    this.tileRack.element.addEventListener('dragover', (e) => {
      if (this.draggedTile && this.draggedTile.fromBoard) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.tileRack.element.classList.add('drop-target');
      }
    });

    this.tileRack.element.addEventListener('dragleave', (e) => {
      this.tileRack.element.classList.remove('drop-target');
    });

    this.tileRack.element.addEventListener('drop', (e) => {
      e.preventDefault();
      this.tileRack.element.classList.remove('drop-target');

      if (this.draggedTile && this.draggedTile.fromBoard) {
        const { row, col, letter } = this.draggedTile;

        // Remove from board
        const cell = this.boardRenderer.getCell(row, col);
        if (cell) {
          const tile = cell.querySelector('.tile');
          if (tile) {
            cell.removeChild(tile);
          }

          // Restore bonus display
          const bonus = this.boardRenderer.bonusSquares.get(`${row},${col}`);
          if (bonus) {
            cell.classList.add(`bonus-${bonus}`);
          }
        }

        // Remove from pending tiles
        const pendingIndex = this.boardRenderer.pendingTiles.findIndex(
          t => t.row === row && t.col === col
        );
        if (pendingIndex > -1) {
          this.boardRenderer.pendingTiles.splice(pendingIndex, 1);
        }

        // Add back to rack
        this.tileRack.addTile(letter);

        // Notify parent
        if (this.onTileReturned) {
          this.onTileReturned({ row, col, letter });
        }

        this.draggedTile = null;
      }
    });
  }

  /**
   * Enable or disable drag and drop
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    const tiles = this.tileRack.element.querySelectorAll('.tile');
    tiles.forEach(tile => {
      tile.draggable = enabled;
    });
  }
}
