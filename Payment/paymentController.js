const Razorpay = require("razorpay");
const crypto = require("crypto");
const utility = require('./utlity');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = (req, res) => {
  const amountInRupees = req.body.payload?.amount?.amount;  // nested amount

  if (!amountInRupees || isNaN(amountInRupees)) {
    return res.status(400).send({
      status: 400,
      data: { message: "Invalid or missing amount in request payload" }
    });
  }

  const amountInPaise = utility.rupeesToPaise(amountInRupees);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
    notes: req.body.payload.notes || {}
  };

  instance.orders.create(options, (err, order) => {
    if (err) return res.status(500).send({ status: 500, data: err });
    return res.status(200).send({ status: 200, data: order });
  });
};


exports.validatePayment = (req, res) => {
  const { razorpay_signature, razorpay_payment_id, original_order_id } = req.body.payload;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(original_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const isPaymentVerified = generated_signature === razorpay_signature;

  res.status(isPaymentVerified ? 200 : 400).send({
    data: { isPaymentVerified }
  });
};
