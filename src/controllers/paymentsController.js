const Razorpay = require('razorpay');
const crypto = require('crypto');
const { CREDIT_TO_PAISA_MAPPING } = require('../constants/paymentConstants');
const Users = require('../model/users');

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentsController = {
  // Step-2 from sequence diagram
  createOrder: async (request, response) => {
    try {
        const { credits } = request.body;

        if (!CREDIT_TO_PAISA_MAPPING[credits]) {
          return response.status(400).json({
            message: 'Invalid credit value'
          });
        }

        const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

        const order = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        });

        return response.json({ order: order });
      
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },

  // Step-8 from sequence diagram
  verifyOrder: async (request, response) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        credits
      } = request.body;

      const body = razorpay_order_id + '|' + razorpay_payment_id;

      const expectedSignature = crypto
        // Create unique digital fingerprint (HMAC) of the secret key.
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        // Feed both HMAC and body into hashing function.
        .update(body.toString())
        // Feed the hashed string into hexadecimal.
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return response.status(400).json({ message: 'Invalid transaction' });
      }

      const user = await Users.findById({ _id: request.user._id });
      user.credits += Number(credits);
      await user.save();

      return response.json({ user: user });

      
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = paymentsController;
