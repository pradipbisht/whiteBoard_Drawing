const mongoose = require("mongoose");

// Define a schema for individual drawing actions
const drawingActionSchema = mongoose.Schema({
  type: {
    // 'line', 'text', 'clear'
    type: String,
    required: true,
    enum: ["line", "text", "clear"], // Ensure types are consistent
  },
  data: {
    // Stores specific data for each action type
    type: mongoose.Schema.Types.Mixed, // Use Mixed type to allow flexible data structures
    required: true,
  },
  timestamp: {
    // When the action occurred
    type: Date,
    default: Date.now,
  },
  userId: {
    // Who performed the action (optional, but good for auditing)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Not strictly required for now, but good to have
  },
});

const whiteboardSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a whiteboard name"],
      trim: true,
      minlength: 3,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // NEW FIELD: Array to store the history of drawing actions
    drawingHistory: [drawingActionSchema], // Array of embedded drawingActionSchema documents
  },
  {
    timestamps: true,
  }
);

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

module.exports = Whiteboard;
