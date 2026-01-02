# Scrabble Web Game

A two-player Scrabble game with real-time multiplayer, challenge system, and chess-style timer.

## Features

- Real-time two-player gameplay over local network
- Automatic word validation against SOWPODS dictionary (~178K words)
- Chess-style timer (15 minutes per player)
- Challenge system for disputed words
- Drag-and-drop tile placement
- Standard Scrabble rules and scoring
- Bonus squares (Double/Triple Letter/Word)
- 50-point bonus for using all 7 tiles (bingo)

## Requirements

- Node.js (v14 or higher)
- A modern web browser

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## How to Play

### Starting the Server

1. Start the server:
   ```bash
   npm start
   ```

2. For development with auto-restart:
   ```bash
   npm run dev
   ```

3. The server will start on `http://localhost:3000`

### Playing Over Local Network

1. Start the server on one computer
2. Find the server's local IP address:
   - **Mac/Linux**: Run `ifconfig | grep inet` and look for your local IP (e.g., 192.168.1.x)
   - **Windows**: Run `ipconfig` and look for IPv4 Address

3. Player 1: Open browser to `http://localhost:3000`
4. Player 2: Open browser to `http://<server-ip>:3000` (e.g., `http://192.168.1.10:3000`)

### Game Flow

1. **Create/Join Game**
   - Player 1 creates a game and receives a 6-character Game ID
   - Player 1 shares the Game ID with Player 2
   - Player 2 enters the Game ID to join

2. **Gameplay**
   - Drag tiles from your rack to the board
   - First word must cover the center star
   - All words must connect to existing tiles
   - Click "Submit Word" to play your word
   - Timer counts down only during your turn

3. **Controls**
   - **Submit Word**: Validate and play your word
   - **Clear**: Remove all pending tiles and return to rack
   - **Challenge**: Challenge opponent's last word
   - **Pass**: Skip your turn

4. **Challenges**
   - Challenge opponent immediately after their move
   - If word is invalid: Opponent loses points and turn
   - If word is valid: You lose 5 points

5. **Game End**
   - When a player's timer runs out (opponent wins)
   - When all tiles are used and a player empties their rack
   - When both players pass twice in a row

## Scoring

- Letters have point values (A=1, Q=10, etc.)
- Double/Triple Letter Score (DL/TL) multiplies letter value
- Double/Triple Word Score (DW/TW) multiplies entire word value
- Using all 7 tiles in one turn: +50 points (bingo)
- At game end, remaining tile values are deducted from score

## Configuration

You can modify game settings in `server/config/scrabbleConfig.js`:
- `DEFAULT_TIMER_MS`: Change timer duration (default: 15 minutes)
- `BINGO_BONUS`: Change bingo bonus points
- `CHALLENGE_PENALTY`: Change challenge failure penalty

## Project Structure

```
scrabble-game/
├── server/          # Backend game logic
│   ├── index.js     # Express + Socket.io server
│   ├── game/        # Game classes
│   └── config/      # Game configuration
├── client/          # Frontend UI
│   ├── index.html   # Main page
│   ├── css/         # Stylesheets
│   └── js/          # Client-side logic
└── public/
    └── dictionary/  # Word dictionary
```

## Troubleshooting

**Can't connect over network?**
- Ensure both devices are on the same network
- Check firewall settings allow port 3000
- Verify the server IP address is correct

**Word not validating?**
- Check that all words formed (including cross words) are valid
- Ensure tiles are contiguous with no gaps
- First word must cover the center star
- Subsequent words must connect to existing tiles

**Timer seems off?**
- Timer updates every second from server
- Only active player's timer counts down
- Timer pauses during challenges

## Technical Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Dictionary**: SOWPODS (178,690 words)

## License

MIT
