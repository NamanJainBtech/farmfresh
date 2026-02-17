const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const buildCartResponse = (user) => {
  const items = (user.cart || [])
    .filter((entry) => entry.product)
    .map((entry) => {
      const price = Number(entry.product.price) || 0;
      const quantity = Number(entry.quantity) || 0;
      return {
        product: {
          _id: entry.product._id,
          name: entry.product.name,
          price,
          image: entry.product.image || "",
          category: entry.product.category || "",
          stock: Number(entry.product.stock) || 0,
        },
        quantity,
        subtotal: price * quantity,
      };
    });

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, totalAmount };
};

router.get("/cart", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(buildCartResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQty = Math.max(1, Number(quantity) || 1);

    if (!productId) {
      return res.status(400).json({ message: "Product is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if ((Number(product.stock) || 0) < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.cart.find((entry) => String(entry.product) === String(productId));
    if (existing) {
      existing.quantity = Math.min((Number(product.stock) || 0), existing.quantity + parsedQty);
    } else {
      user.cart.push({
        product: productId,
        quantity: Math.min((Number(product.stock) || 0), parsedQty),
      });
    }

    await user.save();
    const updatedUser = await User.findById(req.user.id).populate("cart.product");
    res.json(buildCartResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

router.put("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!Number.isFinite(quantity)) {
      return res.status(400).json({ message: "Quantity must be a number" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cart.find((entry) => String(entry.product) === String(productId));
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (quantity <= 0) {
      user.cart = user.cart.filter((entry) => String(entry.product) !== String(productId));
      await user.save();
      const updatedUser = await User.findById(req.user.id).populate("cart.product");
      return res.json(buildCartResponse(updatedUser));
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    item.quantity = Math.min(Math.max(1, quantity), Number(product.stock) || 1);
    await user.save();

    const updatedUser = await User.findById(req.user.id).populate("cart.product");
    res.json(buildCartResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

router.delete("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart = user.cart.filter((entry) => String(entry.product) !== String(productId));
    await user.save();

    const updatedUser = await User.findById(req.user.id).populate("cart.product");
    res.json(buildCartResponse(updatedUser));
  } catch (error) {
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

module.exports = router;
