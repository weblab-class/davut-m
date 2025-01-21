import React, { useContext, useState } from "react";
import { googleLogout } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom"; 

import "../../utilities.css";
import "./Menu.css";

import { UserContext } from "../App";
import { socket } from "../../client-socket";

const Menu = () => {
  const { userId, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [roomPasscode, setRoomPasscode] = useState("");
  const [error, setError] = useState("");

  const handleLogoutClick = () => {
    googleLogout();
    handleLogout();
    navigate("/");
  };

  const handleCreateRoomClick = () => {
    // Generate a random 6-digit passcode
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    socket.emit("create-room", { userId, passcode }, (response) => {
      if (response.success) {
        alert(`Your room passcode is: ${passcode}\nShare this with others to let them join!`);
        navigate(`/game/${response.roomId}`);
      } else {
        setError("Failed to create room. Please try again.");
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    socket.emit("join-room", { userId, passcode: roomPasscode }, (response) => {
      if (response.success) {
        setShowJoinDialog(false);
        navigate(`/game/${response.roomId}`);
      } else {
        setError("Invalid passcode. Please try again.");
      }
    });
  };

  return (
    <>
      <div className="container">
        <div className="avatar">
          <button onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
        
        <div className="menu">
          <button className="btn create-room" onClick={handleCreateRoomClick}>Create Room</button>
          <button className="btn enter-key" onClick={() => setShowJoinDialog(true)}>Join with Passcode</button>
          <button className="btn train-mode">Train Mode</button>
        </div>

        {showJoinDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h2>Enter Room Passcode</h2>
              {error && <p className="error">{error}</p>}
              <form onSubmit={handleJoinRoom}>
                <input
                  type="text"
                  value={roomPasscode}
                  onChange={(e) => setRoomPasscode(e.target.value)}
                  placeholder="Enter 6-digit passcode"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
                <div className="dialog-buttons">
                  <button type="submit">Join</button>
                  <button type="button" onClick={() => {
                    setShowJoinDialog(false);
                    setError("");
                    setRoomPasscode("");
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="help">
          <span className="help-icon">?</span>
        </div>
      </div>
    </>
  );
};

export default Menu;