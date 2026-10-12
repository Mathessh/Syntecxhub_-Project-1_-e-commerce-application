const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Get all products (with search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, category, sort, minPrice, maxPrice, inStock } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'bestseller') sortOption = { salesCount: -1 };

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// GET /api/products/bestsellers - Get best selling products
router.get('/bestsellers', async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ salesCount: -1 })
      .limit(8);
    res.json(products);
  } catch (error) {
    console.error('Bestsellers error:', error);
    res.status(500).json({ message: 'Server error fetching best sellers' });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(products);
  } catch (error) {
    console.error('Featured error:', error);
    res.status(500).json({ message: 'Server error fetching featured products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// POST /api/products - Add product (admin only)
router.post('/', authenticate, authorizeAdmin, [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Valid price is required'),
  body('category').isIn(['Rice', 'Oil', 'Vegetables', 'Snacks', 'Beverages']).withMessage('Valid category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Server error adding product' });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// PATCH /api/products/:id/stock - Quick adjust stock (admin only)
router.patch('/:id/stock', authenticate,  authorizeAdmin, async (req, res) => {
  try {
    const { quantity, stock } = req.body;
    let update = {};

    if (stock !== undefined) {
      update.stock = Math.max(0, parseInt(stock));
    } else if (quantity !== undefined) {
      update = { $inc: { stock: parseInt(quantity) } };
    } else {
      return res.status(400).json({ message: 'Provide quantity to increment or absolute stock value' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Server error updating stock' });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;

