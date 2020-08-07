"use strict";

// CONSTANTS, VARIABLES, ENUMS
const canvas: HTMLCanvasElement = <HTMLCanvasElement>(
  document.getElementById("drawingCanvas")
);
const context: CanvasRenderingContext2D = canvas.getContext("2d");
const defaultCanvasWidth: number = 500;
const defaultCanvasHeight: number = 400;
const minCanvasSize: number = 1;
const maxCanvasSize: number = 1000;
const maxHistorySize: number = 3;
const brushColorSelect: HTMLInputElement = <HTMLInputElement>(
  document.getElementById("brushColorSelect")
);
const brushSizeSelect: HTMLTextAreaElement = <HTMLTextAreaElement>(
  document.getElementById("brushSizeSelect")
);
const saveButton: HTMLButtonElement = <HTMLButtonElement>(
  document.getElementById("saveButton")
);
const canvasWidthSelect: HTMLInputElement = <HTMLInputElement>(
  document.getElementById("canvasWidthSelect")
);
const canvasHeightSelect: HTMLInputElement = <HTMLInputElement>(
  document.getElementById("canvasHeightSelect")
);

let isDrawing: boolean = false;
let isMouseDown: boolean = false;
let x: number = 0;
let y: number = 0;
let brush: Brush;
let colorPicker: ColorPicker;
let currentTool: Tool;
let toUndo: HTMLImageElement[] = [];
let toRedo: HTMLImageElement[] = [];

enum BrushShape {
  Square,
  Round,
}

// EVENT LISTENERS
canvas.addEventListener("mousedown", (e: MouseEvent): void => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseDown(e);
  }
  isMouseDown = true;
});

canvas.addEventListener("mousemove", (e: MouseEvent): void => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseMove(e);
  }
});

canvas.addEventListener("mouseleave", (e: MouseEvent): void => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseLeave(e);
  }
});

canvas.addEventListener("mouseenter", (e: MouseEvent): void => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseEnter(e);
  }
});

window.addEventListener("mouseup", (e: MouseEvent): void => {
  if (typeof currentTool !== "undefined" && currentTool != null) {
    currentTool.onMouseUp(e);
  }
  isMouseDown = false;
});

window.addEventListener("keyup", (e: KeyboardEvent): void => {
  handleKeyInput(e);
});

canvas.oncontextmenu = (e: MouseEvent): void => {
  e.preventDefault();
};

window.onload = (): void => {
  initialize();
};

// INTERFACES, CLASSES
class Tool {
  constructor() {}
  onMouseDown(e: MouseEvent) {}
  onMouseMove(e: MouseEvent) {}
  onMouseLeave(e: MouseEvent) {}
  onMouseEnter(e: MouseEvent) {}
  onMouseUp(e: MouseEvent) {}
}

class Brush extends Tool {
  color: string;
  minSize: number;
  maxSize: number;
  size: number;
  shape: BrushShape;

