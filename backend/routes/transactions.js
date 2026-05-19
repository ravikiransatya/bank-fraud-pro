import express from "express";
const router = express.Router();
import axios from "axios";

// Mock transaction data (replace with real DB)
const generateTransactions = (phone) => [
  { id: 1, type: 'UPI', amount: 500, merchant: 'Swiggy', time: '2024-01-15 14:30', location: 'Vadodara', status: 'success', fraud_score: 5 },
  { id: 2, type: 'ATM', amount: 10000, merchant: 'SBI ATM Alkapuri', time: '2024-01-15 03:15', location: 'Mumbai', status: 'flagged', fraud_score: 87 },
  { id: 3, type: 'NEFT', amount: 50000, merchant: 'HDFC Transfer', time: '2024-01-14 11:00', location: 'Online', status: 'success', fraud_score: 12 },
  { id: 4, type: 'Card', amount: 2500, merchant: 'Amazon', time: '2024-01-14 19:45', location: 'Online', status: 'success', fraud_score: 8 },
  { id: 5, type: 'UPI', amount: 150000, merchant: 'Unknown Merchant', time: '2024-01-13 02:00', location: 'International', status: 'blocked', fraud_score: 96 },
];

router.get('/', (req, res) => {
  const transactions = generateTransactions(req.query.phone);
  res.json(transactions);
});

// Check single transaction with ML
router.post('/check', async (req, res) => {
  try {
    const mlResponse = await axios.post('http://localhost:5001/predict', req.body);
    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: 'ML service unavailable' });
  }
});

export default router;