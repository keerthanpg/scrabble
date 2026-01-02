# Installation Guide for macOS

## Step 1: Install Homebrew (Package Manager)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. You may need to enter your password.

## Step 2: Install Node.js

After Homebrew is installed, run:

```bash
brew install node
```

## Step 3: Verify Installation

Check that Node.js is installed:

```bash
node --version
npm --version
```

You should see version numbers like:
```
v20.x.x
10.x.x
```

## Step 4: Install Project Dependencies

Navigate to the project directory (if not already there):

```bash
cd /Users/keerthanapg/Documents/chinniproject
```

Install dependencies:

```bash
npm install
```

This will install Express and Socket.io (takes ~30 seconds).

## Step 5: Start the Server

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

## Step 6: Test the Game

1. Open your browser to: `http://localhost:3000`
2. Open a second browser window (or incognito tab): `http://localhost:3000`

**In First Window:**
- Enter your name
- Click "Create Game"
- Copy the Game ID (e.g., "A3F5D2")

**In Second Window:**
- Enter the Game ID
- Enter your name
- Click "Join Game"

Game starts automatically!

---

## Alternative: Download Node.js Installer

If you prefer not to use Homebrew:

1. Go to: https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Follow steps 3-6 above

---

## Troubleshooting

**"command not found" after installing Homebrew:**
- Close and reopen Terminal
- Or run: `source ~/.zshrc`

**Permission errors during npm install:**
- Don't use `sudo npm install`
- Check your npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

**Port 3000 already in use:**
- Stop other servers running on port 3000
- Or change port: `PORT=3001 npm start`
