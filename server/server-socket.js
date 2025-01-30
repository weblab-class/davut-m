const gameLogic = require("./game-logic");
const User = require("./models/user");
const Message = require("./models/message");

let io;
let gameInterval = null;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object
const rooms = new Map(); // maps roomId to { passcode, players: Set }

const getAllConnectedUsers = () => Object.values(socketToUserMap);
const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.sockets.get(socketid);

/** Send game state to client */
const sendGameState = () => {
  io.emit("update", gameLogic.gameState);
};

const updateGrids = (colorReveals) => {
  gameLogic.gameState.grids = colorReveals;
}

const round_reveal = (colorReveals) => {
  return new Promise((resolve) => {
    gameLogic.gameState.grids = colorReveals;
    gameLogic.updateGameState();
    sendGameState();
    
    // After 5 seconds, resolve the promise
    setTimeout(() => {
      resolve();
    }, 5000);
  });
};

// const justAwait = () => new Promise((resolve) => {setTimeout(resolve, 5000)
//   gameLogic.correctColor(3);
// });

const guessColor = ()=>{
  gameLogic.correctColor(3);
}
const round1Reveal = async () => {
  const gridAssignments = gameLogic.distributeGrids(3);
  console.log(gridAssignments);
  
  // Reveal each round sequentially
  await round_reveal(gridAssignments['1']);
  await round_reveal(gridAssignments['2']);
  await round_reveal(gridAssignments['3']);
  
  console.log('finished round 1 reveals');
  return Promise.resolve();
};

const clearGrids = () => {
  // gameLogic.gameState.grids_copy = Object.assign({}, gameLogic.gameState.grids);
  gameLogic.gameState.grids = {};
}
/** Start running game: game loop emits game states to all clients at 60 frames per second */
const startRunningGame = async () => {
  // Start the game first - this initializes the timer and game state
  gameLogic.startGame();
  
  // Clear any existing colors
  await clearColor();
  
  // Start the game loop immediately to show players
  const gameLoop = setInterval(() => {
    gameLogic.updateGameState();
    sendGameState();
  }, 1000 / 60); // 60 frames per second
  
  // Do the reveals while game is running - players stay visible during this
  await round1Reveal();
  
  // Clear the grid after reveals but keep players visible
  await clearGrids();
  
  // Set the color players need to find
  await guessColor();
};

const startGame = () => {
  // Get all players in the room and spawn them
  const room = Array.from(rooms.values())[0]; // Since we only have one room at a time
  if (room) {
    room.players.forEach(playerId => {
      gameLogic.spawnPlayer(playerId);
    });
  }
  gameLogic.startGame();
  startRunningGame();
};

const addUserToGame = (user) => {
  console.log(`Adding user ${user._id} to game`);
  gameLogic.spawnPlayer(user._id);
};

const removeUserFromGame = (user) => {
  if (!user) return;
  try {
    if (gameLogic.gameState.players && gameLogic.gameState.players[user._id]) {
      gameLogic.removePlayer(user._id);
    }
  } catch (error) {
    console.log("Error removing user from game:", error);
  }
};

const addUser = async (user, socket) => {
  if (!socket) {
    console.log("No socket provided for user", user._id);
    return;
  }

  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  // Update user's last active timestamp
  await User.findByIdAndUpdate(user._id, { 
    lastActive: new Date(),
    currentRoom: null // Reset room on new connection
  });

  userToSocketMap[user._id] = socket;
  socketToUserMap[socket.id] = user;
  io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
};

const removeUser = async (user, socket) => {
  if (user) {
    delete userToSocketMap[user._id];
    removeUserFromGame(user); // Remove user from game if they disconnect
    
    // Update user's status in database
    await User.findByIdAndUpdate(user._id, { 
      currentRoom: null,
      lastActive: new Date()
    });
  }
  delete socketToUserMap[socket.id];
  io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
};

const createRoom = async (userId, passcode) => {
  const roomId = Math.random().toString(36).substring(7);
  rooms.set(roomId, {
    passcode,
    players: new Set([userId]),
    host: userId,
  });
  
  // Update user's current room in database
  const user = await User.findById(userId);
  await User.findByIdAndUpdate(userId, { currentRoom: roomId });
  
  // Create a system message about the new room
  const systemMessage = new Message({
    sender: {
      _id: "system",
      name: "🎮 Game System",
    },
    recipient: {
      _id: "global",
      name: "Global Chat",
    },
    content: `${user.name} created a new room! Join with passcode: ${passcode}`,
  });

  await systemMessage.save();
  if (io) {
    io.emit("message", systemMessage);
  }
  
  return roomId;
};

const joinRoom = async (userId, passcode) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.passcode === passcode) {
      room.players.add(userId);
      // Update user's current room in database
      await User.findByIdAndUpdate(userId, { currentRoom: roomId });
      return { success: true, roomId };
    }
  }
  return { success: false };
};

const leaveRoom = async (userId) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.has(userId)) {
      room.players.delete(userId);
      // Update user's status in database
      await User.findByIdAndUpdate(userId, { currentRoom: null });
      
      // Clean up empty rooms
      if (room.players.size === 0) {
        rooms.delete(roomId);
      }
      return roomId;
    }
  }
};

const clearColor = () => {
  gameLogic.gameState.grids = {};
  gameLogic.gameState.correctColor = null;
}
const isUserHost = (userId) => {
  // Check all rooms to see if user is a host in any of them
  for (const [roomId, room] of rooms.entries()) {
    if (room.host === userId) {
      return true;
    }
  }
  return false;
};

const init = (http) => {
  io = require("socket.io")(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      const user = getUserFromSocketID(socket.id);
      removeUser(user, socket);
    });

    socket.on("create-room", async ({ userId, passcode }, callback) => {
      try {
        const roomId = await createRoom(userId, passcode);
        socket.join(roomId);
        callback({ success: true, roomId });
      } catch (error) {
        callback({ success: false, error: "Failed to create room" });
      }
    });

    socket.on("join-room", async ({ userId, passcode }, callback) => {
      const result = await joinRoom(userId, passcode);
      if (result.success) {
        socket.join(result.roomId);
        io.to(result.roomId).emit("player-joined", { userId });
      }
      callback(result);
    });

    socket.on("game-end", async (gameResult) => {
      const user = getUserFromSocketID(socket.id);
      if (user) {
        try {
          const dbUser = await User.findById(user._id);
          await dbUser.updateGameStats(gameResult);
        } catch (error) {
          console.error("Failed to update game stats:", error);
        }
      }
    });

    socket.on("move", (dir) => {
      const user = getUserFromSocketID(socket.id);
      if (user) gameLogic.movePlayer(user._id, dir, 20);
    });
  });

  return io;
};

module.exports = {
  init,
  addUser,
  removeUser,

  getSocketFromUserID,
  getUserFromSocketID,
  getSocketFromSocketID,
  getAllConnectedUsers,
  addUserToGame,
  removeUserFromGame,
  startGame,
  isUserHost,
  getIo: () => io,
};