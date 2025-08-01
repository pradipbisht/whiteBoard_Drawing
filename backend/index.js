const app = require("./app");
const connectDB = require("./config/db");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on("joinWhiteboard", (whiteboardId) => {
    socket.join(whiteboardId);
    console.log(`Socket ${socket.id} joined whiteboard: ${whiteboardId}`);
  });

  // Modified 'drawing' event to include toolType
  socket.on("drawing", (data) => {
    // data should contain: { whiteboardId, prevPoint, currentPoint, color, lineWidth, toolType }
    socket.to(data.whiteboardId).emit("drawing", data);
  });

  // NEW EVENT: 'text'
  socket.on("text", (data) => {
    // data should contain: { whiteboardId, x, y, text, color, fontSize, fontFamily }
    socket.to(data.whiteboardId).emit("text", data);
  });

  socket.on("clearCanvas", (whiteboardId) => {
    socket.to(whiteboardId).emit("clearCanvas");
  });

  socket.on("disconnect", () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
