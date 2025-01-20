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
    <>
      <div className="container">
        <div className="avatar">
          {userId ? (<></>) : (
            <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
          )}
        </div>
      </div>
    </>
  );
};

export default Main;