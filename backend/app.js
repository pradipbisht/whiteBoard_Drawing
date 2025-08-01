const express = require("express");
const cors = require("cors");
const app = express();
const userRoutes = require("./routes/userRoutes.js");
const whiteboardRoutes = require("./routes/whiteboardRoute.js");

// Middleware
// express.json() parses incoming JSON requests and puts the parsed data in req.body
app.use(express.json());
// cors() enables Cross-Origin Resource Sharing for all origins, allowing our frontend to connect
app.use(cors());

// Define a simple root route to verify the API is running
app.get("/", (req, res) => {
  res.send("API is running...");
});

// We will define and import our specific API routes (e.g., authentication, whiteboards) here in later steps.
app.use("/api/auth", userRoutes);
app.use("/api/whiteboards", whiteboardRoutes);

module.exports = app;
