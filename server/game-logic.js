const colors = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#800000", "#808000", "#008000", "#800080", "#808080", "#008080",
  "#C0C0C0", "#FF4500", "#FFD700", "#ADFF2F", "#32CD32", "#00FA9A",
  "#20B2AA", "#4682B4", "#4169E1", "#4B0082", "#8A2BE2", "#FF1493",
  "#DC143C", '#16213e',
];

// List of items
ITEMS = []
const INITIAL_RADIUS = 50;
const MAP_LENGTH =  800;

// Divide an object into 3 groups
function divideIntoGroups(obj) {
  const keys = Object.keys(obj);
  
  // Shuffle the keys randomly
  for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  // Initialize the groups
  const groups = { '1': {}, '2': {}, '3': {} };
  
  // Distribute keys into groups
  keys.forEach((key, index) => {
      const groupNum = (index % 3) + 1;
      groups[groupNum][key] = obj[key];
  });

  return groups;
}

// Distribute grids across n groups
const distributeGrids = (n) => {
  let grids = Array.from({ length: 25 }, (_, i) => i); // Grids labeled from 0 to 24

  // Fisher-Yates shuffle for better randomization
  for (let i = grids.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [grids[i], grids[j]] = [grids[j], grids[i]];
  }

  let gridAssignments = {};
  
  // Even distribution of grids across n groups
  let groupCounts = Array(n).fill(0);
  let targetCount = Math.floor(25 / n);
  let extra = 25 % n; // Some groups will have one extra grid

  grids.forEach((grid) => {
      let minGroup = groupCounts.findIndex(count => count < targetCount + (extra > 0 ? 1 : 0));
      gridAssignments[grid] = colors[minGroup];
      groupCounts[minGroup]++;
      if (groupCounts[minGroup] > targetCount) extra--; // Reduce extra allocation once assigned
  });
  gameState.grids_copy = Object.assign({}, gridAssignments); // Save the original gridAssignments;
  return divideIntoGroups(gridAssignments);
};

// Helper to generate a random integer
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };
  
  // Helper to generate a random position on the map
  const getRandomPosition = () => {
    return {
      x: getRandomInt(0, MAP_LENGTH),
      y: getRandomInt(0, MAP_LENGTH),
    };
  };

// Game state
const gameState = {
    winner: null,
    grids: {},
    players: {},
    isGameStarted: false,
    timeLeft: 60,
    correctColor: null,
    lastUpdateTime: null,
}

// Check collision between two circles
const checkCollision = (circle1, circle2) => {
  const dx = circle1.position.x - circle2.position.x;
  const dy = circle1.position.y - circle2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
};

// Handle collision between two players
const handleCollision = (player1, player2, pushForce = 12.5) => {
  // Calculate direction vector from player1 to player2
  const dx = player2.position.x - player1.position.x;
  const dy = player2.position.y - player1.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize the direction vector
  const dirX = dx / distance;
  const dirY = dy / distance;
  
  // Apply push force to both players in opposite directions
  const halfForce = pushForce / 2; // Split the force between both players
  
  // Push player2 away from player1
  const newX2 = player2.position.x + dirX * halfForce;
  const newY2 = player2.position.y + dirY * halfForce;
  
  // Push player1 away from player2 (in opposite direction)
  const newX1 = player1.position.x - dirX * halfForce;
  const newY1 = player1.position.y - dirY * halfForce;
  
  // Keep both players within bounds
  player1.position.x = Math.max(0, Math.min(MAP_LENGTH, newX1));
  player1.position.y = Math.max(0, Math.min(MAP_LENGTH, newY1));
  player2.position.x = Math.max(0, Math.min(MAP_LENGTH, newX2));
  player2.position.y = Math.max(0, Math.min(MAP_LENGTH, newY2));
};

