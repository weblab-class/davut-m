const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

ITEMS = []
const INITIAL_RADIUS = 50;
const MAP_LENGTH =  800;
const generateRandom = (n) =>{
    let shuffled = ITEMS.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, n);
}

/** Helper to generate a random integer */
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  };
  
  /** Helper to generate a random position on the map */
  const getRandomPosition = () => {
    return {
      x: getRandomInt(0, MAP_LENGTH),
      y: getRandomInt(0, MAP_LENGTH),
    };
  };


const gameState = {
    winner: null,
    grids: new Array(5).fill(new Array(5).fill(null)),
    players: {},
}

const checkCollision = (circle1, circle2) => {
  const dx = circle1.position.x - circle2.position.x;
  const dy = circle1.position.y - circle2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
};

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

const spawnPlayer = (id) => {
    gameState.players[id] = {
      position: getRandomPosition(),
      radius: INITIAL_RADIUS,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  };


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

const updateGameState = () => {
  checkAllCollisions();
};

module.exports = {
    gameState,
    spawnPlayer,
    movePlayer,
    // removePlayer,
    updateGameState,
    // resetWinner,
    colors,
    getRandomInt,
    getRandomPosition,
  };