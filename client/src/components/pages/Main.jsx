import React, { useContext, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import Menu from "./Menu";

import "../../utilities.css";
import "./Main.css";
import { UserContext } from "../App";

const Main = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);

  const handleLoginSuccess = (response) => {
    handleLogin(response);
    setShowMenu(true);
  };

  if (showMenu && userId) {
    return <Menu handleLogout={handleLogout} />;
  }

  return (
    <>
      <div className="container">
        <div className="avatar">
          {userId ? (
            <button
              onClick={() => {
                googleLogout();
                handleLogout();
                setShowMenu(false);
              }}
            >
              Logout
            </button>
          ) : (
            <GoogleLogin onSuccess={handleLoginSuccess} onError={(err) => console.log(err)} />
          )}
        </div>
      </div>
    </>
  );
};

export default Main;