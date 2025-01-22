const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  gameStats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 }
  },
  lastActive: { type: Date, default: Date.now },
  currentRoom: { type: String, default: null }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Instance method to update game stats
UserSchema.methods.updateGameStats = async function(gameResult) {
  this.gameStats.gamesPlayed += 1;
  if (gameResult.won) {
    this.gameStats.wins += 1;
  }
  if (gameResult.score > this.gameStats.bestScore) {
    this.gameStats.bestScore = gameResult.score;
  }
  this.gameStats.totalScore += gameResult.score;
  this.lastActive = new Date();
  return this.save();
};

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
