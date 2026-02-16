const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");

const router = express.Router();

router.get("/products", async (req, res) => {
  try {
    const { search, categories } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (categories) {
      const categoryList = String(categories)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (categoryList.length > 0) {
        query.category = { $in: categoryList };
      }
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
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

module.exports = router;
