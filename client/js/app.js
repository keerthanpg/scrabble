// Initialize components
const socketManager = new SocketManager();
const gameUI = new GameUI();
const boardRenderer = new BoardRenderer(document.getElementById('board'));
const tileRack = new TileRack(document.getElementById('tileRack'));
const timerDisplay = new TimerDisplay();

let dragDropHandler = null;
let currentGameState = null;
let myPlayerId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupLobbyHandlers();
  setupSocketHandlers();
  setupGameControls();
});

/**
 * Setup lobby button handlers
 */
function setupLobbyHandlers() {
  // Find match
  document.getElementById('findMatchBtn').addEventListener('click', () => {
    const playerName = document.getElementById('findMatchPlayerName').value.trim();

    if (!playerName) {
      gameUI.showNotification('Please enter your name', 'error');
      return;
    }

    socketManager.findMatch(playerName);
  });

  // Cancel matchmaking
  document.getElementById('cancelMatchBtn').addEventListener('click', () => {
    socketManager.cancelMatch();
    gameUI.showScreen('lobby');
  });

  // Create game
  document.getElementById('createGameBtn').addEventListener('click', () => {
    const playerName = document.getElementById('createPlayerName').value.trim();

    if (!playerName) {
      gameUI.showNotification('Please enter your name', 'error');
      return;
    }

    socketManager.createGame(playerName);
  });

  // Join game
  document.getElementById('joinGameBtn').addEventListener('click', () => {
    const gameId = document.getElementById('joinGameId').value.trim().toUpperCase();
    const playerName = document.getElementById('joinPlayerName').value.trim();

    if (!gameId || !playerName) {
      gameUI.showNotification('Please enter game ID and your name', 'error');
      return;
    }

    socketManager.joinGame(gameId, playerName);
  });

  // New game button (from game over screen)
  document.getElementById('newGameBtn').addEventListener('click', () => {
    location.reload();
  });

  // View leaderboard button
  document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
    loadLeaderboard();
  });

  // Back to lobby button (from leaderboard)
  document.getElementById('backToLobbyBtn').addEventListener('click', () => {
    gameUI.showScreen('lobby');
  });
}

/**
 * Setup socket event handlers
 */
