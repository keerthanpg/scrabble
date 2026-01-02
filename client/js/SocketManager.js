class SocketManager {
  constructor() {
    this.socket = io();
    this.eventHandlers = new Map();
  }

  /**
   * Register an event handler
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    this.socket.on(event, handler);
    this.eventHandlers.set(event, handler);
  }

  /**
   * Remove an event handler
   * @param {string} event
   */
  off(event) {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      this.socket.off(event, handler);
      this.eventHandlers.delete(event);
    }
  }

  /**
   * Emit an event to server
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    this.socket.emit(event, data);
  }

  /**
   * Create a new game
   * @param {string} playerName
   */
  createGame(playerName) {
    this.emit('createGame', { playerName });
  }

  /**
   * Join an existing game
   * @param {string} gameId
   * @param {string} playerName
   */
  joinGame(gameId, playerName) {
    this.emit('joinGame', { gameId, playerName });
  }

  /**
   * Place tiles on the board
   * @param {Array} tiles
   */
  placeTiles(tiles) {
    this.emit('placeTiles', { tiles });
  }

  /**
   * Submit the current word
   */
  submitWord() {
    this.emit('submitWord');
  }

  /**
   * Challenge opponent's last word
   */
  challengeWord() {
    this.emit('challengeWord');
  }

  /**
   * Pass turn
   */
  passTurn() {
    this.emit('passTurn');
  }

  /**
   * Get socket ID
   * @returns {string}
   */
  getId() {
    return this.socket.id;
  }
}
