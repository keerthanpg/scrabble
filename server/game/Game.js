const Board = require('./Board');
const TileBag = require('./TileBag');
const ScoreCalculator = require('./ScoreCalculator');
const { DEFAULT_TIMER_MS, TIMER_UPDATE_INTERVAL_MS, CHALLENGE_PENALTY } = require('../config/scrabbleConfig');

class Game {
  constructor(gameId, wordValidator, io) {
    this.gameId = gameId;
    this.io = io;
    this.status = 'waiting'; // 'waiting', 'active', 'finished'
    this.players = [];
    this.board = new Board();
    this.tileBag = new TileBag();
    this.wordValidator = wordValidator;
    this.scoreCalculator = new ScoreCalculator();
    this.currentPlayerIndex = 0;
    this.moveHistory = [];
    this.challengeState = null;
    this.pendingTiles = []; // Tiles placed but not yet submitted
    this.timerIntervals = new Map();
    this.consecutivePasses = 0;
  }

  /**
   * Add a player to the game
   * @param {string} socketId
   * @param {string} name
   * @returns {boolean} - Success
   */
  addPlayer(socketId, name) {
    if (this.players.length >= 2) {
      return false;
    }

    this.players.push({
      id: socketId,
      name: name,
      score: 0,
      rack: [],
      timeRemaining: DEFAULT_TIMER_MS,
      isActive: this.players.length === 0, // First player is active
      consecutivePasses: 0
    });

    // Start game when second player joins
    if (this.players.length === 2) {
      this.start();
    }

    return true;
  }

  /**
   * Start the game
   */
  start() {
    this.status = 'active';
    console.log(`Starting game ${this.gameId} with players:`, this.players.map(p => `${p.name} (${p.id})`));

    // Deal 7 tiles to each player
    for (const player of this.players) {
      player.rack = this.tileBag.draw(7).map(t => t.letter);
    }

    // Start timer for first player
    this.startPlayerTimer(this.getCurrentPlayer().id);

    // Emit game start event to each player with personalized state
    for (const player of this.players) {
      console.log(`Sending gameStart to ${player.name} (${player.id})`);
      this.io.to(player.id).emit('gameStart', {
        gameState: this.getState(player.id)
      });
    }
    console.log(`Game ${this.gameId} started successfully`);
  }

  /**
   * Place tiles on the board (pending, not committed)
   * @param {string} playerId
   * @param {Array} tiles - [{row, col, letter}]
   * @returns {object} - Result
   */
  placeTiles(playerId, tiles) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Clear previous pending tiles
    this.clearPendingTiles();

    // Validate tiles are from player's rack
    const player = this.getPlayer(playerId);
    for (const tile of tiles) {
      if (!player.rack.includes(tile.letter)) {
        return { success: false, error: `Tile ${tile.letter} not in your rack` };
      }
    }

    // Add points to tiles
    const { TILE_DISTRIBUTION } = require('../config/scrabbleConfig');
    const tilesWithPoints = tiles.map(t => ({
      ...t,
      points: TILE_DISTRIBUTION[t.letter].points
    }));

    // Validate placement
    const validation = this.board.validatePlacement(tilesWithPoints);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    // Store as pending
    this.pendingTiles = tilesWithPoints;

    // Temporarily place on board for visualization
    for (const tile of this.pendingTiles) {
      this.board.placeTile(tile.row, tile.col, tile.letter, tile.points, true);
    }

