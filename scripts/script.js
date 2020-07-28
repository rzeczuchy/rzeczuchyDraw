"use strict";

// CONSTANTS, VARIABLES
const canvas = document.getElementById("drawingCanvas");
const context = canvas.getContext("2d");
const defaultCanvasWidth = 500;
const defaultCanvasHeight = 400;
const minCanvasSize = 1;
const maxCanvasSize = 1000;
const maxHistorySize = 3;
const brushColorSelect = document.getElementById("brushColorSelect");
const brushSizeSelect = document.getElementById("brushSizeSelect");
const saveButton = document.getElementById("saveButton");
const canvasWidthSelect = document.getElementById("canvasWidthSelect");
const canvasHeightSelect = document.getElementById("canvasHeightSelect");

let isDrawing = false;
let isMouseDown = false;
let x = 0;
let y = 0;
let brush;
let colorPicker;
let currentTool;
let toUndo = [];
let toRedo = [];

// EVENT LISTENERS
canvas.addEventListener("mousedown", (e) => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseDown(e);
  }
  isMouseDown = true;
});

canvas.addEventListener("mousemove", (e) => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseMove(e);
  }
});

canvas.addEventListener("mouseleave", (e) => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseLeave(e);
  }
});

canvas.addEventListener("mouseenter", (e) => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseEnter(e);
  }
});

window.addEventListener("mouseup", (e) => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseUp(e);
  }
  isMouseDown = false;
});

window.addEventListener("keyup", (e) => {
  handleKeyInput(e);
});

canvas.oncontextmenu = (e) => {
  e.preventDefault();
};

window.onload = () => {
  initialize();
};

// CLASS DEFINITIONS
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
    this.color = "#ff0066";
    this.minSize = 1;
    this.maxSize = 20;
    this.size = 1;
    this.shapes = {
      SQUARE: "square",
      ROUND: "round",
    };
    this.shape = this.shapes.SQUARE;
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
  // Bresenham's algorithm in JS taken from this answer:
  // https://stackoverflow.com/a/4672319/13352934
  drawLine(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;

    while (true) {
      this.drawPoint(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  drawPoint(x, y) {
    switch (this.shape) {
      case this.shapes.SQUARE:
        this.drawSquarePoint(x, y);
        break;
      case this.shapes.ROUND:
        this.drawRoundPoint(x, y);
        break;
      default:
        break;
    }
  }
  drawSquarePoint(x, y) {
    const halfBrush = Math.ceil(this.size / 2);
    context.beginPath();
    context.fillStyle = this.color;
    context.fillRect(x - halfBrush, y - halfBrush, this.size, this.size);
    context.fill();
  }
  drawRoundPoint(x, y) {
    const halfBrush = Math.ceil(this.size / 2);
    context.beginPath();
    context.arc(x, y, halfBrush, 0, 2 * Math.PI);
    context.fillStyle = this.color;
    context.fill();
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
    const imgData = context.getImageData(
      getCursorXPos(e),
      getCursorYPos(e),
      1,
      1
    );
    brushColorSelect.value = getHexFromRgb(
      imgData.data[0],
      imgData.data[1],
      imgData.data[2]
    );
    setBrushColor();
  }
}

// FUNCTIONS
const initialize = () => {
  canvas.width = defaultCanvasWidth;
  canvas.height = defaultCanvasHeight;
  canvas.style.cursor = "crosshair";
  clearToColor("#ffffff");
  brush = new Brush();
  colorPicker = new ColorPicker();
  currentTool = brush;
  brushColorSelect.value = brush.color;
  brushSizeSelect.value = brush.size;
  saveButton.setAttribute("download", "drawing.png");
  canvasWidthSelect.value = canvas.width;
  canvasHeightSelect.value = canvas.height;
};

const setBrushColor = () => {
  brush.color = brushColorSelect.value;
};

const switchToColorPicker = () => {
  currentTool = colorPicker;
};

const setBrushSize = () => {
  brushSizeSelect.value = clamp(
    brushSizeSelect.value,
    brush.minSize,
    brush.maxSize
  );
  brush.size = brushSizeSelect.value;
};

const setSquareBrush = () => {
  brush.shape = brush.shapes.SQUARE;
};

const setRoundBrush = () => {
  brush.shape = brush.shapes.ROUND;
};

const cacheImage = () => {
  saveButton.setAttribute(
    "href",
    canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
  );
};

const clearCanvas = () => {
  if (confirm("This action will DESTROY your beautiful drawing! You sure?")) {
    saveCanvasState();
    clearToColor("#ffffff");
  }
};

const setCanvasWidth = () => {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasWidthSelect.value = clamp(
      canvasWidthSelect.value,
      minCanvasSize,
      maxCanvasSize
    );
    canvas.width = canvasWidthSelect.value;
    clearToColor("#ffffff");
    clearHistory();
  }
};

const setCanvasHeight = () => {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasHeightSelect.value = clamp(
      canvasHeightSelect.value,
      minCanvasSize,
      maxCanvasSize
    );
    canvas.height = canvasHeightSelect.value;
    clearToColor("#ffffff");
    clearHistory();
  }
};

const saveCanvasState = () => {
  const currentState = new Image();
  currentState.src = canvas.toDataURL();

  if (toUndo.length >= maxHistorySize) {
    toUndo.splice(0, 1);
  }

  toUndo.push(currentState);
  toRedo.length = 0;
};

const undo = () => {
  if (typeof toUndo !== "undefined" && toUndo.length > 0) {
    const currentState = new Image();
    currentState.src = canvas.toDataURL();
    toRedo.push(currentState);
    context.drawImage(toUndo.pop(), 0, 0);
  }
};

const redo = () => {
  if (typeof toRedo !== "undefined" && toRedo.length > 0) {
    const currentState = new Image();
    currentState.src = canvas.toDataURL();
    toUndo.push(currentState);
    context.drawImage(toRedo.pop(), 0, 0);
  }
};

const handleKeyInput = (e) => {
  let charCode = event.charCode || event.keyCode;

  switch (String.fromCharCode(charCode).toLowerCase()) {
    case "z":
      undo();
      break;
    case "y":
      redo();
      break;
    default:
      break;
  }
};

const drawRectangle = (x, y, width, height, color) => {
  context.beginPath();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.fill;
};

const clearToColor = (color) => {
  drawRectangle(0, 0, canvas.width, canvas.height, color);
};

const clearHistory = () => {
  toUndo.length = 0;
  toRedo.length = 0;
};

const getCursorXPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  return event.clientX - rect.left;
};

const getCursorYPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  return event.clientY - rect.top;
};

const clamp = (number, min, max) => {
  return Math.min(Math.max(number, min), max);
};

// convert rgb color to hex
// from Stack Overflow https://stackoverflow.com/a/5623914/2849127
const getHexFromRgb = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
