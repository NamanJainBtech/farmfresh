const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, default: 1, min: 1 }
    }
  ],
  addresses: [
    {
      line1: String,
      city: String,
      state: String,
      zip: String,
      country: String
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
