import express from "express";
const router = express.Router();
import jwt from 'jsonwebtoken';
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const otpStore = {}; // In production use Redis

// Step 1: Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min
  
  // For demo: just return OTP (in real: send via Twilio SMS)
  // await client.messages.create({ body: `Your BankGuard OTP: ${otp}`, from: process.env.TWILIO_PHONE, to: `+91${phone}` });
  
  console.log(`OTP for ${phone}: ${otp}`); // Remove in production
  res.json({ success: true, message: 'OTP sent!', otp }); // Remove otp in production
});

// Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const stored = otpStore[phone];
  
  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  
  delete otpStore[phone];
  const token = jwt.sign({ phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ success: true, token, phone });
});

export default router;