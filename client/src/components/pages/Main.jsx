import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Main.css";
import { UserContext } from "../App";

const Main = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
  return (
    <>
      <div className="container">
      {/* <div className="avatar">U</div> */}
      <div className="avatar">{userId ? (
        <button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        >
          Logout
        </button>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      )}</div>
      
      <div className="menu">
      <button className="btn create-room">Create Room</button>
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

export default Main;


// <>
//       <div className="container">
//       {/* <div className="avatar">U</div> */}
//       <div className="avatar">{userId ? (
//         <button
//           onClick={() => {
//             googleLogout();
//             handleLogout();
//           }}
//         >
//           Logout
//         </button>
//       ) : (
//         <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
//       )}</div>
      
//       <div className="menu">
//       <button className="btn create-room">Create Room</button>
//       <button className="btn enter-key">Enter Room Key</button>
//       <button className="btn join-room">Join a Room</button>
//       <button className="btn train-mode">Train Mode</button>
//     </div>

//     <div className="help">
//       <span className="help-icon">?</span>
//     </div>
//     </div>
//     </>