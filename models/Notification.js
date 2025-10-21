const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'wishlist', 'system', 'stock'],
    default: 'system'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  reference_id: Schema.Types.ObjectId,
  reference_model: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);