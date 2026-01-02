# Quick Start Guide

## Installation

### 1. Install Node.js

If you don't have Node.js installed:
- Download from: https://nodejs.org/
- Choose the LTS version
- Follow the installation instructions for your OS

### 2. Install Dependencies

Open a terminal in this directory and run:

```bash
npm install
```

This will install:
- `express` - Web server
- `socket.io` - Real-time communication
- `nodemon` - Development auto-restart (optional)

## Running the Game

### Start the Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   Scrabble Game Server Running         ║
╚════════════════════════════════════════╝

🎮 Server: http://localhost:3000
📚 Dictionary: 178690 words loaded
🎯 Ready for players!
```

### Play on Same Computer

1. Open two browser tabs/windows
2. Go to `http://localhost:3000` in both
3. Create a game in one, join in the other

### Play Over Local Network

#### Find Your IP Address:

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.10)

#### Connect:
- Player 1 (host): `http://localhost:3000`
- Player 2: `http://192.168.1.10:3000` (use actual IP)

## How to Play

1. **Player 1**: Click "Create Game" → Get a Game ID (e.g., "A3F5D2")
2. **Player 2**: Enter the Game ID and click "Join Game"
3. Game starts automatically when both players join!

### Your Turn
- Drag tiles from your rack to the board
- First word must cover the center star ★
- Words must connect to existing tiles
- Click "Submit Word" to play

### Scoring
- Letter values are shown on each tile
- Colored squares give bonuses:
  - Red (TW): Triple Word Score
  - Pink (DW): Double Word Score
  - Dark Blue (TL): Triple Letter Score
  - Light Blue (DL): Double Letter Score
- Use all 7 tiles in one turn: +50 point bonus!

### Challenge System
- Click "Challenge" right after opponent's move
- If word is invalid: They lose points and turn
- If word is valid: You lose 5 points

### Winning
- Highest score when:
  - A player's timer runs out
  - All tiles are used
  - Both players pass twice

## Tips

- Plan ahead! Your timer only counts down on your turn
- Look for high-value letters (Q, Z, X, J)
- Use bonus squares strategically
- Form multiple words in one move for more points

## Troubleshooting

**"npm: command not found"**
- Install Node.js first (see step 1)

**"Cannot connect to server"**
- Make sure server is running (`npm start`)
- Check firewall settings
- Verify IP address is correct

**"Word not accepted"**
- Check all words formed (including cross-words) are valid
- Ensure tiles are contiguous
- First move must cover center star
- Subsequent moves must connect to existing tiles

## Game Configuration

Edit `server/config/scrabbleConfig.js` to change:
- Timer duration (default: 15 minutes)
- Challenge penalty (default: 5 points)
- Bingo bonus (default: 50 points)

## Development Mode

For auto-restart on file changes:

```bash
npm run dev
```

Press `Ctrl+C` to stop the server.

## Project Structure

```
scrabble-game/
├── server/              # Backend
│   ├── index.js         # Main server
│   ├── game/            # Game logic classes
│   └── config/          # Configuration
├── client/              # Frontend
│   ├── index.html       # Main page
│   ├── css/             # Styles
│   └── js/              # Client logic
└── public/
    └── dictionary/      # SOWPODS word list
```

## Need Help?

Check the full README.md for more details!

Happy Scrabbling! 🎮
