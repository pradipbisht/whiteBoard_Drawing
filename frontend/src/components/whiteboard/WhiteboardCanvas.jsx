import React, { useRef, useEffect, useState, useCallback } from "react";
import api from "../../services/api"; // Our Axios instance for saving
import useAuthStore from "../../store/authStore";

const WhiteboardCanvas = ({
  socket,
  whiteboardId,
  initialDrawingHistory = [],
}) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FFFFFF"); // Default white (hex format)
  const [lineWidth, setLineWidth] = useState(5);
  const [activeTool, setActiveTool] = useState("pen"); // 'pen', 'eraser', 'text'
  const [textInput, setTextInput] = useState({
    active: false,
    x: 0,
    y: 0,
    value: "",
  });

  // Get current user's MongoDB _id from Zustand store
  const currentUserId = useAuthStore((state) => state.user?._id);

  // History states for Undo/Redo and Save
  const history = useRef([]); // Stores the full drawing history (local actions + received)
  const historyPointer = useRef(-1); // Points to the current state in history for undo/redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isSyncingHistory = useRef(false); // Flag to prevent re-drawing during history load/undo/redo

  // Helper function to draw a line or erase on the canvas
  const drawLine = useCallback(
    (
      context,
      x1,
      y1,
      x2,
      y2,
      color, // Dynamic color (for pen or eraser's "color")
      width, // Dynamic width
      toolType // 'pen' or 'eraser'
    ) => {
      if (!context) return;

      context.save(); // Save current context state
      context.strokeStyle = color;
      context.lineWidth = width;

      // Set globalCompositeOperation for eraser effect
      context.globalCompositeOperation =
        toolType === "eraser" ? "destination-out" : "source-over";

      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();

      context.restore(); // Restore context state
    },
    []
  );

  // Helper function to draw text on the canvas
  const drawText = useCallback(
    (
      context,
      x,
      y,
      text,
      color,
      fontSize = 20, // Default font size
      fontFamily = "Arial" // Default font family
    ) => {
      if (!context || !text) return;

      context.save(); // Save context state
      context.fillStyle = color;
      context.font = `${fontSize}px ${fontFamily}`;
      context.textBaseline = "top"; // Position text from its top-left corner
      context.fillText(text, x, y);
      context.restore(); // Restore context state
    },
    []
  );

  // Helper to clear canvas locally
  const clearCanvasLocal = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      contextRef.current.fillStyle = "black"; // Re-fill for eraser to work correctly
      contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Helper function to draw any action item from history
  const drawAction = useCallback(
    (action) => {
      const context = contextRef.current;
      if (!context || isSyncingHistory.current) return;

      switch (action.type) {
        case "line":
          const {
            prevPoint,
            currentPoint,
            color,
            lineWidth: width,
            toolType,
          } = action.data;
          drawLine(
            context,
            prevPoint.x,
            prevPoint.y,
            currentPoint.x,
            currentPoint.y,
            color,
            width,
            toolType
          );
          break;
        case "text":
          const {
            x,
            y,
            text,
            color: textColor,
            fontSize,
            fontFamily,
          } = action.data;
          drawText(context, x, y, text, textColor, fontSize, fontFamily);
          break;
        case "clear":
          clearCanvasLocal(); // Clear locally without emitting
          break;
        default:
          break;
      }
    },
    [clearCanvasLocal, drawLine, drawText]
  ); // Dependencies for drawAction

  // Redraw the entire canvas from history
  const redrawCanvasFromHistory = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;

    isSyncingHistory.current = true; // Set flag to prevent new draws during history sync
    clearCanvasLocal(); // Clear everything first

    // Draw all actions up to the current pointer
    for (let i = 0; i <= historyPointer.current; i++) {
      drawAction(history.current[i]);
    }
    isSyncingHistory.current = false; // Reset flag
  }, [clearCanvasLocal, drawAction]);

  // Initialize canvas and context on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        contextRef.current = context;
        context.fillStyle = "black"; // Initial canvas background fill
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Load initial drawing history when component mounts or initialHistory changes
  useEffect(() => {
    if (
      initialDrawingHistory &&
      initialDrawingHistory.length > 0 &&
      historyPointer.current === -1
    ) {
      history.current = initialDrawingHistory;
      historyPointer.current = initialDrawingHistory.length - 1;
      redrawCanvasFromHistory();
      setCanUndo(true); // If there's initial history, we can undo
    }
  }, [initialDrawingHistory, redrawCanvasFromHistory]);

  // Socket.IO Listener Setup for incoming actions
  useEffect(() => {
    if (!socket || !contextRef.current) return;

    // Listener for incoming drawing (line/eraser) events
    socket.on("drawing", (data) => {
      if (isSyncingHistory.current) return; // Don't draw if we're busy loading/undoing/redoing
      const { userId } = data; // User who performed the action

      // Only add to history and redraw if the action came from another client
      if (userId !== socket.id) {
        const action = { type: "line", data: data, userId }; // Re-use data, add userId
        history.current = history.current.slice(0, historyPointer.current + 1); // Truncate redo history
        history.current.push(action);
        historyPointer.current = history.current.length - 1;
        redrawCanvasFromHistory(); // Redraw with new action
        setCanUndo(true);
        setCanRedo(false);
      }
    });

    // Listener for incoming text events
    socket.on("text", (data) => {
      if (isSyncingHistory.current) return;
      const { userId } = data; // User who performed the action

      if (userId !== socket.id) {
        const action = { type: "text", data: data, userId };
        history.current = history.current.slice(0, historyPointer.current + 1);
        history.current.push(action);
        historyPointer.current = history.current.length - 1;
        redrawCanvasFromHistory();
        setCanUndo(true);
        setCanRedo(false);
      }
    });

    // Listener for clearCanvas events
    socket.on("clearCanvas", (userId) => {
      // Clear event can also send userId if needed
      if (isSyncingHistory.current) return;

      const action = { type: "clear", data: {}, userId }; // Store userId who initiated clear
      history.current = history.current.slice(0, historyPointer.current + 1);
      history.current.push(action);
      historyPointer.current = history.current.length - 1;
      redrawCanvasFromHistory();
      setCanUndo(true);
      setCanRedo(false);
    });

    // Clean up Socket.IO listeners on unmount
    return () => {
      socket.off("drawing");
      socket.off("text");
      socket.off("clearCanvas");
    };
  }, [socket, redrawCanvasFromHistory, drawAction]);

  // --- Mouse Event Handlers for Drawing ---
  const startDrawing = useCallback(
    ({ nativeEvent }) => {
      setTextInput((prev) => ({ ...prev, active: false })); // Deactivate text input if clicking elsewhere
      if (activeTool === "text") {
        setTextInput({
          active: true,
          x: nativeEvent.offsetX,
          y: nativeEvent.offsetY,
          value: "",
        });
        return;
      }
      setIsDrawing(true);
      contextRef.current.moveTo(nativeEvent.offsetX, nativeEvent.offsetY);
    },
    [activeTool]
  );

  const draw = useCallback(
    ({ nativeEvent }) => {
      if (!isDrawing || activeTool === "text" || isSyncingHistory.current) {
        return;
      }

      const { offsetX, offsetY } = nativeEvent;
      const currentPoint = { x: offsetX, y: offsetY };
      const prevPoint = {
        x: nativeEvent.movementX ? offsetX - nativeEvent.movementX : offsetX,
        y: nativeEvent.movementY ? offsetY - nativeEvent.movementY : offsetY,
      };

      const color = activeTool === "eraser" ? "black" : drawingColor;
      const width = activeTool === "eraser" ? lineWidth * 2 : lineWidth;

      const actionData = {
        prevPoint,
        currentPoint,
        color,
        lineWidth: width,
        toolType: activeTool,
      };

      // Perform local draw
      drawLine(
        contextRef.current,
        prevPoint.x,
        prevPoint.y,
        currentPoint.x,
        currentPoint.y,
        color,
        width,
        activeTool
      );

      // Add action to history (for Undo/Redo and Save)
      // Truncate redo history (anything after current pointer is discarded)
      history.current = history.current.slice(0, historyPointer.current + 1);
      history.current.push({
        type: "line",
        data: actionData,
        userId: currentUserId,
      }); // Store MongoDB _id
      historyPointer.current = history.current.length - 1;
      setCanUndo(true);
      setCanRedo(false);

      // Emit drawing data to the server (use socket.id for real-time sender tracking)
      if (socket && whiteboardId) {
        socket.emit("drawing", {
          whiteboardId,
          ...actionData,
          userId: socket.id,
        });
      }
    },
    [
      isDrawing,
      socket,
      whiteboardId,
      drawingColor,
      lineWidth,
      activeTool,
      drawLine,
      currentUserId,
    ]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (contextRef.current && activeTool !== "text") {
      contextRef.current.closePath();
    }
  }, [activeTool]);

  // --- Text Tool Handlers ---
  const handleTextInputChange = (e) => {
    setTextInput((prev) => ({ ...prev, value: e.target.value }));
  };

  const handleTextInputBlur = () => {
    if (textInput.value.trim() && contextRef.current) {
      const textActionData = {
        x: textInput.x,
        y: textInput.y,
        text: textInput.value,
        color: drawingColor,
        fontSize: 20,
        fontFamily: "Arial",
      };

      // Perform local draw
      drawText(
        contextRef.current,
        textActionData.x,
        textActionData.y,
        textActionData.text,
        textActionData.color,
        textActionData.fontSize,
        textActionData.fontFamily
      );

      // Add to history
      history.current = history.current.slice(0, historyPointer.current + 1);
      history.current.push({
        type: "text",
        data: textActionData,
        userId: currentUserId,
      }); // Store MongoDB _id
      historyPointer.current = history.current.length - 1;
      setCanUndo(true);
      setCanRedo(false);

      // Emit text data to server
      if (socket && whiteboardId) {
        socket.emit("text", {
          whiteboardId,
          ...textActionData,
          userId: socket.id,
        }); // Use socket.id for real-time sender tracking
      }
    }
    setTextInput({ active: false, x: 0, y: 0, value: "" });
  };

  // --- Canvas Clear Handler ---
  const handleClearCanvas = useCallback(() => {
    clearCanvasLocal(); // Clear locally
    const action = { type: "clear", data: {}, userId: currentUserId }; // Clear action with MongoDB _id

    // Add clear action to history
    history.current = history.current.slice(0, historyPointer.current + 1);
    history.current.push(action);
    historyPointer.current = history.current.length - 1;
    setCanUndo(true);
    setCanRedo(false);

    // Emit clear event to server
    if (socket && whiteboardId) {
      socket.emit("clearCanvas", whiteboardId, currentUserId); // Pass userId for broadcast logging if desired
    }
  }, [socket, whiteboardId, clearCanvasLocal, currentUserId]);

  // --- Undo/Redo Handlers ---
  const handleUndo = useCallback(() => {
    if (historyPointer.current > -1) {
      historyPointer.current -= 1;
      redrawCanvasFromHistory(); // Redraw from history
      setCanRedo(true); // Can now redo
      if (historyPointer.current === -1) {
        setCanUndo(false); // Cannot undo further
      }
    }
  }, [redrawCanvasFromHistory]);

  const handleRedo = useCallback(() => {
    if (historyPointer.current < history.current.length - 1) {
      historyPointer.current += 1;
      redrawCanvasFromHistory(); // Redraw from history
      setCanUndo(true); // Can now undo
      if (historyPointer.current === history.current.length - 1) {
        setCanRedo(false); // Cannot redo further
      }
    }
  }, [redrawCanvasFromHistory]);

  // --- Save Handler ---
  const handleSaveDrawing = async () => {
    if (!whiteboardId || !socket) return;
    try {
      // Send the current full history (up to pointer) to the backend
      const response = await api.put(`/whiteboards/${whiteboardId}/drawing`, {
        drawingHistory: history.current.slice(0, historyPointer.current + 1),
      });
      if (response.data.success) {
        alert("Drawing saved successfully!");
      } else {
        alert(
          "Failed to save drawing: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Error saving drawing:", err);
      alert(
        "Error saving drawing. Check console and ensure backend is running."
      );
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Drawing Toolbar */}
      <div className="bg-gray-800 p-2 flex flex-wrap items-center justify-center space-x-2 space-y-2 md:space-y-0 border-b border-gray-700">
        {/* Tool Selection */}
        <button
          onClick={() => setActiveTool("pen")}
          className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTool === "pen"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}>
          Pen
        </button>
        <button
          onClick={() => setActiveTool("eraser")}
          className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTool === "eraser"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}>
          Eraser
        </button>
        <button
          onClick={() => setActiveTool("text")}
          className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTool === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}>
          Text
        </button>

        {/* Color Picker (only for pen) */}
        {activeTool === "pen" && (
          <>
            <label htmlFor="color-picker" className="text-gray-300 ml-4">
              Color:
            </label>
            <input
              type="color"
              id="color-picker"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="h-8 w-8 rounded-md cursor-pointer"
            />
          </>
        )}

        {/* Line Width Slider (for pen and eraser) */}
        {(activeTool === "pen" || activeTool === "eraser") && (
          <>
            <label htmlFor="line-width" className="text-gray-300 ml-4">
              Width:
            </label>
            <input
              type="range"
              id="line-width"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
            <span className="text-gray-300">{lineWidth}px</span>
          </>
        )}

        {/* Undo / Redo / Clear / Save Buttons */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            !canUndo
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}>
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`py-1 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            !canRedo
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}>
          Redo
        </button>
        <button
          onClick={handleClearCanvas}
          className="py-1 px-3 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200">
          Clear
        </button>
        <button
          onClick={handleSaveDrawing}
          className="py-1 px-3 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors duration-200">
          Save
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-grow relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="block w-full h-full cursor-crosshair"
        />

        {/* Text Input Overlay */}
        {activeTool === "text" && textInput.active && (
          <input
            type="text"
            value={textInput.value}
            onChange={handleTextInputChange}
            onBlur={handleTextInputBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextInputBlur();
            }}
            autoFocus
            style={{
              position: "absolute",
              left: textInput.x,
              top: textInput.y,
              backgroundColor: "rgba(0,0,0,0.7)",
              color: drawingColor,
              border: "1px solid #00BFFF",
              padding: "4px",
              zIndex: 10,
              fontSize: "20px",
              fontFamily: "Arial",
              outline: "none",
            }}
            className="rounded-sm"
          />
        )}
      </div>
    </div>
  );
};

export default WhiteboardCanvas;
