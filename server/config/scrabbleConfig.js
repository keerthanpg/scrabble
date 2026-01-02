// Scrabble game configuration
// Contains tile distribution, point values, board layout, and bonus squares

const BOARD_SIZE = 15;
const CENTER_SQUARE = [7, 7];

// Standard Scrabble tile distribution and point values
const TILE_DISTRIBUTION = {
  'A': { count: 9, points: 1 },
  'B': { count: 2, points: 3 },
  'C': { count: 2, points: 3 },
  'D': { count: 4, points: 2 },
  'E': { count: 12, points: 1 },
  'F': { count: 2, points: 4 },
  'G': { count: 3, points: 2 },
  'H': { count: 2, points: 4 },
  'I': { count: 9, points: 1 },
  'J': { count: 1, points: 8 },
  'K': { count: 1, points: 5 },
  'L': { count: 4, points: 1 },
  'M': { count: 2, points: 3 },
  'N': { count: 6, points: 1 },
  'O': { count: 8, points: 1 },
  'P': { count: 2, points: 3 },
  'Q': { count: 1, points: 10 },
  'R': { count: 6, points: 1 },
  'S': { count: 4, points: 1 },
  'T': { count: 6, points: 1 },
  'U': { count: 4, points: 1 },
  'V': { count: 2, points: 4 },
  'W': { count: 2, points: 4 },
  'X': { count: 1, points: 8 },
  'Y': { count: 2, points: 4 },
  'Z': { count: 1, points: 10 },
  '_': { count: 2, points: 0 } // Blank tiles
};

// Bonus squares layout
// TW = Triple Word, DW = Double Word, TL = Triple Letter, DL = Double Letter
const BONUS_SQUARES = {
  // Triple Word Score (red squares)
  '0,0': 'TW', '0,7': 'TW', '0,14': 'TW',
  '7,0': 'TW', '7,14': 'TW',
  '14,0': 'TW', '14,7': 'TW', '14,14': 'TW',

  // Double Word Score (pink squares)
  '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
  '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
  '7,7': 'DW', // Center square - double word score
  '10,4': 'DW', '11,3': 'DW', '12,2': 'DW', '13,1': 'DW',
  '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',

  // Triple Letter Score (dark blue squares)
  '1,5': 'TL', '1,9': 'TL',
  '5,1': 'TL', '5,5': 'TL', '5,9': 'TL', '5,13': 'TL',
  '9,1': 'TL', '9,5': 'TL', '9,9': 'TL', '9,13': 'TL',
  '13,5': 'TL', '13,9': 'TL',

  // Double Letter Score (light blue squares)
  '0,3': 'DL', '0,11': 'DL',
  '2,6': 'DL', '2,8': 'DL',
  '3,0': 'DL', '3,7': 'DL', '3,14': 'DL',
  '6,2': 'DL', '6,6': 'DL', '6,8': 'DL', '6,12': 'DL',
  '7,3': 'DL', '7,11': 'DL',
  '8,2': 'DL', '8,6': 'DL', '8,8': 'DL', '8,12': 'DL',
  '11,0': 'DL', '11,7': 'DL', '11,14': 'DL',
  '12,6': 'DL', '12,8': 'DL',
  '14,3': 'DL', '14,11': 'DL'
};

// Game timing configuration
const DEFAULT_TIMER_MS = 15 * 60 * 1000; // 15 minutes per player
const TIMER_UPDATE_INTERVAL_MS = 1000; // Update every second

// Scoring bonuses
const BINGO_BONUS = 50; // Bonus for using all 7 tiles

// Challenge penalty
const CHALLENGE_PENALTY = 5; // Points deducted for failed challenge

module.exports = {
  BOARD_SIZE,
  CENTER_SQUARE,
  TILE_DISTRIBUTION,
  BONUS_SQUARES,
  DEFAULT_TIMER_MS,
  TIMER_UPDATE_INTERVAL_MS,
  BINGO_BONUS,
  CHALLENGE_PENALTY
};
