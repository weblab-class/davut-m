const gameLogic = require("./game-logic");

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
  let winResetTimer = 0;
  await clearColor();
  
  // Wait for all reveals to complete before starting the game loop
  await round1Reveal();
  await clearGrids();
  await guessColor();
  
  setInterval(() => {
    gameLogic.updateGameState();
    sendGameState();
  }, 1000 / 60); // 60 frames per second
};

const startGame = () => {
  gameLogic.startGame();
  startRunningGame();
};

const addUserToGame = (user) => {
  console.log(`Adding user ${user._id} to game`);
  gameLogic.spawnPlayer(user._id);
};

const removeUserFromGame = (user) => {
  gameLogic.removePlayer(user._id);
};

const addUser = (user, socket) => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  userToSocketMap[user._id] = socket;
  socketToUserMap[socket.id] = user;
  io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
};

const removeUser = (user, socket) => {
  if (user) {
    delete userToSocketMap[user._id];
    removeUserFromGame(user); // Remove user from game if they disconnect
  }
  delete socketToUserMap[socket.id];
  io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
};

const createRoom = (userId, passcode) => {
  const roomId = Math.random().toString(36).substring(7);
  rooms.set(roomId, {
    passcode,
    players: new Set([userId]),
    host: userId,
  });
  return roomId;
};

const joinRoom = (userId, passcode) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.passcode === passcode) {
      room.players.add(userId);
      return { success: true, roomId };
    }
  }
  return { success: false };
};

const leaveRoom = (userId) => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.has(userId)) {
      room.players.delete(userId);
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

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      
      socket.on("disconnect", (reason) => {
        const user = getUserFromSocketID(socket.id);
        if (user) {
          const roomId = leaveRoom(user._id);
          if (roomId) {
            socket.leave(roomId);
            io.to(roomId).emit("player-left", { userId: user._id });
          }
        }
      });

      socket.on("create-room", ({ userId, passcode }, callback) => {
        try {
          const roomId = createRoom(userId, passcode);
          socket.join(roomId);
          callback({ success: true, roomId });
        } catch (error) {
          callback({ success: false, error: "Failed to create room" });
        }
      });

      socket.on("join-room", ({ userId, passcode }, callback) => {
        const result = joinRoom(userId, passcode);
        if (result.success) {
          socket.join(result.roomId);
          io.to(result.roomId).emit("player-joined", { userId });
        }
        callback(result);
      });

      socket.on("move", (dir) => {
        const user = getUserFromSocketID(socket.id);
        if (user) gameLogic.movePlayer(user._id, dir, 20);
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getAllConnectedUsers: getAllConnectedUsers,
  addUserToGame: addUserToGame,
  removeUserFromGame: removeUserFromGame,
  startGame: startGame,
  isUserHost: isUserHost,
  getIo: () => io,
};