const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
