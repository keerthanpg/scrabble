const { BINGO_BONUS } = require('../config/scrabbleConfig');

class ScoreCalculator {
  /**
   * Calculate total score for formed words
   * @param {Array} words - Array of word objects from Board.getFormedWords()
   * @param {Board} board - Board instance for bonus lookup
   * @returns {number} - Total score
   */
  calculateScore(words, board) {
    let totalScore = 0;
    let newTilesUsed = 0;

    for (const wordObj of words) {
      let wordScore = 0;
      let wordMultiplier = 1;

      for (const tile of wordObj.tiles) {
        let letterScore = tile.points;

        // Apply bonuses only for newly placed tiles
        if (tile.isNew) {
          newTilesUsed++;
          const bonus = board.getBonus(tile.row, tile.col);

          if (bonus === 'DL') {
            // Double Letter Score
            letterScore *= 2;
          } else if (bonus === 'TL') {
            // Triple Letter Score
            letterScore *= 3;
          } else if (bonus === 'DW') {
            // Double Word Score
            wordMultiplier *= 2;
          } else if (bonus === 'TW') {
            // Triple Word Score
            wordMultiplier *= 3;
          }
        }

        wordScore += letterScore;
      }

      totalScore += wordScore * wordMultiplier;
    }

    // Bingo bonus: using all 7 tiles in one turn
    if (newTilesUsed === 7) {
      totalScore += BINGO_BONUS;
    }

    return totalScore;
  }
}

module.exports = ScoreCalculator;
