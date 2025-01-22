import React, { useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .help-section {
        margin-top: 20px;
        position: relative;
      }

      .help-tooltip-container {
        position: relative;
        display: inline-block;
      }

      .help-button {
        background: #4a90e2;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.3s;
      }

      .help-button:hover {
        background: #357abd;
      }

      .help-icon {
        font-size: 18px;
        font-weight: bold;
      }

      .help-text {
        font-size: 16px;
      }

      .help-tooltip {
        position: absolute;
        top: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: none;
        z-index: 1000;
        border: 1px solid #eee;
      }

      .help-tooltip h3 {
        margin: 0 0 10px 0;
        color: #333;
      }

      .help-tooltip p {
        margin: 8px 0;
        color: #666;
      }

      .help-tooltip ul {
        margin: 8px 0;
        padding-left: 20px;
        color: #666;
      }

      .help-tooltip li {
        margin: 5px 0;
      }

      .help-tooltip-container:hover .help-tooltip {
        display: block;
      }

      .help-tooltip::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 10px 10px;
        border-style: solid;
        border-color: transparent transparent white;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

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
          <div className="help-tooltip-container">
            <button className="help-button">
              <span className="help-icon">?</span>
              <span className="help-text">Need Help?</span>
            </button>
            <div className="help-tooltip">
              <h3>How to Play</h3>
              <p>Welcome to our multiplayer Memorun! Here's how to play:</p>
              <ul>
                <li>Create or join a room with your friends</li>
                <li>There is a colored 5x5 grid and we will reveal it partially 3 times</li>
                <li>One of the colors gets choosed and players try to find cell with that color</li>
                <li>And of course you can kick other players!</li>
              </ul>
              <p>Have fun! 🧠</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;