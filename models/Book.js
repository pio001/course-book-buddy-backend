const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    index: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  description: String,
  cover_image_url: String,
  price: {
    type: Number,
    required: true
  },
  stock_quantity: {
    type: Number,
    default: 0
  },
  low_stock_threshold: {
    type: Number,
    default: 10
  },
  publisher: String,
  publication_year: Number,
  edition: String,
  category: {
    type: String,
    index: true
  },
  is_ebook: {
    type: Boolean,
    default: false
  },
  ebook_url: String,
  is_active: {
    type: Boolean,
    default: true
  },
  courses: [{
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    is_required: {
      type: Boolean,
      default: true
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', BookSchema);