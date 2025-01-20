import React, { useState, useEffect, useRef, useContext } from "react";
import { socket } from "../../client-socket.js";
import { get, post } from "../../utilities";
import { drawCanvas} from "../../canvasManager";
import { handleInput } from "../../input";
import { useOutletContext } from "react-router-dom";

import "../../utilities.css";
import "./Game.css";



const Game = () => {
    const props = useOutletContext();
    const [isSpawn, setIsSpawn] = useState(false);
    const canvasRef = useRef(null);

    // add event listener on mount
    useEffect(() => {
      window.addEventListener("keydown", handleInput);

      // remove event listener on unmount
      return () => {
        window.removeEventListener("keydown", handleInput);
        post("/api/despawn", { userid: props.userId });
      };
    }, []);

    // update game periodically
    useEffect(() => {
      socket.on("update", (update) => {
        processUpdate(update);
      });
      return () => {
        socket.off("update");
      }
    }, []);
    
    useEffect(() => {
      if (props.userId) {
        post("/api/spawn", { userid: props.userId });
        return () => {
          // Cleanup: despawn when component unmounts
          post("/api/despawn", { userid: props.userId });
        };
      }
    }, [props.userId]);

    const processUpdate = (update) => {
      // set winnerModal if update has defined winner
      // if (update.winner) {
      //   setWinnerModal(
      //     <div className="Game-winner">the winner is {update.winner} yay cool cool</div>
      //   );
      // } else {
      //   setWinnerModal(null);
      // }
      drawCanvas(update, canvasRef);
    };
    
    
  //   useEffect(() => {
  //     // Call drawCanvas whenever the component mounts
  //     drawCanvas({}, canvasRef);
  // }, []);

    return (
      <>
        <div>
          {/* important: canvas needs id to be referenced by canvasManager */}
          <canvas ref={canvasRef} width="800" height="800" />
          {/* {loginModal}
          {winnerModal}
          {spawnButton} */}
        </div>
      </>
    );
  };
  
  export default Game;
  
