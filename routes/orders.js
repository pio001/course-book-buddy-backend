const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Book = require('../models/Book');
const Delivery = require('../models/Delivery');

// Generate order number
const generateOrderNumber = () => {
  const prefix = 'UBS';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Get all orders (admin/cashier only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin or cashier
    if (req.user.role !== 'admin' && req.user.role !== 'cashier') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const orders = await Order.find()
      .populate('user', 'first_name last_name email')
      .sort({ created_at: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user's orders
router.get('/me', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ created_at: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'first_name last_name email')
      .populate('items.book', 'title author cover_image_url');
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Check if user is authorized to view this order
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'cashier' &&
      req.user.role !== 'delivery_agent'
    ) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // If user is delivery agent, check if they are assigned to this order
    if (req.user.role === 'delivery_agent') {
      const delivery = await Delivery.findOne({ 
        order: order._id,
        delivery_agent: req.user.id
      });
      
      if (!delivery) {
        return res.status(403).json({ msg: 'Not authorized' });
      }
    }
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, delivery_type, delivery_address, payment_method } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ msg: 'No items in order' });
    }
    
    // Calculate total amount and check stock
    let total_amount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const book = await Book.findById(item.book_id);
      
      if (!book) {
        return res.status(400).json({ msg: `Book with ID ${item.book_id} not found` });
      }
      
      if (book.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          msg: `Not enough stock for "${book.title}". Available: ${book.stock_quantity}` 
        });
      }
      
      const subtotal = book.price * item.quantity;
      total_amount += subtotal;
      
      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        unit_price: book.price,
        subtotal
      });
    }
    
    // Add delivery fee if applicable
    let delivery_fee = 0;
    if (delivery_type === 'delivery') {
      delivery_fee = 500; // Example delivery fee
      total_amount += delivery_fee;
    }
    
    // Create new order
    const newOrder = new Order({
      order_number: generateOrderNumber(),
      user: req.user.id,
      items: orderItems,
      total_amount,
      delivery_type,
      delivery_fee,
      payment_method,
      payment_status: 'pending'
    });
    
    // Add delivery address if delivery type is 'delivery'
    if (delivery_type === 'delivery' && delivery_address) {
      newOrder.delivery_address = delivery_address;
    }
    
    const order = await newOrder.save();
    
    // Update book stock quantities
    for (const item of orderItems) {
      await Book.findByIdAndUpdate(
        item.book,
        { $inc: { stock_quantity: -item.quantity } }
      );
    }
    
    // Create delivery record if delivery type is 'delivery'
    if (delivery_type === 'delivery') {
      const newDelivery = new Delivery({
        order: order._id,
        status: 'pending'
      });
      
      await newDelivery.save();
    }
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update order status (admin/cashier only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Check if user is admin or cashier
    if (req.user.role !== 'admin' && req.user.role !== 'cashier') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // If cancelling an order, restore stock quantities
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(
          item.book,
          { $inc: { stock_quantity: item.quantity } }
        );
      }
    }
    
    order.status = status;
    order.updated_at = Date.now();
    
    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// Update payment status (admin/cashier only)
router.put('/:id/payment', auth, async (req, res) => {
  try {
    // Check if user is admin or cashier
    if (req.user.role !== 'admin' && req.user.role !== 'cashier') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { payment_status, payment_reference } = req.body;
    
    if (!['pending', 'paid', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({ msg: 'Invalid payment status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    order.payment_status = payment_status;
    if (payment_reference) {
      order.payment_reference = payment_reference;
    }
    order.updated_at = Date.now();
    
    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;