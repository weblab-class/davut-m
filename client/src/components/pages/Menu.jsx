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
    <div className="menu-container">
      <div className="menu-header">
        <h1>MemoRun</h1>
        <button className="logout-button" onClick={handleLogoutClick}>
          <span className="logout-icon">👤</span>
          Logout
        </button>
      </div>

      <div className="menu-content">
        <div className="menu-title">
          <h2>Game Menu</h2>
          <p>Choose your game mode</p>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn create-room" onClick={handleCreateRoomClick}>
            <span className="btn-icon">🎮</span>
            Create Room
          </button>
          <button className="menu-btn join-room" onClick={() => setShowJoinDialog(true)}>
            <span className="btn-icon">🔑</span>
            Join with Passcode
          </button>
          <button className="menu-btn train-mode">
            <span className="btn-icon">🎯</span>
            Training Mode
          </button>
        </div>

        {showJoinDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h2>Join Room</h2>
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
                  <button type="submit" className="btn-primary">Join Game</button>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowJoinDialog(false);
                      setError("");
                      setRoomPasscode("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="help-section">
          <button className="help-button">
            <span className="help-icon">?</span>
            <span className="help-text">Need Help?</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;