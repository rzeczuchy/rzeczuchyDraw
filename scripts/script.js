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

// defining event listeners for keyboard
window.addEventListener("keyup", e => {
  handleKeyInput(e);
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
    saveCanvasState();
    clearToColor("#ffffff");
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
    clearToColor("#ffffff");
    clearHistory();
  }
}

function setCanvasHeight() {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasHeightSelect.value = clamp(canvasHeightSelect.value, minCanvasSize, maxCanvasSize);
    drawingCanvas.height = canvasHeightSelect.value;
    clearToColor("#ffffff");
    clearHistory();
  }
}

// undo/redo buttons
let toUndo = [];
let toRedo = [];
const maxHistorySize = 3;

function saveCanvasState() {
  const currentState = new Image();
  currentState.src = drawingCanvas.toDataURL();

  if (toUndo.length >= maxHistorySize) {
    toUndo.splice(0, 1);
  }

  toUndo.push(currentState);
  toRedo.length = 0;
}

function undo() {
  if (typeof toUndo !== 'undefined' && toUndo.length > 0) {
    const currentState = new Image();
    currentState.src = drawingCanvas.toDataURL();
    toRedo.push(currentState);
    context.drawImage(toUndo.pop(), 0, 0);
  }
}

function redo() {
  if (typeof toRedo !== 'undefined' && toRedo.length > 0) {
    const currentState = new Image();
    currentState.src = drawingCanvas.toDataURL();
    toUndo.push(currentState);
    context.drawImage(toRedo.pop(), 0, 0);
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
    this.startDrawing(e);
  }
  onMouseMove(e) {
    if (isDrawing) {
      this.draw(e);
    }
  }
  onMouseLeave(e) {
    this.stopDrawing(e);
  }
  onMouseEnter(e) {
    if (isMouseDown) {
      this.startDrawing(e);
    }
  }
  onMouseUp(e) {
    if (isDrawing) {
      this.stopDrawing(e);
    }
  }
  startDrawing(e) {
    saveCanvasState();
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
    this.drawPoint(x, y);
  }
  draw(e) {
    this.drawLine(x, y, e.offsetX, e.offsetY);
    x = e.offsetX;
    y = e.offsetY;
  }
  stopDrawing(e) {
    if (isDrawing) {
      this.drawLine(x, y, e.offsetX, e.offsetY);
      cacheImage();
    }
    x = 0;
    y = 0;
    isDrawing = false;
  }
  drawLine(x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
  }
  drawPoint(x, y) {
    const halfBrushSize = Math.floor(brushSize / 2);
    context.beginPath();
    context.fillStyle = brushColor;
    context.fillRect(x - halfBrushSize, y - halfBrushSize,
      brushSize, brushSize);
    context.fill();
    context.closePath();
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

// KEYBOARD SHORTCUTS
function handleKeyInput(e) {
  let charCode = event.charCode || event.keyCode;
  
  switch(String.fromCharCode(charCode).toLowerCase()) {
    case "z":
      undo();
      break;
    case "y":
      redo();
      break;
    default:
      break;
  }
}

// UTILITY
// draw a rectangle on canvas
function drawRectangle(x, y, width, height, color) {
  context.beginPath();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.fill;
  context.closePath();
}

function clearToColor(color) {
  drawRectangle(0, 0, drawingCanvas.width, drawingCanvas.height, color);
}

function clearHistory() {
  toUndo.length = 0;
  toRedo.length = 0;
}

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
