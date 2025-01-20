import { socket } from "./client-socket";

/** Callback function that calls correct movement from key */
export const handleInput = (e) => {
  if (e.key === "ArrowUp") {
    socket.emit("move", "up");
  } else if (e.key === "ArrowDown") {
    socket.emit("move", "down");
  } else if (e.key === "ArrowLeft") {
    socket.emit("move", "left");
  } else if (e.key === "ArrowRight") {
    socket.emit("move", "right");
  }
};