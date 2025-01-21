let canvas;

// Helper function to convert index to grid coordinates
// const indexToGridCoord = (index) => {
//     return {
//         row: Math.floor(index / 5),
//         col: index % 5
//     };
// };

// // Helper function to generate random color
// const getRandomColor = () => {
//     const letters = '0123456789ABCDEF';
//     let color = '#';
//     for (let i = 0; i < 6; i++) {
//         color += letters[Math.floor(Math.random() * 16)];
//     }
//     return color;
// };

const convertCoord = (x, y) => {
  if (!canvas) return;
  return {
    drawX: x,
    drawY: canvas.height - y,
  };
};

const fillCircle = (context, x, y, radius, color) => {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill();
};

const drawCircle = (context, x, y, radius, color) => {
  const { drawX, drawY } = convertCoord(x, y);
  fillCircle(context, drawX, drawY, radius, color);
};

/** main draw */
export const drawCanvas = (drawState, canvasRef) => {
    canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    // clear the canvas to black
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate cell dimensions for 5x5 grid
    const cellWidth = canvas.width / 5;
    const cellHeight = canvas.height / 5;

    
    // Draw question marks for non-colored cells
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const index = row * 5 + col;
            const centerX = col * cellWidth + cellWidth / 2;
            const centerY = row * cellHeight + cellHeight / 2;
            
            if (drawState.grids[index]) {
                // Draw colored cell
                context.fillStyle = drawState.grids[index];
                context.fillRect(
                    col * cellWidth,
                    row * cellHeight,
                    cellWidth,
                    cellHeight
                );
            } else {
                // Draw question mark
                context.fillStyle = "#333"; // Dark gray background
                context.fillRect(
                    col * cellWidth,
                    row * cellHeight,
                    cellWidth,
                    cellHeight
                );
                context.fillStyle = "white";
                context.font = `${Math.min(cellWidth, cellHeight) * 0.8}px Arial`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("?", centerX, centerY);
            }
        }
    }
    // Draw white grid lines for question mark mode
    context.strokeStyle = "white";

    // Draw grid lines
    context.lineWidth = 2;

    // Draw vertical lines
    for (let x = 1; x < 5; x++) {
        context.beginPath();
        context.moveTo(x * cellWidth, 0);
        context.lineTo(x * cellWidth, canvas.height);
        context.stroke();
    }

    // Draw horizontal lines
    for (let y = 1; y < 5; y++) {
        context.beginPath();
        context.moveTo(0, y * cellHeight);
        context.lineTo(canvas.width, y * cellHeight);
        context.stroke();
    }
    // console.log(drawState)
    Object.values(drawState.players).forEach((p) => {
      drawCircle(context, p.position.x, p.position.y, p.radius, p.color);
      console.log('holaaaa1')
    });
};
