const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');

// Get current user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user.id })
      .populate('book', 'title author price cover_image_url stock_quantity');
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add to wishlist
router.post('/', auth, async (req, res) => {
  try {
    const { book_id, notify_when_available = false } = req.body;

    const book = await Book.findById(book_id);
    if (!book) return res.status(400).json({ msg: 'Book not found' });

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { user: req.user.id, book: book_id },
      { $set: { notify_when_available } },
      { upsert: true, new: true }
    );

    const populated = await Wishlist.findById(wishlistItem._id)
      .populate('book', 'title author price cover_image_url stock_quantity');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    // Handle duplicate gracefully
    if (err.code === 11000) return res.status(400).json({ msg: 'Already in wishlist' });
    res.status(500).send('Server error');
  }
});

// Remove from wishlist
router.delete('/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    await Wishlist.findOneAndDelete({ user: req.user.id, book: bookId });
    res.json({ msg: 'Removed from wishlist' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;