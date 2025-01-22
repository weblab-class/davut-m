import React, { useState, useEffect, useRef, useContext } from "react";
import { socket } from "../../client-socket.js";
import { get, post } from "../../utilities";
import { drawCanvas, drawSmallCanvas } from "../../canvasManager";
import { handleInput } from "../../input";
import { useOutletContext } from "react-router-dom";

import "../../utilities.css";
import "./Game.css";



const Game = () => {
    const props = useOutletContext();
    const [isSpawn, setIsSpawn] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const canvasRef = useRef(null);
    const smallCanvasRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState(60);

    // add event listener on mount
    useEffect(() => {
      window.addEventListener("keydown", handleInput);

      // Check if user is host
      get("/api/ishost").then((data) => {
        setIsHost(data.isHost);
      });

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
        setTimeLeft(Math.ceil(update.timeLeft)); // Round up to nearest second
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
      drawSmallCanvas(update, smallCanvasRef);
    };
    
    
  //   useEffect(() => {
  //     // Call drawCanvas whenever the component mounts
  //     drawCanvas({}, canvasRef);
  // }, []);

    const handleStartGame = () => {
      if (!gameStarted) {
          console.log('handleStartGame');
          post("/api/startgame").then(() => {
          setGameStarted(true);
        });
      }
    };

    return (
      <div className="Game-container">
        <div className="Game-timer">Time Left: {timeLeft}s</div>
        <div className="Game-canvasContainer">
          <canvas ref={canvasRef} width={800} height={800} />
          <canvas ref={smallCanvasRef} width={100} height={100} className="Game-smallCanvas" />
        </div>
        {!gameStarted && isHost && (
          <button className="Game-startButton" onClick={handleStartGame}>
            Start Game
          </button>
        )}
      </div>
    );
  };
  
  export default Game;