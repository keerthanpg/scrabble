const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const GameManager = require('./game/GameManager');
const WordValidator = require('./game/WordValidator');
const RatingManager = require('./rating/RatingManager');
const MatchmakingQueue = require('./matchmaking/MatchmakingQueue');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve dictionary
app.use('/dictionary', express.static(path.join(__dirname, '../public/dictionary')));

// Initialize word validator
const wordValidator = new WordValidator();
const dictionaryPath = path.join(__dirname, '../public/dictionary/words.txt');

// Load dictionary before starting server
wordValidator.loadDictionary(dictionaryPath)
  .then(() => {
    console.log('Dictionary loaded successfully');

    // Initialize rating manager
    const ratingsFilePath = path.join(__dirname, '../data/ratings.json');
    const ratingManager = new RatingManager(ratingsFilePath);

    // Initialize game manager with rating manager
    const gameManager = new GameManager(io, wordValidator, ratingManager);

    // Initialize matchmaking queue
    const matchmakingQueue = new MatchmakingQueue(gameManager, ratingManager);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      // Game lifecycle events
      socket.on('createGame', async (data) => {
        const { playerName } = data;
        await gameManager.createGame(socket, playerName);
      });

      socket.on('joinGame', async (data) => {
        const { gameId, playerName } = data;
        await gameManager.joinGame(socket, gameId, playerName);
      });

      // Gameplay events
      socket.on('placeTiles', (data) => {
        gameManager.handlePlaceTiles(socket, data);
      });

      socket.on('submitWord', () => {
        gameManager.handleSubmitWord(socket);
      });

      socket.on('challengeWord', () => {
        gameManager.handleChallenge(socket);
      });

      socket.on('passTurn', () => {
        gameManager.handlePass(socket);
      });

      // Matchmaking events
      socket.on('findMatch', (data) => {
        const { playerName } = data;
        const playerRating = ratingManager.getRating(socket.id);
        const result = matchmakingQueue.addToQueue(socket, playerName, playerRating.rating);

        if (result.success) {
          socket.emit('matchmakingStarted', {
            rating: playerRating.rating,
            gamesPlayed: playerRating.gamesPlayed,
            wins: playerRating.wins,
            losses: playerRating.losses
          });
          console.log(`${playerName} (${socket.id}) entered matchmaking queue with rating ${playerRating.rating}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      });

      socket.on('cancelMatch', () => {
        const removed = matchmakingQueue.removeFromQueue(socket.id);
        if (removed) {
          socket.emit('matchmakingCancelled');
          console.log(`Player ${socket.id} left matchmaking queue`);
        }
      });

      // Disconnection
      socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        // Remove from matchmaking queue if in it
        matchmakingQueue.removeFromQueue(socket.id);

        gameManager.handleDisconnect(socket);
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Scrabble Game Server Running         ║
╚════════════════════════════════════════╝

🎮 Server: http://localhost:${PORT}
📚 Dictionary: ${wordValidator.dictionary.size} words loaded
🎯 Ready for players!

Press Ctrl+C to stop the server.
      `);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    console.error('Failed to load dictionary:', error);
    process.exit(1);
  });
