class GameUI {
  constructor() {
    this.screens = {
      lobby: document.getElementById('lobby'),
      waiting: document.getElementById('waiting'),
      game: document.getElementById('game'),
      gameOver: document.getElementById('gameOver')
    };

    this.elements = {
      displayGameId: document.getElementById('displayGameId'),
      player1Name: document.getElementById('player1Name'),
      player1Score: document.getElementById('player1Score'),
      player2Name: document.getElementById('player2Name'),
      player2Score: document.getElementById('player2Score'),
      turnIndicator: document.getElementById('turnIndicator'),
      tilesRemaining: document.getElementById('tilesRemaining'),
      notification: document.getElementById('notification'),
      winnerDisplay: document.getElementById('winnerDisplay'),
      finalScores: document.getElementById('finalScores')
    };

    this.buttons = {
      submitWord: document.getElementById('submitWordBtn'),
      clearTiles: document.getElementById('clearTilesBtn'),
      pass: document.getElementById('passBtn')
    };
  }

  /**
   * Show a specific screen
   * @param {string} screenName
   */
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });

    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  /**
   * Show game ID in waiting screen
   * @param {string} gameId
   */
  showGameId(gameId) {
    this.elements.displayGameId.textContent = gameId;
  }

  /**
   * Update player information
   * @param {Array} players
   * @param {string} myPlayerId
   */
  updatePlayers(players, myPlayerId) {
    const me = players.find(p => p.id === myPlayerId);
    const opponent = players.find(p => p.id !== myPlayerId);

    if (me) {
      this.elements.player1Name.textContent = me.name + ' (You)';
      this.elements.player1Score.textContent = me.score;
    }

    if (opponent) {
      this.elements.player2Name.textContent = opponent.name;
      this.elements.player2Score.textContent = opponent.score;
    }
  }

  /**
   * Update turn indicator
   * @param {string} currentPlayerId
   * @param {string} currentPlayerName
   * @param {string} myPlayerId
   */
  updateTurnIndicator(currentPlayerId, currentPlayerName, myPlayerId) {
    const isMyTurn = currentPlayerId === myPlayerId;
    const indicator = this.elements.turnIndicator;

    if (isMyTurn) {
      indicator.textContent = 'Your Turn';
      indicator.className = 'turn-indicator your-turn';
    } else {
      indicator.textContent = `${currentPlayerName}'s Turn`;
      indicator.className = 'turn-indicator opponent-turn';
    }
  }

  /**
   * Update tiles remaining display
   * @param {number} count
   */
  updateTilesRemaining(count) {
    this.elements.tilesRemaining.textContent = `${count} tiles remaining`;
  }

  /**
   * Enable/disable controls based on turn
   * @param {boolean} isMyTurn
   * @param {boolean} hasPendingTiles
   */
  updateControls(isMyTurn, hasPendingTiles) {
    this.buttons.submitWord.disabled = !isMyTurn || !hasPendingTiles;
    this.buttons.clearTiles.disabled = !isMyTurn || !hasPendingTiles;
    this.buttons.pass.disabled = !isMyTurn;
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type - 'success', 'error', 'info'
   * @param {number} duration
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.elements.notification;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  }

  /**
   * Show game over screen
   * @param {object} winner
   * @param {Array} finalScores
   * @param {string} reason
   */
  showGameOver(winner, finalScores, reason) {
    let reasonText = '';
    if (reason === 'timeout') {
      reasonText = 'Time ran out';
    } else if (reason === 'tiles_exhausted') {
      reasonText = 'All tiles used';
    } else if (reason === 'both_passed') {
      reasonText = 'Both players passed';
    }

    this.elements.winnerDisplay.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
      <div style="font-size: 32px; font-weight: 700; color: #4CAF50;">${winner.name} Wins!</div>
      <div style="font-size: 18px; color: #666; margin-top: 10px;">${reasonText}</div>
    `;

    this.elements.finalScores.innerHTML = '';
    finalScores.forEach(player => {
      const scoreItem = document.createElement('div');
      scoreItem.className = 'score-item';
      scoreItem.innerHTML = `
        <span class="player">${player.name}</span>
        <span class="score">${player.score} points</span>
      `;
      this.elements.finalScores.appendChild(scoreItem);
    });

    this.showScreen('gameOver');
  }

  /**
   * Reset UI to initial state
   */
  reset() {
    this.showScreen('lobby');
    this.elements.displayGameId.textContent = '------';
    this.elements.player1Score.textContent = '0';
    this.elements.player2Score.textContent = '0';
    this.elements.turnIndicator.textContent = 'Waiting...';
    this.updateControls(false, false, false);
  }
}
