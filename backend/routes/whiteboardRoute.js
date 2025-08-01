const express = require("express");
const {
  createWhiteboard,
  getWhiteboards,
  getWhiteboardById,
  saveWhiteboardDrawing,
} = require("../controllers/whiteboardcontroller.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Routes that require authentication (`protect` middleware)
router
  .route("/")
  .post(protect, createWhiteboard) // POST to create a new whiteboard
  .get(protect, getWhiteboards); // GET all whiteboards for the user

router.route("/:id").get(protect, getWhiteboardById); // GET a specific whiteboard by ID

router.route("/:id/drawing").put(protect, saveWhiteboardDrawing);

module.exports = router;
