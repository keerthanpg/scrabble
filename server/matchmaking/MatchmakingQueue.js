class MatchmakingQueue {
  constructor(gameManager, ratingManager) {
    this.gameManager = gameManager;
    this.ratingManager = ratingManager;
    this.queue = new Map();
    this.matchCheckInterval = null;

    // Start the match-checking interval
    this.startMatchmaking();
  }

  startMatchmaking() {
    // Check for matches every 2 seconds
    this.matchCheckInterval = setInterval(() => {
      this.checkForMatches();
    }, 2000);

    console.log('Matchmaking system started');
  }

  stopMatchmaking() {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
      console.log('Matchmaking system stopped');
    }
  }

  addToQueue(socket, playerName, rating) {
    if (this.queue.has(socket.id)) {
      return { success: false, message: 'Already in queue' };
    }

    const queueEntry = {
      socketId: socket.id,
      playerName,
      rating,
      joinedAt: Date.now(),
      socket
    };

    this.queue.set(socket.id, queueEntry);
    console.log(`Player ${playerName} (${socket.id}) added to queue with rating ${rating}. Queue size: ${this.queue.size}`);

    return { success: true };
  }

  removeFromQueue(socketId) {
    const removed = this.queue.delete(socketId);
    if (removed) {
      console.log(`Player ${socketId} removed from queue. Queue size: ${this.queue.size}`);
    }
    return removed;
  }

  getRatingRange(waitTime) {
    // Expand rating range based on how long player has been waiting
    const waitSeconds = waitTime / 1000;

    if (waitSeconds < 30) {
      return 150; // ±150 rating points for first 30 seconds
    } else if (waitSeconds < 60) {
      return 300; // ±300 rating points for 30-60 seconds
    } else {
      return Infinity; // Match with anyone after 60 seconds
    }
  }

  findMatch(player) {
    const now = Date.now();
    const waitTime = now - player.joinedAt;
    const ratingRange = this.getRatingRange(waitTime);

    let bestMatch = null;
    let smallestRatingDiff = Infinity;

    // Find the best match within rating range
    for (const [socketId, otherPlayer] of this.queue) {
      // Don't match with self
      if (socketId === player.socketId) {
        continue;
      }

      const ratingDiff = Math.abs(player.rating - otherPlayer.rating);

      // Check if within range
      if (ratingDiff <= ratingRange) {
        // Find closest rating match
        if (ratingDiff < smallestRatingDiff) {
          smallestRatingDiff = ratingDiff;
          bestMatch = otherPlayer;
        }
      }
    }

    return bestMatch;
  }

  async createMatchedGame(player1, player2) {
    try {
      // Remove both players from queue
      this.removeFromQueue(player1.socketId);
      this.removeFromQueue(player2.socketId);

      console.log(`Creating matched game: ${player1.playerName} (${player1.rating}) vs ${player2.playerName} (${player2.rating})`);

      // Create the game using GameManager
      const gameId = await this.gameManager.createMatchedGame(
        player1.socket,
        player1.playerName,
        player2.socket,
        player2.playerName
      );

      // Notify both players that match was found
      player1.socket.emit('matchFound', {
        opponent: player2.playerName,
        gameId
      });

      player2.socket.emit('matchFound', {
        opponent: player1.playerName,
        gameId
      });

      return gameId;
    } catch (error) {
      console.error('Error creating matched game:', error);

      // Re-add players to queue if game creation failed
      this.queue.set(player1.socketId, player1);
      this.queue.set(player2.socketId, player2);

      throw error;
    }
  }

  checkForMatches() {
    if (this.queue.size < 2) {
      return; // Need at least 2 players to match
    }

    const processed = new Set();

    for (const [socketId, player] of this.queue) {
      // Skip if already processed in this round
      if (processed.has(socketId)) {
        continue;
      }

      // Try to find a match for this player
      const match = this.findMatch(player);

      if (match) {
        // Mark both as processed
        processed.add(socketId);
        processed.add(match.socketId);

        // Create the game
        this.createMatchedGame(player, match).catch(error => {
          console.error('Failed to create matched game:', error);
        });
      }
    }
  }

  getQueueSize() {
    return this.queue.size;
  }

  isInQueue(socketId) {
    return this.queue.has(socketId);
  }
}

module.exports = MatchmakingQueue;
