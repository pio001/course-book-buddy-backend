const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  matric_number: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  level: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zip: String
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'cashier', 'inventory_manager', 'delivery_agent'],
    default: 'student'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);