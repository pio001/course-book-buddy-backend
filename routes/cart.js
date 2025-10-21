const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Book = require('../models/Book');

// Get current user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.book', 'title author price cover_image_url stock_quantity');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    res.json(cart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add item to cart
router.post('/', auth, async (req, res) => {
  try {
    const { book_id, quantity = 1 } = req.body;
    const book = await Book.findById(book_id);
    if (!book) return res.status(400).json({ msg: 'Book not found' });
    if (book.stock_quantity < quantity) return res.status(400).json({ msg: `Only ${book.stock_quantity} left in stock` });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const idx = cart.items.findIndex(i => i.book.toString() === book_id);
    if (idx > -1) {
      const newQty = cart.items[idx].quantity + quantity;
      if (newQty <= 0) {
        cart.items.splice(idx, 1);
      } else {
        if (book.stock_quantity < newQty) return res.status(400).json({ msg: `Only ${book.stock_quantity} left in stock` });
        cart.items[idx].quantity = newQty;
      }
    } else {
      cart.items.push({ book: book_id, quantity });
    }
    cart.updated_at = Date.now();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.book', 'title author price cover_image_url stock_quantity');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update quantity for a book in cart
router.put('/:bookId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { bookId } = req.params;

    if (quantity < 0) return res.status(400).json({ msg: 'Quantity must be >= 0' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    const book = await Book.findById(bookId);
    if (!book) return res.status(400).json({ msg: 'Book not found' });
    if (quantity > 0 && book.stock_quantity < quantity) return res.status(400).json({ msg: `Only ${book.stock_quantity} left in stock` });

    const idx = cart.items.findIndex(i => i.book.toString() === bookId);
    if (idx === -1) return res.status(404).json({ msg: 'Item not in cart' });

    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    cart.updated_at = Date.now();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.book', 'title author price cover_image_url stock_quantity');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Remove item from cart
router.delete('/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    cart.items = cart.items.filter(i => i.book.toString() !== bookId);
    cart.updated_at = Date.now();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.book', 'title author price cover_image_url stock_quantity');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    cart.items = [];
    cart.updated_at = Date.now();
    await cart.save();

    res.json({ msg: 'Cart cleared' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;