function setupSocketHandlers() {
  // Game created
  socketManager.on('gameCreated', (data) => {
    myPlayerId = data.playerId;
    gameUI.showGameId(data.gameId);
    gameUI.showScreen('waiting');
    gameUI.showNotification('Game created! Share the ID with your opponent.', 'success');
  });

  // Game joined
  socketManager.on('gameJoined', (data) => {
    myPlayerId = data.playerId;
    gameUI.showScreen('waiting');
    gameUI.showGameId(data.gameId);
    gameUI.showNotification('Joined game! Waiting for game to start...', 'success');
  });

  // Matchmaking started
  socketManager.on('matchmakingStarted', (data) => {
    gameUI.showMatchmaking(data.rating, data.gamesPlayed, data.wins, data.losses);
    gameUI.showNotification('Finding a match...', 'info');
  });

  // Match found
  socketManager.on('matchFound', (data) => {
    gameUI.showNotification(`Match found! Playing against ${data.opponent}`, 'success', 3000);
  });

  // Matchmaking cancelled
  socketManager.on('matchmakingCancelled', () => {
    gameUI.showScreen('lobby');
    gameUI.showNotification('Matchmaking cancelled', 'info');
  });

  // Game start
  socketManager.on('gameStart', (data) => {
    console.log('gameStart event received!', data);
    currentGameState = data.gameState;

    console.log('myPlayerId:', myPlayerId);
    console.log('Rendering board...');

    // Initialize board
    boardRenderer.render(currentGameState.board);

    console.log('Getting my player data...');
    // Get my player data
    const myPlayer = currentGameState.players.find(p => p.id === myPlayerId);
    console.log('myPlayer:', myPlayer);

    if (myPlayer) {
      console.log('Rendering tile rack with:', myPlayer.rack);
      tileRack.render(myPlayer.rack);
    }

    console.log('Initializing drag and drop...');
    // Initialize drag and drop
    dragDropHandler = new DragDropHandler(
      boardRenderer,
      tileRack,
      handleTilePlaced,
      handleTileReturned
    );

    console.log('Setting up timers...');
    // Setup timers - match with how updatePlayers assigns them
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    const opponent = currentGameState.players.find(p => p.id !== myPlayerId);

    if (me) {
      const myTimerElement = document.getElementById('player1Timer');
      timerDisplay.registerTimer(me.id, myTimerElement);
      timerDisplay.updateTimer(me.id, me.timeRemaining);
    }

    if (opponent) {
      const opponentTimerElement = document.getElementById('player2Timer');
      timerDisplay.registerTimer(opponent.id, opponentTimerElement);
      timerDisplay.updateTimer(opponent.id, opponent.timeRemaining);
    }

    console.log('Showing game screen...');
    // Update UI
    gameUI.showScreen('game');
    gameUI.updatePlayers(currentGameState.players, myPlayerId);
    gameUI.updateTilesRemaining(currentGameState.tilesRemaining);

    const currentPlayer = currentGameState.players.find(p => p.isActive);
    gameUI.updateTurnIndicator(currentPlayer.id, currentPlayer.name, myPlayerId);
    timerDisplay.setActivePlayer(currentPlayer.id);

    updateControls();

    gameUI.showNotification('Game started! Good luck!', 'success');
  });

  // Game state update
  socketManager.on('gameStateUpdate', (data) => {
    currentGameState = data;

    // Update board
    boardRenderer.render(currentGameState.board);

    // Update my rack
    const myPlayer = currentGameState.players.find(p => p.id === myPlayerId);
    if (myPlayer) {
      tileRack.render(myPlayer.rack);
    }

    // Update UI
    gameUI.updatePlayers(currentGameState.players, myPlayerId);
    gameUI.updateTilesRemaining(currentGameState.tilesRemaining);

    updateControls();
  });

  // Turn changed
  socketManager.on('turnChanged', (data) => {
    const currentPlayer = currentGameState.players.find(p => p.id === data.currentPlayerId);
    if (currentPlayer) {
      gameUI.updateTurnIndicator(data.currentPlayerId, currentPlayer.name, myPlayerId);
      timerDisplay.setActivePlayer(data.currentPlayerId);
    }

    updateControls();

    if (data.currentPlayerId === myPlayerId) {
      gameUI.showNotification("It's your turn!", 'info');
    }
  });

  // Timer update
  socketManager.on('timerUpdate', (data) => {
    timerDisplay.updateTimer(data.playerId, data.timeRemaining);
  });

  // Word validated
  socketManager.on('wordValidated', (data) => {
    if (data.valid) {
      const wordsStr = data.words.join(', ');
      gameUI.showNotification(`Valid! "${wordsStr}" scored ${data.score} points!`, 'success', 4000);

      // Clear pending tiles
      boardRenderer.clearPendingTiles();
    } else {
      gameUI.showNotification(`Invalid: ${data.error}`, 'error', 4000);
      boardRenderer.clearPendingTiles();

      // Restore rack
      const myPlayer = currentGameState.players.find(p => p.id === myPlayerId);
      if (myPlayer) {
        tileRack.render(myPlayer.rack);
      }
    }

    updateControls();
    updateProspectiveScore();
  });

  // Player passed
  socketManager.on('playerPassed', (data) => {
    const message = data.playerId === myPlayerId
      ? 'You passed your turn'
      : `${data.playerName} passed their turn`;
    gameUI.showNotification(message, 'info');
  });

  // Player disconnected
  socketManager.on('playerDisconnected', (data) => {
    gameUI.showNotification(`${data.playerName} disconnected. You win by default!`, 'info', 10000);
  });

  // Game over
  socketManager.on('gameOver', (data) => {
    gameUI.showGameOver(data.winner, data.finalScores, data.reason);
  });

  // Error
  socketManager.on('error', (data) => {
    gameUI.showNotification(data.message, 'error');
  });
}

