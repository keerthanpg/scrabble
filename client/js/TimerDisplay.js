class TimerDisplay {
  constructor() {
    this.timers = new Map();
  }

  /**
   * Register a player timer
   * @param {string} playerId
   * @param {HTMLElement} element
   */
  registerTimer(playerId, element) {
    this.timers.set(playerId, {
      element: element,
      remaining: 0
    });
  }

  /**
   * Update timer display
   * @param {string} playerId
   * @param {number} timeRemaining - Milliseconds
   */
  updateTimer(playerId, timeRemaining) {
    const timer = this.timers.get(playerId);
    if (!timer) return;

    timer.remaining = timeRemaining;
    timer.element.textContent = this.formatTime(timeRemaining);

    // Add warning class if less than 1 minute
    if (timeRemaining < 60000) {
      timer.element.classList.add('warning');
    } else {
      timer.element.classList.remove('warning');
    }
  }

  /**
   * Format milliseconds to MM:SS
   * @param {number} milliseconds
   * @returns {string}
   */
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Highlight active player's timer
   * @param {string} activePlayerId
   */
  setActivePlayer(activePlayerId) {
    this.timers.forEach((timer, playerId) => {
      const playerInfo = timer.element.closest('.player-info');
      if (playerInfo) {
        if (playerId === activePlayerId) {
          playerInfo.classList.add('active');
        } else {
          playerInfo.classList.remove('active');
        }
      }
    });
  }
}
