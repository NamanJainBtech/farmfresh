const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

router.use(authMiddleware, adminOnly);

router.get("/products", async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category && category.toLowerCase() !== "all") {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, category, price, description, image, stock } = req.body;
    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }

    const product = await Product.create({
      name,
      category,
      price: Number(price) || 0,
      description: description || "",
      image: req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        : image || "",
      stock: Number(stock) || 0
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to add product" });
  }
});

router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const updatePayload = {
      ...req.body,
    };

    if (updatePayload.price !== undefined) {
      updatePayload.price = Number(updatePayload.price) || 0;
    }

    if (updatePayload.stock !== undefined) {
      updatePayload.stock = Number(updatePayload.stock) || 0;
    }

    if (req.file) {
      updatePayload.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await Category.create({ name, description: description || "" });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Failed to update category" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Processing", "Out for Delivery", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status" });
  }
});

router.get("/reports/sales", async (req, res) => {
  try {
    const orders = await Order.find().lean();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const statusCounter = {};
    const dayCounter = {};
    const productCounter = {};

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayCounter[key] = 0;
    }

    const getOrderAmount = (order) => {
      if (typeof order.totalAmount === "number" && !Number.isNaN(order.totalAmount)) {
        return order.totalAmount;
      }

      if (!Array.isArray(order.items)) return 0;
      return order.items.reduce((sum, item) => {
        const qty = Number(item?.quantity || 0);
        const price = Number(item?.price ?? item?.unitPrice ?? 0);
        return sum + qty * price;
      }, 0);
    };

    let totalOrders = 0;
    let totalRevenue = 0;
    let deliveredRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;

    orders.forEach((order) => {
      totalOrders += 1;
      const orderAmount = getOrderAmount(order);
      totalRevenue += orderAmount;

      const status = order.status || "Unknown";
      statusCounter[status] = (statusCounter[status] || 0) + 1;
      if (status === "Delivered") {
        deliveredRevenue += orderAmount;
      }

      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        if (createdAt >= startOfToday) {
          todayRevenue += orderAmount;
        }

        if (createdAt >= startOfMonth) {
          monthRevenue += orderAmount;
        }

        const dayKey = createdAt.toISOString().slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(dayCounter, dayKey)) {
          dayCounter[dayKey] += orderAmount;
        }
      }

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const productName = item?.name || item?.productName || "Unknown Product";
          const qty = Number(item?.quantity || 0);
          productCounter[productName] = (productCounter[productName] || 0) + qty;
        });
      }
    });

    const statusBreakdown = Object.entries(statusCounter).map(([status, count]) => ({
      _id: status,
      count,
    }));

    const dailySales = Object.entries(dayCounter).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    const topProducts = Object.entries(productCounter)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    res.json({
      totalOrders,
      totalRevenue,
      deliveredRevenue,
      todayRevenue,
      monthRevenue,
      statusBreakdown,
      dailySales,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate sales report" });
  }
});

module.exports = router;