  constructor() {
    super();
    this.color = "#ff0066";
    this.minSize = 1;
    this.maxSize = 20;
    this.size = 1;
    this.shape = BrushShape.Square;
  }
  onMouseDown(e: MouseEvent): void {
    this.startDrawing(e);
  }
  onMouseMove(e: MouseEvent): void {
    if (isDrawing) {
      this.draw(e);
    }
  }
  onMouseLeave(e: MouseEvent): void {
    this.stopDrawing(e);
  }
  onMouseEnter(e: MouseEvent): void {
    if (isMouseDown) {
      this.startDrawing(e);
    }
  }
  onMouseUp(e: MouseEvent): void {
    if (isDrawing) {
      this.stopDrawing(e);
    }
  }
  startDrawing(e: MouseEvent): void {
    saveCanvasState();
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
    this.drawPoint(x, y);
  }
  draw(e: MouseEvent): void {
    this.drawLine(x, y, e.offsetX, e.offsetY);
    x = e.offsetX;
    y = e.offsetY;
  }
  stopDrawing(e: MouseEvent): void {
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
  drawLine(x0: number, y0: number, x1: number, y1: number): void {
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
  drawPoint(x: number, y: number): void {
    switch (this.shape) {
      case BrushShape.Square:
        this.drawSquarePoint(x, y);
        break;
      case BrushShape.Round:
        this.drawRoundPoint(x, y);
        break;
      default:
        break;
    }
  }
  drawSquarePoint(x: number, y: number): void {
    const halfBrush: number = Math.ceil(this.size / 2);
    context.beginPath();
    context.fillStyle = this.color;
    context.fillRect(x - halfBrush, y - halfBrush, this.size, this.size);
    context.fill();
  }
  drawRoundPoint(x: number, y: number): void {
    const halfBrush: number = Math.ceil(this.size / 2);
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
  onMouseDown(e: MouseEvent): void {
    this.pickColor(e);
  }
  onMouseMove(e: MouseEvent): void {
    if (isMouseDown) {
      this.pickColor(e);
    }
  }
  onMouseLeave(e: MouseEvent): void {}
  onMouseEnter(e: MouseEvent): void {}
  onMouseUp(e: MouseEvent): void {
    currentTool = brush;
  }
  pickColor(e: MouseEvent): void {
    const imgData: ImageData = context.getImageData(
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
const initialize = (): void => {
  canvas.width = defaultCanvasWidth;
  canvas.height = defaultCanvasHeight;
  canvas.style.cursor = "crosshair";
  clearToColor("#ffffff");
  brush = new Brush();
  colorPicker = new ColorPicker();
  currentTool = brush;
  brushColorSelect.value = brush.color.toString();
  brushSizeSelect.value = brush.size.toString();
  saveButton.setAttribute("download", "drawing.png");
  canvasWidthSelect.value = canvas.width.toString();
  canvasHeightSelect.value = canvas.height.toString();
};

const setBrushColor = (): void => {
  brush.color = brushColorSelect.value;
};

const switchToColorPicker = (): void => {
  currentTool = colorPicker;
};

const setBrushSize = (): void => {
  brushSizeSelect.value = clamp(
    parseInt(brushSizeSelect.value),
    brush.minSize,
    brush.maxSize
  ).toString();
  brush.size = parseInt(brushSizeSelect.value);
};

const setSquareBrush = (): void => {
  brush.shape = BrushShape.Square;
};

const setRoundBrush = (): void => {
  brush.shape = BrushShape.Round;
};

const cacheImage = (): void => {
  saveButton.setAttribute(
    "href",
    canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
  );
};

const clearCanvas = (): void => {
  if (confirm("This action will DESTROY your beautiful drawing! You sure?")) {
    saveCanvasState();
    clearToColor("#ffffff");
  }
};

const setCanvasWidth = (): void => {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasWidthSelect.value = clamp(
      parseInt(canvasWidthSelect.value),
      minCanvasSize,
      maxCanvasSize
    ).toString();
    canvas.width = parseInt(canvasWidthSelect.value);
    clearToColor("#ffffff");
    clearHistory();
  }
};

const setCanvasHeight = (): void => {
  if (confirm("This action will clear the canvas. Are you sure?")) {
    canvasHeightSelect.value = clamp(
      parseInt(canvasHeightSelect.value),
      minCanvasSize,
      maxCanvasSize
    ).toString();
    canvas.height = parseInt(canvasHeightSelect.value);
    clearToColor("#ffffff");
    clearHistory();
  }
};

const saveCanvasState = (): void => {
  const currentState: HTMLImageElement = new Image();
  currentState.src = canvas.toDataURL();

  if (toUndo.length >= maxHistorySize) {
    toUndo.splice(0, 1);
  }

  toUndo.push(currentState);
  toRedo.length = 0;
};

const undo = (): void => {
  if (typeof toUndo !== "undefined" && toUndo.length > 0) {
    const currentState: HTMLImageElement = new Image();
    currentState.src = canvas.toDataURL();
    toRedo.push(currentState);
    context.drawImage(toUndo.pop(), 0, 0);
  }
};

const redo = (): void => {
  if (typeof toRedo !== "undefined" && toRedo.length > 0) {
    const currentState: HTMLImageElement = new Image();
    currentState.src = canvas.toDataURL();
    toUndo.push(currentState);
    context.drawImage(toRedo.pop(), 0, 0);
  }
};

const handleKeyInput = (e: KeyboardEvent): void => {
  let charCode: number = e.charCode || e.keyCode;

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

const drawRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void => {
  context.beginPath();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.fill;
};

const clearToColor = (color: string): void => {
  drawRectangle(0, 0, canvas.width, canvas.height, color);
};

const clearHistory = (): void => {
  toUndo.length = 0;
  toRedo.length = 0;
};

const getCursorXPos = (e: MouseEvent): number => {
  const rect: DOMRect = canvas.getBoundingClientRect();
  return e.clientX - rect.left;
};

const getCursorYPos = (e: MouseEvent): number => {
  const rect: DOMRect = canvas.getBoundingClientRect();
  return e.clientY - rect.top;
};

const clamp = (number: number, min: number, max: number): number => {
  return Math.min(Math.max(number, min), max);
};

// convert rgb color to hex
// from Stack Overflow https://stackoverflow.com/a/5623914/2849127
const getHexFromRgb = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
