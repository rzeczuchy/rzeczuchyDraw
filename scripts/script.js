"use strict";

// defining canvas and context
const drawingCanvas = document.getElementById("drawingCanvas");
const context = drawingCanvas.getContext("2d");

// defining default style for the cursor
drawingCanvas.style.cursor = "crosshair";

// defining event listeners for mouse
drawingCanvas.addEventListener("mousedown", e => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseDown(e);
  }
  isMouseDown = true;
});

drawingCanvas.addEventListener("mousemove", e => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseMove(e);
  }
});

drawingCanvas.addEventListener("mouseleave", e => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseLeave(e);
  }
});

drawingCanvas.addEventListener("mouseenter", e => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseEnter(e);
  }
});

window.addEventListener("mouseup", e => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseUp(e);
  }
  isMouseDown = false;
});

// disabling canvas context menu
drawingCanvas.oncontextmenu = e => {
  e.preventDefault();
};

// clearing canvas to white on load
window.onload = function() {
  drawRectangle(0, 0, drawingCanvas.width, drawingCanvas.height, "#ffffff");
};

// variables for brush, canvas and controls
let isDrawing = false;
let isMouseDown = false;
let x = 0;
let y = 0;
const defaultCanvasWidth = 500;
const defaultCanvasHeight = 400;
drawingCanvas.width = defaultCanvasWidth;
drawingCanvas.height = defaultCanvasHeight;
const minCanvasSize = 1;
const maxCanvasSize = 1000;
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

// color picker tools
function switchToColorPicker() {
  currentTool = colorPicker;
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
    drawRectangle(0, 0, drawingCanvas.width, drawingCanvas.height, "#ffffff");
  }
}

// canvas size selects
const canvasWidthSelect = document.getElementById("canvasWidthSelect");
canvasWidthSelect.value = drawingCanvas.width;
const canvasHeightSelect = document.getElementById("canvasHeightSelect");
canvasHeightSelect.value = drawingCanvas.height;
function setCanvasWidth() {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasWidthSelect.value = clamp(canvasWidthSelect.value, minCanvasSize, maxCanvasSize);
    drawingCanvas.width = canvasWidthSelect.value;
  }
}
function setCanvasHeight() {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasHeightSelect.value = clamp(canvasHeightSelect.value, minCanvasSize, maxCanvasSize);
    drawingCanvas.height = canvasHeightSelect.value;
  }
}

// TOOLS
class Tool {
  constructor() {}
  onMouseDown(e) {}
  onMouseMove(e) {}
  onMouseLeave(e) {}
  onMouseEnter(e) {}
  onMouseUp(e) {}
}

class Brush extends Tool {
  constructor() {
    super();
  }
  onMouseDown(e) {
    startDrawing(e);
  }
  onMouseMove(e) {
    if (isDrawing) {
      draw(e);
    }
  }
  onMouseLeave(e) {
    stopDrawing(e);
  }
  onMouseEnter(e) {
    if (isMouseDown) {
      startDrawing(e);
    }
  }
  onMouseUp(e) {
    if (isDrawing) {
      stopDrawing(e);
    }
  }
}

class ColorPicker extends Tool {
  constructor() {
    super();
  }
  onMouseDown(e) {
    this.pickColor(e);
  }
  onMouseMove(e) {
    if (isMouseDown) {
      this.pickColor(e);
    }
  }
  onMouseLeave(e) {}
  onMouseEnter(e) {}
  onMouseUp(e) {
    currentTool = brush;
  }
  pickColor(e) {
    const imgData = context.getImageData(getCursorXPos(e),
      getCursorYPos(e), 1, 1);
    brushColorSelect.value = getHexFromRgb(imgData.data[0], imgData.data[1],
      imgData.data[2]);
    setBrushColor();
  }
}

const brush = new Brush();
const colorPicker = new ColorPicker();
let currentTool = brush;

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

function drawRectangle(x, y, width, height, color) {
  context.beginPath();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.fill;
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

// clamp number to given values
function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

// convert rgb color to hex
// from Stack Overflow https://stackoverflow.com/a/5623914/2849127
function getHexFromRgb(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
