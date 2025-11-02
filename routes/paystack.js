const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// Paystack webhook handler
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    // Validate event
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
      
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }
    
    const event = req.body;
    
    // Handle successful charge
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const status = data.status;
      
      // Find order with this reference
      const order = await Order.findOne({ payment_reference: reference });
      
      if (!order) {
        return res.status(404).send('Order not found');
      }
      
      // Update order payment status
      if (status === 'success') {
        order.payment_status = 'paid';
        order.status = 'confirmed';
        await order.save();
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Paystack webhook error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;