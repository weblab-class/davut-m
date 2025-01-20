import React, { useContext } from "react";
import { googleLogout } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom"; 

import "../../utilities.css";

import { UserContext } from "../App";

const Menu = () => {
  const { userId, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    googleLogout();
    handleLogout();
    navigate("/");
  };

  const handleCreateRoomClick = () => {
    navigate("/create/");
  }
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
        <button className="btn enter-key">Enter Room Key</button>
        <button className="btn join-room">Join a Room</button>
        <button className="btn train-mode">Train Mode</button>
      </div>

      <div className="help">
        <span className="help-icon">?</span>
      </div>
      </div>
    </>
  );
};

export default Menu;