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


// Place order
const Order = require("../models/Order");
router.post("/order", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found" });
    const { address, slot, paymentMethod } = req.body;
    if (!address || !slot) return res.status(400).json({ message: "Address and slot required" });
    if (!user.cart.length) return res.status(400).json({ message: "Cart is empty" });
    const selectedAddress = user.addresses.find(a => String(a._id) === String(address));
    if (!selectedAddress) return res.status(400).json({ message: "Invalid address" });
    const items = user.cart.map(entry => ({
      product: entry.product._id,
      name: entry.product.name,
      price: entry.product.price,
      quantity: entry.quantity,
      subtotal: entry.product.price * entry.quantity
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const order = await Order.create({
      user: user._id,
      items,
      totalAmount,
      address: `${selectedAddress.line1}, ${selectedAddress.city}`,
      status: "Processing",
      paymentMethod: paymentMethod || "COD"
    });
    user.cart = [];
    await user.save();
    res.json({ success: true, orderId: order._id });
  } catch (error) {
    res.status(500).json({ message: "Order failed" });
  }
});

// Get user addresses
router.get("/addresses", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.addresses || []);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
});

// Add address
router.post("/addresses", async (req, res) => {
  try {
    const { line1, city, state, zip, country } = req.body;
    if (!line1 || !city) return res.status(400).json({ message: "Address incomplete" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.addresses.push({ line1, city, state, zip, country });
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to add address" });
  }
});

// Remove address
router.delete("/addresses/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const existingCount = user.addresses.length;
    user.addresses = user.addresses.filter((address) => String(address._id) !== String(addressId));
    if (user.addresses.length === existingCount) {
      return res.status(404).json({ message: "Address not found" });
    }
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address" });
  }
});

// Delivery slots (static for demo)
router.get("/delivery-slots", (req, res) => {
  res.json([
    { id: "slot-6-9", label: "6:00 AM - 9:00 AM" },
    { id: "slot-9-12", label: "9:00 AM - 12:00 PM" },
    { id: "slot-12-17", label: "12:00 PM - 5:00 PM" },
  ]);
});

// Order history
router.get("/order/history", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order history" });
  }
});

module.exports = router;
