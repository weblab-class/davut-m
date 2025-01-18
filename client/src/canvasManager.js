let canvas;




/** main draw */
export const drawCanvas = (drawState, canvasRef) => {
    // use canvas reference of canvas element to get reference to canvas object
    canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
  
    // clear the canvas to black
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
  