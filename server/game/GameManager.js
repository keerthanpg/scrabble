const Game = require('./Game');
const { randomBytes } = require('crypto');

class GameManager {
  constructor(io, wordValidator, ratingManager = null) {
    this.io = io;
    this.wordValidator = wordValidator;
    this.ratingManager = ratingManager;
    this.games = new Map(); // gameId → Game instance
    this.playerToGame = new Map(); // socketId → gameId
  }

  /**
   * Generate a unique game ID
   * @returns {string}
   */
  generateGameId() {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  /**
   * Create a new game
   * @param {object} socket - Socket.io socket
   * @param {string} playerName
   */
  async createGame(socket, playerName) {
    const gameId = this.generateGameId();
    const game = new Game(gameId, this.wordValidator, this.io, this.ratingManager);

    // Store game and mapping
    this.games.set(gameId, game);
    this.playerToGame.set(socket.id, gameId);

    // Join socket.io room FIRST
    await socket.join(gameId);

    // Add creator as first player
    if (!game.addPlayer(socket.id, playerName)) {
      socket.emit('error', { message: 'Failed to create game' });
      return;
    }

    // Notify creator
    socket.emit('gameCreated', {
      gameId: gameId,
      playerId: socket.id,
      playerName: playerName
    });

    console.log(`Game ${gameId} created by ${playerName} (${socket.id})`);
  }

  /**
   * Join an existing game
   * @param {object} socket
   * @param {string} gameId
   * @param {string} playerName
   */
  async joinGame(socket, gameId, playerName) {
    const game = this.games.get(gameId);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    // Store mapping and join room BEFORE adding player
    this.playerToGame.set(socket.id, gameId);
    await socket.join(gameId);

    console.log(`${playerName} (${socket.id}) joined room ${gameId}`);

    // Notify joiner BEFORE adding player (so client has myPlayerId when gameStart arrives)
    socket.emit('gameJoined', {
      gameId: gameId,
      playerId: socket.id,
      playerName: playerName
    });

    // Small delay to ensure gameJoined is processed before gameStart
    await new Promise(resolve => setTimeout(resolve, 10));

    // Now add player (this may trigger game.start() if it's the second player)
    if (!game.addPlayer(socket.id, playerName)) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    console.log(`${playerName} (${socket.id}) added to game ${gameId}`);
  }

  /**
   * Create a matched game for two players (used by matchmaking)
   * @param {object} player1Socket - First player's socket
   * @param {string} player1Name - First player's name
   * @param {object} player2Socket - Second player's socket
   * @param {string} player2Name - Second player's name
   * @returns {string} - gameId
   */
  async createMatchedGame(player1Socket, player1Name, player2Socket, player2Name) {
    const gameId = this.generateGameId();
    const game = new Game(gameId, this.wordValidator, this.io, this.ratingManager);

    // Store game
    this.games.set(gameId, game);

    // Store mappings for both players
    this.playerToGame.set(player1Socket.id, gameId);
    this.playerToGame.set(player2Socket.id, gameId);

    // Join both sockets to room
    await player1Socket.join(gameId);
    await player2Socket.join(gameId);

    console.log(`Both players joined room ${gameId}`);

    // Notify player 1
    player1Socket.emit('gameJoined', {
      gameId: gameId,
      playerId: player1Socket.id,
      playerName: player1Name
    });

    // Notify player 2
    player2Socket.emit('gameJoined', {
      gameId: gameId,
      playerId: player2Socket.id,
      playerName: player2Name
    });

    // Small delay to ensure gameJoined is processed before gameStart
    await new Promise(resolve => setTimeout(resolve, 10));

    // Add both players
    game.addPlayer(player1Socket.id, player1Name);
    game.addPlayer(player2Socket.id, player2Name);

    console.log(`Matched game ${gameId} created: ${player1Name} vs ${player2Name}`);

    return gameId;
  }

  /**
   * Handle tile placement
   * @param {object} socket
   * @param {object} data - {tiles: [{row, col, letter}]}
   */
  handlePlaceTiles(socket, data) {
    const game = this.getGameForPlayer(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = game.placeTiles(socket.id, data.tiles);

    if (result.success) {
      // Send updated state to each player (with appropriate rack visibility)
      for (const player of game.players) {
        this.io.to(player.id).emit('gameStateUpdate', game.getState(player.id));
      }
    } else {
      socket.emit('error', { message: result.error });
    }
  }

  /**
   * Handle word submission
   * @param {object} socket
   */
  async handleSubmitWord(socket) {
    const game = this.getGameForPlayer(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = await game.submitWord(socket.id);

    if (result.success) {
      // Broadcast updated game state
      this.io.to(game.gameId).emit('wordValidated', {
        valid: true,
        words: result.words,
        score: result.score,
        playerId: socket.id
      });

      // Send updated state to each player (with appropriate rack visibility)
      for (const player of game.players) {
        this.io.to(player.id).emit('gameStateUpdate', game.getState(player.id));
      }

      if (result.gameOver) {
        // Game over handled by Game class
      }
    } else {
      socket.emit('wordValidated', {
        valid: false,
        error: result.error
      });
    }
  }

  /**
   * Handle challenge
   * @param {object} socket
   */
  handleChallenge(socket) {
    const game = this.getGameForPlayer(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = game.handleChallenge(socket.id);

    // Broadcast challenge result
    this.io.to(game.gameId).emit('challengeResult', result);

    // Send updated state to each player (with appropriate rack visibility)
    for (const player of game.players) {
      this.io.to(player.id).emit('gameStateUpdate', game.getState(player.id));
    }
  }

  /**
   * Handle pass turn
   * @param {object} socket
   */
  handlePass(socket) {
    const game = this.getGameForPlayer(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    const result = game.passTurn(socket.id);

    if (result.success) {
      this.io.to(game.gameId).emit('playerPassed', {
        playerId: socket.id,
        playerName: game.getPlayer(socket.id).name
      });

      if (result.gameOver) {
        // Game over handled by Game class
      }
    } else {
      socket.emit('error', { message: result.error });
    }
  }

  /**
   * Handle player disconnect
   * @param {object} socket
   */
  handleDisconnect(socket) {
    const gameId = this.playerToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    console.log(`${player.name} (${socket.id}) disconnected from game ${gameId}`);

    // Notify other player
    socket.to(gameId).emit('playerDisconnected', {
      playerId: socket.id,
      playerName: player.name,
      message: `${player.name} has disconnected`
    });

    // Clean up game
    game.cleanup();

    // Remove game after delay (in case player reconnects)
    setTimeout(() => {
      this.games.delete(gameId);
      console.log(`Game ${gameId} removed`);
    }, 60000); // 1 minute

    // Remove player mapping
    this.playerToGame.delete(socket.id);
  }

  /**
   * Get game for a player
   * @param {string} socketId
   * @returns {Game|null}
   */
  getGameForPlayer(socketId) {
    const gameId = this.playerToGame.get(socketId);
    return gameId ? this.games.get(gameId) : null;
  }

  /**
   * Get number of active games
   * @returns {number}
   */
  getActiveGamesCount() {
    return this.games.size;
  }
}

module.exports = GameManager;
