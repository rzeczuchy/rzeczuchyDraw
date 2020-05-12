"use strict";

// defining canvas and context
const drawingCanvas = document.getElementById("drawingCanvas");
const context = drawingCanvas.getContext("2d");

// defining default style for the cursor
drawingCanvas.style.cursor = "crosshair";

// defining event listeners for mouse
drawingCanvas.addEventListener("mousedown", e => {
  startDrawing(e);
  isMouseDown = true;
});

drawingCanvas.addEventListener("mousemove", e => {
  if (isDrawing) {
    draw(e);
  }
});

drawingCanvas.addEventListener("mouseleave", e => {
  stopDrawing(e);
});

drawingCanvas.addEventListener("mouseenter", e => {
  if (isMouseDown) {
    startDrawing(e);
  }
});

window.addEventListener("mouseup", e => {
  if (isDrawing) {
    stopDrawing(e);
  }
  isMouseDown = false;
});

// disabling canvas context menu
drawingCanvas.oncontextmenu = e => {
  e.preventDefault();
};

// variables for the brush and controls
let isDrawing = false;
let isMouseDown = false;
let x = 0;
let y = 0;
const minBrushSize = 1;
const maxBrushSize = 20;
let brushSize = 1;
let brushColor = "#ff0066";

// UI ELEMENTS
// color picker
const brushColorSelect = document.getElementById("brushColorSelect");
brushColorSelect.value = brushColor;
function setBrushColor() {
  brushColor = brushColorSelect.value;
}

// brush size select
const brushSizeSelect = document.getElementById("brushSizeSelect");
brushSizeSelect.value = brushSize;
function setBrushSize() {
  brushSizeSelect.value = clamp(brushSizeSelect.value, minBrushSize, maxBrushSize);
  brushSize = brushSizeSelect.value;
}

// save button
const saveButton = document.getElementById("saveButton");
saveButton.setAttribute("download", "drawing.png");
function cacheImage() {
  saveButton.setAttribute('href', drawingCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
}

// clear button
function clearCanvas() {
  if (confirm("This action will DESTROY your beautiful drawing! You sure?")) {
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  }
}

// DRAWING
// start drawing a shape
function startDrawing(e) {
  isDrawing = true;
  x = e.offsetX;
  y = e.offsetY;
  drawPoint(x, y);
}

// draw shapes on canvas
function draw(e) {
  drawLine(x, y, e.offsetX, e.offsetY);
  x = e.offsetX;
  y = e.offsetY;
}

// stop drawing a shape
function stopDrawing(e) {
  if (isDrawing) {
    drawLine(x, y, e.offsetX, e.offsetY);
    cacheImage();
  }
  x = 0;
  y = 0;
  isDrawing = false;
}

function drawLine(x1, y1, x2, y2) {
  context.beginPath();
  context.strokeStyle = brushColor;
  context.lineWidth = brushSize;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}

function drawPoint(x, y) {
  const halfBrushSize = Math.floor(brushSize / 2);
  context.beginPath();
  context.fillStyle = brushColor;
  context.fillRect(x - halfBrushSize, y - halfBrushSize,
    brushSize, brushSize);
  context.fill();
  context.closePath();
}

// UTILITY
// get x position of cursor
function getCursorXPos(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  return event.clientX - rect.left;
}

// get y position of cursor
function getCursorYPos(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  return event.clientY - rect.top;
}

//clamp number to given values
function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}
