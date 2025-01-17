import React, { useState, useEffect, useRef } from "react";
// import { socket } from "../../client-socket.js";
// import { get, post } from "../../utilities";
import { drawCanvas } from "../../canvasManager";
// import { handleInput } from "../../input";
// import { useOutletContext } from "react-router-dom";

import "../../utilities.css";
import "./Game.css";



const Game = () => {
    const canvasRef = useRef(null);
    return (
      <>
        <div>
          {/* important: canvas needs id to be referenced by canvasManager */}
          <canvas ref={canvasRef} width="500" height="500" />
          {/* {loginModal}
          {winnerModal}
          {spawnButton} */}
        </div>
      </>
    );
  };
  
  export default Game;
  