/**
 * Setup game control button handlers
 */
function setupGameControls() {
  // Submit word
  document.getElementById('submitWordBtn').addEventListener('click', () => {
    const pendingTiles = boardRenderer.getPendingTiles();

    if (pendingTiles.length === 0) {
      gameUI.showNotification('No tiles placed', 'error');
      return;
    }

    // Send to server
    socketManager.placeTiles(pendingTiles);

    // Small delay then submit
    setTimeout(() => {
      socketManager.submitWord();
    }, 100);
  });

  // Clear tiles
  document.getElementById('clearTilesBtn').addEventListener('click', () => {
    // Get pending tiles
    const pendingTiles = boardRenderer.getPendingTiles();

    // Clear from board
    boardRenderer.clearPendingTiles();

    // Restore to rack
    const myPlayer = currentGameState.players.find(p => p.id === myPlayerId);
    if (myPlayer) {
      tileRack.render(myPlayer.rack);
    }

    updateControls();
    updateProspectiveScore();
    gameUI.showNotification('Tiles cleared', 'info');
  });

  // Pass turn
  document.getElementById('passBtn').addEventListener('click', () => {
    const confirmed = confirm('Are you sure you want to pass your turn?');

    if (confirmed) {
      socketManager.passTurn();
    }
  });
}

/**
 * Handle tile placed on board
 * @param {object} tile
 */
function handleTilePlaced(tile) {
  updateControls();
  updateProspectiveScore();
}

/**
 * Handle tile returned to rack
 * @param {object} tile
 */
function handleTileReturned(tile) {
  updateControls();
  updateProspectiveScore();
}

/**
 * Update control button states
 */
function updateControls() {
  if (!currentGameState) return;

  const isMyTurn = currentGameState.currentPlayerId === myPlayerId;
  const hasPendingTiles = boardRenderer.getPendingTiles().length > 0;

  gameUI.updateControls(isMyTurn, hasPendingTiles);

  // Enable/disable drag and drop
  if (dragDropHandler) {
    dragDropHandler.setEnabled(isMyTurn);
  }
}

/**
 * Update prospective score display
 */
function updateProspectiveScore() {
  const score = boardRenderer.calculateProspectiveScore();
  const scoreElement = document.getElementById('prospectiveScoreValue');
  const containerElement = document.getElementById('prospectiveScore');

  if (scoreElement) {
    scoreElement.textContent = score;
  }

  // Add visual emphasis when tiles are placed
  if (containerElement) {
    if (score > 0) {
      containerElement.classList.add('has-tiles');
    } else {
      containerElement.classList.remove('has-tiles');
    }
  }
}

/**
 * Load and display leaderboard
 */
async function loadLeaderboard() {
  try {
    gameUI.showScreen('leaderboard');
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--pug-brown);">Loading top pugs...</div>';

    const response = await fetch('/api/leaderboard?limit=10');
    const data = await response.json();

    if (!data.success || !data.players || data.players.length === 0) {
      leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--pug-brown); font-size: 18px;">No players yet. Be the first to play!</div>';
      return;
    }

    // Render leaderboard entries
    leaderboardList.innerHTML = data.players.map((player, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      const playerName = player.playerName || 'Unknown Player';

      return `
        <div class="leaderboard-entry ${rankClass}">
          <div class="leaderboard-rank">${rank}</div>
          <div class="leaderboard-player-id" title="Socket ID: ${player.id}">${playerName}</div>
          <div class="leaderboard-rating">${player.rating}</div>
          <div class="leaderboard-stats">
            <div class="leaderboard-wins-losses">${player.wins}W - ${player.losses}L</div>
            <div class="leaderboard-games">${player.gamesPlayed} games</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--pug-brown); font-size: 18px;">Failed to load leaderboard. Please try again.</div>';
  }
}
