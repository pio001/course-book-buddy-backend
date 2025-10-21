const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Book = require('../models/Book');

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find({ is_active: true })
      .populate('courses.course', 'code title');
    res.json(books);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('courses.course', 'code title department');
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.json(book);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

// Create a new book (admin/inventory manager only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin or inventory manager
    if (req.user.role !== 'admin' && req.user.role !== 'inventory_manager') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const newBook = new Book(req.body);
    const book = await newBook.save();
    
    res.json(book);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a book (admin/inventory manager only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or inventory manager
    if (req.user.role !== 'admin' && req.user.role !== 'inventory_manager') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true }
    );
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.json(book);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

// Delete a book (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    // Soft delete by setting is_active to false
    book.is_active = false;
    book.updated_at = Date.now();
    await book.save();
    
    res.json({ msg: 'Book removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;