    return { success: true };
  }

  /**
   * Submit the current word placement
   * @param {string} playerId
   * @returns {object} - Result with score
   */
  async submitWord(playerId) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.pendingTiles.length === 0) {
      return { success: false, error: 'No tiles placed' };
    }

    // Extract formed words
    const formedWords = this.board.getFormedWords(this.pendingTiles);

    if (formedWords.length === 0) {
      this.clearPendingTiles();
      return { success: false, error: 'No valid words formed' };
    }

    // Validate all words
    const wordStrings = formedWords.map(w => w.word);
    const validation = this.wordValidator.validateWords(wordStrings);

    if (!validation.allValid) {
      this.clearPendingTiles();
      return {
        success: false,
        error: `Invalid word(s): ${validation.invalidWords.join(', ')}`
      };
    }

    // Calculate score
    const score = this.scoreCalculator.calculateScore(formedWords, this.board);

    // Commit the move
    this.board.commitTiles();
    const player = this.getPlayer(playerId);
    player.score += score;

    // Remove used tiles from rack
    for (const tile of this.pendingTiles) {
      const index = player.rack.indexOf(tile.letter);
      if (index > -1) {
        player.rack.splice(index, 1);
      }
    }

    // Draw new tiles
    const newTiles = this.tileBag.draw(this.pendingTiles.length);
    player.rack.push(...newTiles.map(t => t.letter));

    // Record move in history
    this.moveHistory.push({
      playerId: playerId,
      playerName: player.name,
      words: wordStrings,
      tiles: [...this.pendingTiles],
      score: score,
      timestamp: Date.now()
    });

    this.pendingTiles = [];
    player.consecutivePasses = 0;
    this.consecutivePasses = 0;

    // Check for game end
    if (this.tileBag.isEmpty() && player.rack.length === 0) {
      this.endGame('tiles_exhausted');
      return { success: true, score: score, gameOver: true };
    }

    // Switch turn
    this.switchTurn();

    return { success: true, score: score, words: wordStrings };
  }

  /**
   * Handle a challenge from a player
   * @param {string} challengerId
   * @returns {object} - Challenge result
   */
  handleChallenge(challengerId) {
    // Can only challenge immediately after opponent's move
    if (this.moveHistory.length === 0) {
      return { success: false, error: 'No move to challenge' };
    }

    const lastMove = this.moveHistory[this.moveHistory.length - 1];

    if (lastMove.playerId === challengerId) {
      return { success: false, error: 'Cannot challenge your own move' };
    }

    // Must be done right after opponent's move
    if (this.getCurrentPlayer().id !== challengerId) {
      return { success: false, error: 'Can only challenge right after opponent\'s move' };
    }

    // Pause timer
    this.stopPlayerTimer(this.getCurrentPlayer().id);

    // Get the word to challenge (main word from last move)
    const wordToCheck = lastMove.words[0];
    const isValid = this.wordValidator.isValid(wordToCheck);

    const result = this.resolveChallenge(challengerId, lastMove, isValid);

    // Resume timer
    this.startPlayerTimer(this.getCurrentPlayer().id);

    return result;
  }

  /**
   * Resolve a challenge
   * @param {string} challengerId
   * @param {object} lastMove
   * @param {boolean} wordIsValid
   * @returns {object}
   */
  resolveChallenge(challengerId, lastMove, wordIsValid) {
    const challenger = this.getPlayer(challengerId);
    const challenged = this.getPlayer(lastMove.playerId);

    if (!wordIsValid) {
      // Challenge successful: remove tiles, deduct score, opponent loses turn
      for (const tile of lastMove.tiles) {
        this.board.removeTile(tile.row, tile.col);
      }

      challenged.score -= lastMove.score;
      challenged.score = Math.max(0, challenged.score);

      // Return tiles to challenged player's rack
      challenged.rack.push(...lastMove.tiles.map(t => t.letter));

      // Remove the move from history
      this.moveHistory.pop();

      // Turn stays with challenger
      this.currentPlayerIndex = this.players.findIndex(p => p.id === challengerId);

      return {
        success: true,
        valid: false,
        message: `"${lastMove.words[0]}" is not valid. ${challenged.name} loses ${lastMove.score} points and their turn.`,
        scoreChanges: [
          { playerId: challenged.id, newScore: challenged.score }
        ]
      };
    } else {
      // Challenge failed: challenger loses points
      challenger.score -= CHALLENGE_PENALTY;
      challenger.score = Math.max(0, challenger.score);

      return {
        success: false,
        valid: true,
        message: `"${lastMove.words[0]}" is valid. ${challenger.name} loses ${CHALLENGE_PENALTY} points.`,
        scoreChanges: [
          { playerId: challenger.id, newScore: challenger.score }
        ]
      };
    }
  }

  /**
   * Handle a player passing their turn
   * @param {string} playerId
   * @returns {object}
   */
  passTurn(playerId) {
    if (this.getCurrentPlayer().id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.getPlayer(playerId);
    player.consecutivePasses++;
    this.consecutivePasses++;

    // If both players pass twice in a row, end the game
    if (this.consecutivePasses >= 4) {
      this.endGame('both_passed');
      return { success: true, gameOver: true };
    }

    this.switchTurn();
    return { success: true };
  }

  /**
   * Switch to the next player's turn
   */
  switchTurn() {
    const currentPlayer = this.getCurrentPlayer();
    this.stopPlayerTimer(currentPlayer.id);

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
    const nextPlayer = this.getCurrentPlayer();

    this.startPlayerTimer(nextPlayer.id);

    this.io.to(this.gameId).emit('turnChanged', {
      currentPlayerId: nextPlayer.id,
      currentPlayerName: nextPlayer.name,
      timestamp: Date.now()
    });
  }

  /**
   * Start timer for a player
   * @param {string} playerId
   */
  startPlayerTimer(playerId) {
    const player = this.getPlayer(playerId);
    player.turnStartTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - player.turnStartTime;
      const remaining = player.timeRemaining - elapsed;

      if (remaining <= 0) {
        this.handleTimeout(playerId);
        return;
      }

      // Emit timer update
      this.io.to(this.gameId).emit('timerUpdate', {
        playerId: playerId,
        timeRemaining: Math.max(0, remaining)
      });
    }, TIMER_UPDATE_INTERVAL_MS);

    this.timerIntervals.set(playerId, interval);
  }

  /**
   * Stop timer for a player
   * @param {string} playerId
   */
  stopPlayerTimer(playerId) {
    const player = this.getPlayer(playerId);

    if (player.turnStartTime) {
      const elapsed = Date.now() - player.turnStartTime;
      player.timeRemaining -= elapsed;
      player.timeRemaining = Math.max(0, player.timeRemaining);
      player.turnStartTime = null;
    }

    const interval = this.timerIntervals.get(playerId);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(playerId);
    }
  }

  /**
   * Handle timer timeout
   * @param {string} playerId
   */
  handleTimeout(playerId) {
    this.stopPlayerTimer(playerId);
    this.endGame('timeout', playerId);
  }

  /**
   * End the game
   * @param {string} reason - 'timeout', 'tiles_exhausted', 'both_passed'
   * @param {string} loserPlayerId - For timeout
   */
  endGame(reason, loserPlayerId = null) {
    this.status = 'finished';

    // Stop all timers
    for (const player of this.players) {
      this.stopPlayerTimer(player.id);
    }

    // Calculate final scores (deduct remaining tile values)
    if (reason === 'tiles_exhausted' || reason === 'both_passed') {
      const { TILE_DISTRIBUTION } = require('../config/scrabbleConfig');
      for (const player of this.players) {
        let rackValue = 0;
        for (const letter of player.rack) {
          rackValue += TILE_DISTRIBUTION[letter].points;
        }
        player.score -= rackValue;
        player.score = Math.max(0, player.score);
      }
    }

    // Determine winner
    let winner;
    if (reason === 'timeout') {
      winner = this.players.find(p => p.id !== loserPlayerId);
    } else {
      const [p1, p2] = this.players;
      winner = p1.score >= p2.score ? p1 : p2;
    }

    this.io.to(this.gameId).emit('gameOver', {
      winner: {
        id: winner.id,
        name: winner.name,
        score: winner.score
      },
      finalScores: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      })),
      reason: reason
    });
  }

  /**
   * Clear pending tiles
   */
  clearPendingTiles() {
    for (const tile of this.pendingTiles) {
      this.board.removeTile(tile.row, tile.col);
    }
    this.pendingTiles = [];
  }

  /**
   * Get current active player
   * @returns {object}
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get player by ID
   * @param {string} playerId
   * @returns {object}
   */
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Get game state for client
   * @param {string} requestingPlayerId - Optional, to hide opponent's rack
   * @returns {object}
   */
  getState(requestingPlayerId = null) {
    return {
      gameId: this.gameId,
      status: this.status,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        rack: requestingPlayerId === p.id ? p.rack : Array(p.rack.length).fill('?'),
        timeRemaining: p.timeRemaining,
        isActive: p.id === this.getCurrentPlayer().id,
        rackCount: p.rack.length
      })),
      board: this.board.toJSON(),
      currentPlayerId: this.getCurrentPlayer().id,
      tilesRemaining: this.tileBag.remaining(),
      lastMove: this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null
    };
  }

  /**
   * Clean up game resources
   */
  cleanup() {
    for (const player of this.players) {
      this.stopPlayerTimer(player.id);
    }
  }
}

module.exports = Game;
