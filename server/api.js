/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");
const Message = require("./models/message");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});


router.get("/user", (req, res) => {
  User.findById(req.query.userid).then((user) => {
    res.send(user);
  }).catch((err) => {
    res.status(500).send('User Not');
  });
});


router.post("/initsocket", (req, res) => {
  if (req.user) {
    const socket = socketManager.getSocketFromSocketID(req.body.socketid);
    if (socket) {
      socketManager.addUser(req.user, socket);
    }
  }
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// Message routes
router.get("/messages", (req, res) => {
  Message.find({}).then((messages) => {
    res.send(messages);
  });
});

router.post("/message", auth.ensureLoggedIn, (req, res) => {
  const newMessage = new Message({
    sender: {
      _id: req.user._id,
      name: req.user.name,
    },
    recipient: req.body.recipient,
    content: req.body.content,
  });

  newMessage.save().then((message) => {
    const io = socketManager.getIo();
    if (io) {
      io.emit("message", message);
    }
    res.send(message);
  });
});

// anything else falls to this "not found" case

router.get("/activeUsers", (req, res) => {
  res.send({ activeUsers: socketManager.getAllConnectedUsers() });
});

router.post("/spawn", (req, res) => {
  if (req.user) {
    console.log('spaaawn')
    socketManager.addUserToGame(req.user);
  }
  res.send({});
});

router.post("/despawn", (req, res) => {
  if (req.user) {
    socketManager.removeUserFromGame(req.user);
  }
  res.send({});
});

  /**
   * POST /api/startgame
   * Starts the game if the user is logged in.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
router.post("/startgame", (req, res) => {
  if (req.user) {
    socketManager.startGame();
  }
  res.send({});
});

router.get("/ishost", (req, res) => {
  if (req.user) {
    const isHost = socketManager.isUserHost(req.user._id);
    res.send({ isHost });
  } else {
    res.send({ isHost: false });
  }
});

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;