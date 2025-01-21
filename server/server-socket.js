const gameLogic = require("./game-logic");

let io;

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

/** Start running game: game loop emits game states to all clients at 60 frames per second */
const startRunningGame = () => {
  let winResetTimer = 0;
  setInterval(() => {
    gameLogic.updateGameState();
    sendGameState();

    // // Reset game 5 seconds after someone wins.
    // if (gameLogic.gameState.winner != null) {
    //   winResetTimer += 1;
    // }
    // if (winResetTimer > 60 * 5) {
    //   winResetTimer = 0;
    //   gameLogic.resetWinner();
    // }
  }, 1000 / 60); // 60 frames per second
};

startRunningGame();

const addUserToGame = (user) => {
  console.log(`Adding user ${user._id} to game`);
  gameLogic.spawnPlayer(user._id);
};

// const removeUserFromGame = (user) => {
//   gameLogic.removePlayer(user._id);
// };

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

// const removeUser = (user, socket) => {
//   if (user) {
//     delete userToSocketMap[user._id];
//     removeUserFromGame(user); // Remove user from game if they disconnect
//   }
//   delete socketToUserMap[socket.id];
//   io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
// };

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
  // removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getAllConnectedUsers: getAllConnectedUsers,
  addUserToGame: addUserToGame,
  // removeUserFromGame: removeUserFromGame,
  getIo: () => io,
};