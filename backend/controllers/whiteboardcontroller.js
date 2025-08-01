const Whiteboard = require("../models/whiteboardmodel.js");
const User = require("../models/userModel.js");

// @desc    Create a new whiteboard
// @route   POST /api/whiteboards
// @access  Private
const createWhiteboard = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please add a name for the whiteboard",
      });
  }

  try {
    const newWhiteboard = await Whiteboard.create({
      name,
      owner: req.user._id,
      collaborators: [req.user._id],
      drawingHistory: [], // Initialize drawingHistory as an empty array
    });

    res.status(201).json({
      success: true,
      message: "Whiteboard created successfully",
      whiteboard: newWhiteboard,
    });
  } catch (error) {
    console.error("Error creating whiteboard:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error creating whiteboard",
        error: error.message,
      });
  }
};

// @desc    Get all whiteboards for the authenticated user (owned or collaborated on)
// @route   GET /api/whiteboards
// @access  Private
const getWhiteboards = async (req, res) => {
  try {
    const whiteboards = await Whiteboard.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    }).populate("owner", "username email");

    res.status(200).json({
      success: true,
      message: "Whiteboards fetched successfully",
      whiteboards,
    });
  } catch (error) {
    console.error("Error fetching whiteboards:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching whiteboards",
        error: error.message,
      });
  }
};

// @desc    Get a single whiteboard by ID
// @route   GET /api/whiteboards/:id
// @access  Private
const getWhiteboardById = async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id)
      .populate("owner", "username email")
      .populate("collaborators", "username email");

    if (!whiteboard) {
      return res
        .status(404)
        .json({ success: false, message: "Whiteboard not found" });
    }

    const isOwner = whiteboard.owner._id.toString() === req.user._id.toString();
    const isCollaborator = whiteboard.collaborators.some(
      (collab) => collab._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to access this whiteboard",
        });
    }

    res.status(200).json({
      success: true,
      message: "Whiteboard fetched successfully",
      whiteboard: whiteboard, // drawingHistory will be included in this object
    });
  } catch (error) {
    console.error("Error fetching whiteboard by ID:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid whiteboard ID" });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching whiteboard",
        error: error.message,
      });
  }
};

// @desc    Save (update) the drawing history of a whiteboard
// @route   PUT /api/whiteboards/:id/drawing
// @access  Private
const saveWhiteboardDrawing = async (req, res) => {
  const { id } = req.params; // Whiteboard ID
  const { drawingHistory } = req.body; // Array of drawing actions from frontend

  // Basic validation for drawingHistory
  if (!Array.isArray(drawingHistory)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid drawing history format" });
  }

  try {
    const whiteboard = await Whiteboard.findById(id);

    if (!whiteboard) {
      return res
        .status(404)
        .json({ success: false, message: "Whiteboard not found" });
    }

    // Ensure the authenticated user is authorized to save (owner or collaborator)
    const isOwner = whiteboard.owner._id.toString() === req.user._id.toString();
    const isCollaborator = whiteboard.collaborators.some(
      (collab) => collab._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to save this whiteboard",
        });
    }

    // Update the drawingHistory
    whiteboard.drawingHistory = drawingHistory;
    await whiteboard.save(); // Save the updated whiteboard document

    res.status(200).json({
      success: true,
      message: "Whiteboard drawing saved successfully",
      whiteboardId: whiteboard._id,
    });
  } catch (error) {
    console.error("Error saving whiteboard drawing:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid whiteboard ID" });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Server error saving drawing",
        error: error.message,
      });
  }
};

module.exports = {
  createWhiteboard,
  getWhiteboards,
  getWhiteboardById,
  saveWhiteboardDrawing, // Export the new function
};
