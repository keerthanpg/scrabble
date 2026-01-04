const fs = require('fs').promises;
const path = require('path');

class RatingManager {
  constructor(ratingsFilePath) {
    this.ratingsFilePath = ratingsFilePath;
    this.ratings = new Map();
    this.loadRatings();
  }

  async loadRatings() {
    try {
      const data = await fs.readFile(this.ratingsFilePath, 'utf8');
      const ratingsObj = JSON.parse(data);
      this.ratings = new Map(Object.entries(ratingsObj));
      console.log(`Loaded ${this.ratings.size} player ratings`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Ratings file not found, starting fresh');
        this.ratings = new Map();
        await this.saveRatings();
      } else {
        console.error('Error loading ratings:', error);
        this.ratings = new Map();
      }
    }
  }

  async saveRatings() {
    try {
      const ratingsObj = Object.fromEntries(this.ratings);
      const dir = path.dirname(this.ratingsFilePath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(
        this.ratingsFilePath,
        JSON.stringify(ratingsObj, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving ratings:', error);
    }
  }

  getRating(socketId) {
    const playerData = this.ratings.get(socketId);
    if (!playerData) {
      // New player starts with default rating
      return {
        rating: 1000,
        gamesPlayed: 0,
        wins: 0,
        losses: 0
      };
    }
    return playerData;
  }

  calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  getKFactor(gamesPlayed) {
    // New players have higher K-factor for faster rating adjustment
    return gamesPlayed < 30 ? 32 : 24;
  }

  async updateRatings(winnerId, loserId) {
    try {
      const winner = this.getRating(winnerId);
      const loser = this.getRating(loserId);

      // Calculate expected scores
      const winnerExpected = this.calculateExpectedScore(winner.rating, loser.rating);
      const loserExpected = this.calculateExpectedScore(loser.rating, winner.rating);

      // Get K-factors
      const winnerK = this.getKFactor(winner.gamesPlayed);
      const loserK = this.getKFactor(loser.gamesPlayed);

      // Calculate new ratings
      // Winner gets 1 point, loser gets 0
      const winnerNewRating = Math.round(winner.rating + winnerK * (1 - winnerExpected));
      const loserNewRating = Math.round(loser.rating + loserK * (0 - loserExpected));

      // Update winner data
      const winnerData = {
        rating: winnerNewRating,
        gamesPlayed: winner.gamesPlayed + 1,
        wins: winner.wins + 1,
        losses: winner.losses
      };

      // Update loser data
      const loserData = {
        rating: loserNewRating,
        gamesPlayed: loser.gamesPlayed + 1,
        wins: loser.wins,
        losses: loser.losses + 1
      };

      // Store updated ratings
      this.ratings.set(winnerId, winnerData);
      this.ratings.set(loserId, loserData);

      // Persist to file
      await this.saveRatings();

      const ratingChange = {
        winner: {
          oldRating: winner.rating,
          newRating: winnerNewRating,
          change: winnerNewRating - winner.rating
        },
        loser: {
          oldRating: loser.rating,
          newRating: loserNewRating,
          change: loserNewRating - loser.rating
        }
      };

      console.log(`Rating updated - Winner: ${winner.rating} → ${winnerNewRating} (+${ratingChange.winner.change}), Loser: ${loser.rating} → ${loserNewRating} (${ratingChange.loser.change})`);

      return ratingChange;
    } catch (error) {
      console.error('Error updating ratings:', error);
      return null;
    }
  }

  getTopPlayers(limit = 10) {
    // Convert map to array and filter out players with no games
    const players = Array.from(this.ratings.entries())
      .map(([id, data]) => ({
        id,
        ...data
      }))
      .filter(player => player.gamesPlayed > 0);

    // Sort by rating (descending), then by wins
    players.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.wins - a.wins;
    });

    // Return top N players
    return players.slice(0, limit);
  }
}

module.exports = RatingManager;
