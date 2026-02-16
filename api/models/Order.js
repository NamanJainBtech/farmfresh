const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: Array,
  totalAmount: Number,
  address: String,
  status: { type: String, default: "Processing" },
  paymentMethod: { type: String, default: "COD" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
