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

      // Check if user is host and game state
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
      // Clear canvas on mount
      if (canvasRef.current && smallCanvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const smallCtx = smallCanvasRef.current.getContext("2d");
        smallCtx.clearRect(0, 0, smallCanvasRef.current.width, smallCanvasRef.current.height);
      }
      
      socket.on("update", (update) => {
        processUpdate(update);
        // Round to nearest second for display
        setTimeLeft(Math.round(update.timeLeft));
        setGameStarted(update.isGameStarted);
      });
      
      return () => {
        socket.off("update");
      }
    }, [canvasRef.current, smallCanvasRef.current]);
    
    useEffect(() => {
      if (props.userId) {
        return () => {
          // Cleanup: despawn when component unmounts
          post("/api/despawn", { userid: props.userId });
        };
      }
    }, [props.userId]);

    const processUpdate = (update) => {
      if (update) {
        drawCanvas(update, canvasRef);
        drawSmallCanvas(update, smallCanvasRef);
      } else {
        // Clear canvas when no update
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const smallCtx = smallCanvasRef.current.getContext("2d");
        smallCtx.clearRect(0, 0, smallCanvasRef.current.width, smallCanvasRef.current.height);
      }
    };
    
    
  //   useEffect(() => {
  //     // Call drawCanvas whenever the component mounts
  //     drawCanvas({}, canvasRef);
  // }, []);

    const handleStartGame = () => {
      if (!gameStarted && isHost) {
        // Spawn all players when game starts
        if (props.userId) {
          post("/api/spawn", { userid: props.userId });
        }
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