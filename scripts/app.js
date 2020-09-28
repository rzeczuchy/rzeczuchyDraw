"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// CONSTANTS, VARIABLES, ENUMS
var darkmodeButton = (document.getElementById("darkmodeButton"));
var canvas = (document.getElementById("drawingCanvas"));
var context = canvas.getContext("2d");
var defaultCanvasWidth = 500;
var defaultCanvasHeight = 400;
var minCanvasSize = 1;
var maxCanvasSize = 1000;
var maxHistorySize = 3;
var brushColorSelect = (document.getElementById("brushColorSelect"));
var brushSizeSelect = (document.getElementById("brushSizeSelect"));
var saveButton = (document.getElementById("saveButton"));
var canvasWidthSelect = (document.getElementById("canvasWidthSelect"));
var canvasHeightSelect = (document.getElementById("canvasHeightSelect"));
var isDrawing = false;
var isMouseDown = false;
var x = 0;
var y = 0;
var brush;
var colorPicker;
var currentTool;
var toUndo = [];
var toRedo = [];
var darkmode = document.body.classList.contains("dark-mode");
var BrushShape;
(function (BrushShape) {
    BrushShape[BrushShape["Square"] = 0] = "Square";
    BrushShape[BrushShape["Round"] = 1] = "Round";
})(BrushShape || (BrushShape = {}));
// EVENT LISTENERS
canvas.addEventListener("mousedown", function (e) {
    if (typeof currentTool !== "undefined" && currentTool != null) {
        currentTool.onMouseDown(e);
    }
    isMouseDown = true;
});
canvas.addEventListener("mousemove", function (e) {
    if (typeof currentTool !== "undefined" && currentTool != null) {
        currentTool.onMouseMove(e);
    }
});
canvas.addEventListener("mouseleave", function (e) {
    if (typeof currentTool !== "undefined" && currentTool != null) {
        currentTool.onMouseLeave(e);
    }
});
canvas.addEventListener("mouseenter", function (e) {
    if (typeof currentTool !== "undefined" && currentTool != null) {
        currentTool.onMouseEnter(e);
    }
});
window.addEventListener("mouseup", function (e) {
    if (typeof currentTool !== "undefined" && currentTool != null) {
        currentTool.onMouseUp(e);
    }
    isMouseDown = false;
});
window.addEventListener("keyup", function (e) {
    handleKeyInput(e);
});
canvas.oncontextmenu = function (e) {
    e.preventDefault();
};
window.onload = function () {
    initialize();
};
// INTERFACES, CLASSES
var Tool = /** @class */ (function () {
    function Tool() {
    }
    Tool.prototype.onMouseDown = function (e) { };
    Tool.prototype.onMouseMove = function (e) { };
    Tool.prototype.onMouseLeave = function (e) { };
    Tool.prototype.onMouseEnter = function (e) { };
    Tool.prototype.onMouseUp = function (e) { };
    return Tool;
}());
var Brush = /** @class */ (function (_super) {
    __extends(Brush, _super);
    function Brush() {
        var _this = _super.call(this) || this;
        _this.color = "#ff0066";
        _this.minSize = 1;
        _this.maxSize = 100;
        _this.size = 1;
        _this.shape = BrushShape.Square;
        return _this;
    }
    Brush.prototype.onMouseDown = function (e) {
        this.startDrawing(e);
    };
    Brush.prototype.onMouseMove = function (e) {
        if (isDrawing) {
            this.draw(e);
        }
    };
    Brush.prototype.onMouseLeave = function (e) {
        this.stopDrawing(e);
    };
    Brush.prototype.onMouseEnter = function (e) {
        if (isMouseDown) {
            this.startDrawing(e);
        }
    };
    Brush.prototype.onMouseUp = function (e) {
        if (isDrawing) {
            this.stopDrawing(e);
        }
    };
    Brush.prototype.startDrawing = function (e) {
        saveCanvasState();
        isDrawing = true;
        x = e.offsetX;
        y = e.offsetY;
        this.drawPoint(x, y);
    };
    Brush.prototype.draw = function (e) {
        this.drawLine(x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    };
    Brush.prototype.stopDrawing = function (e) {
        if (isDrawing) {
            this.drawLine(x, y, e.offsetX, e.offsetY);
            cacheImage();
        }
        x = 0;
        y = 0;
        isDrawing = false;
    };
    // Bresenham's algorithm in JS taken from this answer:
    // https://stackoverflow.com/a/4672319/13352934
    Brush.prototype.drawLine = function (x0, y0, x1, y1) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = x0 < x1 ? 1 : -1;
        var sy = y0 < y1 ? 1 : -1;
        var err = dx - dy;
        while (true) {
            this.drawPoint(x0, y0);
            if (x0 === x1 && y0 === y1)
                break;
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
    };
    Brush.prototype.drawPoint = function (x, y) {
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
    };
    Brush.prototype.drawSquarePoint = function (x, y) {
        var halfBrush = Math.ceil(this.size / 2);
        context.beginPath();
        context.fillStyle = this.color;
        context.fillRect(x - halfBrush, y - halfBrush, this.size, this.size);
        context.fill();
    };
    Brush.prototype.drawRoundPoint = function (x, y) {
        var halfBrush = Math.ceil(this.size / 2);
        context.beginPath();
        context.arc(x, y, halfBrush, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
    };
    return Brush;
}(Tool));
var ColorPicker = /** @class */ (function (_super) {
    __extends(ColorPicker, _super);
    function ColorPicker() {
        return _super.call(this) || this;
    }
    ColorPicker.prototype.onMouseDown = function (e) {
        this.pickColor(e);
    };
    ColorPicker.prototype.onMouseMove = function (e) {
        if (isMouseDown) {
            this.pickColor(e);
        }
    };
    ColorPicker.prototype.onMouseLeave = function (e) { };
    ColorPicker.prototype.onMouseEnter = function (e) { };
    ColorPicker.prototype.onMouseUp = function (e) {
        currentTool = brush;
    };
    ColorPicker.prototype.pickColor = function (e) {
        var imgData = context.getImageData(getCursorXPos(e), getCursorYPos(e), 1, 1);
        brushColorSelect.value = getHexFromRgb(imgData.data[0], imgData.data[1], imgData.data[2]);
        setBrushColor();
    };
    return ColorPicker;
}(Tool));
// FUNCTIONS
var initialize = function () {
    updateDarkmodeButton();
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
var toggleDarkMode = function () {
    darkmode = !darkmode;
    var body = document.body;
    var html = document.documentElement;
    body.classList.toggle("dark-mode");
    html.classList.toggle("dark-mode");
    updateDarkmodeButton();
};
var updateDarkmodeButton = function () {
    darkmodeButton.innerHTML = darkmode ? "On" : "Off";
};
var setBrushColor = function () {
    brush.color = brushColorSelect.value;
};
var switchToColorPicker = function () {
    currentTool = colorPicker;
};
var setBrushSize = function () {
    brushSizeSelect.value = clamp(parseInt(brushSizeSelect.value), brush.minSize, brush.maxSize).toString();
    brush.size = parseInt(brushSizeSelect.value);
};
var setSquareBrush = function () {
    brush.shape = BrushShape.Square;
};
var setRoundBrush = function () {
    brush.shape = BrushShape.Round;
};
var cacheImage = function () {
    saveButton.setAttribute("href", canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
};
var clearCanvas = function () {
    if (confirm("This action will DESTROY your beautiful drawing! You sure?")) {
        saveCanvasState();
        clearToColor("#ffffff");
    }
};
var setCanvasWidth = function () {
    if (confirm("This action will clear the canvas. Are you sure?")) {
        canvasWidthSelect.value = clamp(parseInt(canvasWidthSelect.value), minCanvasSize, maxCanvasSize).toString();
        canvas.width = parseInt(canvasWidthSelect.value);
        clearToColor("#ffffff");
        clearHistory();
    }
};
var setCanvasHeight = function () {
    if (confirm("This action will clear the canvas. Are you sure?")) {
        canvasHeightSelect.value = clamp(parseInt(canvasHeightSelect.value), minCanvasSize, maxCanvasSize).toString();
        canvas.height = parseInt(canvasHeightSelect.value);
        clearToColor("#ffffff");
        clearHistory();
    }
};
var saveCanvasState = function () {
    var currentState = new Image();
    currentState.src = canvas.toDataURL();
    if (toUndo.length >= maxHistorySize) {
        toUndo.splice(0, 1);
    }
    toUndo.push(currentState);
    toRedo.length = 0;
};
var undo = function () {
    if (typeof toUndo !== "undefined" && toUndo.length > 0) {
        var currentState = new Image();
        currentState.src = canvas.toDataURL();
        toRedo.push(currentState);
        context.drawImage(toUndo.pop(), 0, 0);
    }
};
var redo = function () {
    if (typeof toRedo !== "undefined" && toRedo.length > 0) {
        var currentState = new Image();
        currentState.src = canvas.toDataURL();
        toUndo.push(currentState);
        context.drawImage(toRedo.pop(), 0, 0);
    }
};
var handleKeyInput = function (e) {
    var charCode = e.charCode || e.keyCode;
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
var drawRectangle = function (x, y, width, height, color) {
    context.beginPath();
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
    context.fill;
};
var clearToColor = function (color) {
    drawRectangle(0, 0, canvas.width, canvas.height, color);
};
var clearHistory = function () {
    toUndo.length = 0;
    toRedo.length = 0;
};
var getCursorXPos = function (e) {
    var rect = canvas.getBoundingClientRect();
    return e.clientX - rect.left;
};
var getCursorYPos = function (e) {
    var rect = canvas.getBoundingClientRect();
    return e.clientY - rect.top;
};
var clamp = function (number, min, max) {
    return Math.min(Math.max(number, min), max);
};
// convert rgb color to hex
// from Stack Overflow https://stackoverflow.com/a/5623914/2849127
var getHexFromRgb = function (r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
