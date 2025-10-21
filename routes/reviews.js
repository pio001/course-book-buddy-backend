const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Book = require('../models/Book');

// Get reviews for a book + summary
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ book: bookId })
      .populate('user', 'first_name last_name');

    const summary = reviews.length
      ? {
          count: reviews.length,
          average:
            Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10,
        }
      : { count: 0, average: 0 };

    res.json({ reviews, summary });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create or update a review for a book
router.post('/', auth, async (req, res) => {
  try {
    const { book_id, rating, comment = '' } = req.body;

    const book = await Book.findById(book_id);
    if (!book) return res.status(400).json({ msg: 'Book not found' });
    if (rating < 1 || rating > 5) return res.status(400).json({ msg: 'Rating must be 1-5' });

    const review = await Review.findOneAndUpdate(
      { user: req.user.id, book: book_id },
      { $set: { rating, comment, updated_at: Date.now() } },
      { upsert: true, new: true }
    );

    const populated = await Review.findById(review._id).populate('user', 'first_name last_name');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;