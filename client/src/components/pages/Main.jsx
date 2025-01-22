import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { Navigate } from "react-router-dom";

import "../../utilities.css";
import "./Main.css";
import { UserContext } from "../App";

const Main = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  if (userId) {
    return <Navigate to="/menu/" replace />;
  }

  return (
    <div className="main-container">
      <div className="cyber-grid"></div>
      <div className="particles"></div>
      <div className="cyber-circles">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
      <div className="content-wrapper">
        <div className="game-title">
          <div className="title-glow">
            <div className="glitch-wrapper">
              <h1 data-text="MemoRun">MemoRun</h1>
            </div>
          </div>
          <p className="subtitle">Race against friends in this multiplayer adventure!</p>
        </div>
        
        <div className="login-section">
          <div className="login-card">
            <div className="card-header">
              <div className="cyber-line"></div>
              <h2>Ready to Play?</h2>
              <div className="cyber-line"></div>
            </div>
            <p>Sign in with Google to start your journey</p>
            <div className="login-button">
              <div className="button-wrapper">
                <GoogleLogin 
                  onSuccess={handleLogin} 
                  onError={(err) => console.log(err)}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signin_with"
                  useOneTap
                />
              </div>
            </div>
          </div>
        </div>

        <div className="features">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🏃</span>
            </div>
            <h3>Multiplayer Racing</h3>
            <p>Compete in real-time</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🔒</span>
            </div>
            <h3>Private Rooms</h3>
            <p>Play with friends</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🎮</span>
            </div>
            <h3>Easy Controls</h3>
            <p>Jump right in</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;