// Spawn a new player
const spawnPlayer = (id) => {
    gameState.players[id] = {
      position: getRandomPosition(),
      radius: INITIAL_RADIUS,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  };

// Move a player in a specified direction
const movePlayer = (id, dir, speed) => {
    // If player doesn't exist, don't move anything
    if (gameState.players[id] == undefined) {
      return;
    }
  
    // Initialize a desired position to move to
    const desiredPosition = {
      x: gameState.players[id].position.x,
      y: gameState.players[id].position.y,
    };
  
    // Calculate desired position
    if (dir === "up") {
      desiredPosition.y += speed;
    } else if (dir === "down") {
      desiredPosition.y -= speed;
    } else if (dir === "left") {
      desiredPosition.x -= speed;
    } else if (dir === "right") {
      desiredPosition.x += speed;
    }
  
    // Keep player in bounds
    if (desiredPosition.x > MAP_LENGTH) {
      desiredPosition.x = MAP_LENGTH;
    }
    if (desiredPosition.x < 0) {
      desiredPosition.x = 0;
    }
    if (desiredPosition.y > MAP_LENGTH) {
      desiredPosition.y = MAP_LENGTH;
    }
    if (desiredPosition.y < 0) {
      desiredPosition.y = 0;
    }
  
    // Move player
    gameState.players[id].position = desiredPosition;
};

// Check collisions between all pairs of players
const checkAllCollisions = () => {
  const playerIds = Object.keys(gameState.players);
  
  // Check collisions between all pairs of players
  for (let i = 0; i < playerIds.length; i++) {
    const player1 = gameState.players[playerIds[i]];
    
    for (let j = i + 1; j < playerIds.length; j++) {
      const player2 = gameState.players[playerIds[j]];
      
      if (checkCollision(player1, player2)) {
        handleCollision(player1, player2);
      }
    }
  }
};

// Reveal the correct color
const correctColor = (n) => {
  gameState.correctColor = colors[getRandomInt(0, n)];
};

// Get the cell number from a position
const getCellFromPosition = (x, y) => {
  // Canvas is divided into 5x5 grid, each cell is 100x100
  const cellSize = 800/5;
  const gridSize = 5;
  
  // Calculate row and column
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  
  // Convert to cell number (0-24)
  // Cell numbers go from left to right, top to bottom
  const cellNumber = row * gridSize + col;
  
  // Ensure the result is within valid range
  return Math.max(0, Math.min(24, cellNumber));
}

// Reveal the correct color at the end of the round
const roundEndReveal = () => {
  const new_grid = {};
  if (gameState.grids_copy) {
    for (const [key, value] of Object.entries(gameState.grids_copy)) {
      if (value !== gameState.correctColor) {
        new_grid[key] = '#16213e';
    } else {
        new_grid[key] = value;
    }
  }
  console.log(gameState);
  gameState.grids = new_grid;
}}

// Remove a player from the game
const removePlayer = (id) => {
  if (gameState.players[id] != undefined) {
    delete gameState.players[id];
  }
};

// Check if there is a winner
const checkWin = () => {
  if (!gameState.isGameStarted || !gameState.correctColor) return false;

  // Only check for winners if timer has reached 0
  if (gameState.timeLeft > 0) return false;

  const winners = [];
  const losers = [];
  
  // Check each player's position
  Object.entries(gameState.players).forEach(([playerId, player]) => {
    const cell = getCellFromPosition(player.position.x, player.position.y);
    if (cell !== null && gameState.grids_copy[cell] === gameState.correctColor) {
      winners.push(playerId);
    } else {
      losers.push(playerId);
    }
  });

  if (winners.length > 0) {
    gameState.winner = winners;
    // Remove losing players from display
    losers.forEach(loserId => {
      delete gameState.players[loserId];
    });
    gameState.isGameStarted = false;
    return true;
  }

  return false;
};

// Update the game state
const updateGameState = () => {
  if (!gameState.isGameStarted) return;

  checkAllCollisions();
  updateTimer();

  if (gameState.timeLeft <= 0 || checkWin()) {
    // Game has ended
    const winners = gameState.winner || [];
    io.emit("game-end", {
      winners: winners,
      message: winners.length > 0 ? `Winners: ${winners.join(", ")}` : "No winners!"
    });
    
    // Reset game state after brief delay
    setTimeout(() => {
      gameState.isGameStarted = false;
      gameState.players = {};
      gameState.grids = {};
      gameState.correctColor = null;
      gameState.winner = null;
      io.emit("return-to-menu");
    }, 3000);
  }
};

// Start the game
const startGame = () => {
  gameState.isGameStarted = true;
  gameState.timeLeft = 60;
  gameState.winner = null;
  gameState.correctColor = null;
  gameState.lastUpdateTime = Date.now(); // Add timestamp for tracking actual elapsed time
};

// Update the timer
const updateTimer = () => {
  if (gameState.timeLeft > 0) {
    const now = Date.now();
    if (!gameState.lastUpdateTime) {
      gameState.lastUpdateTime = now;
      return;
    }
    
    const elapsed = (now - gameState.lastUpdateTime) / 1000; // Convert to seconds
    gameState.timeLeft = Math.max(0, gameState.timeLeft - elapsed);
    gameState.lastUpdateTime = now;
  }
};

module.exports = {
    gameState,
    spawnPlayer,
    movePlayer,
    updateGameState,
    distributeGrids,
    roundEndReveal,
    correctColor,
    startGame,
    updateTimer,
    removePlayer,
    checkWin,
    colors,
    getRandomInt,
    getRandomPosition,
    getCellFromPosition
};