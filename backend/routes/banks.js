import express from "express";
const router = express.Router();

// Simulates banks linked to phone number (like NPCI UPI)
router.get('/linked', (req, res) => {
  const { phone } = req.query;
  
  const linkedBanks = [
    { id: 1, name: 'State Bank of India', shortName: 'SBI', accountNo: '****4521', balance: '₹45,230', color: '#1a237e', logo: 'SBI', type: 'Savings', upiId: `${phone}@sbi` },
    { id: 2, name: 'HDFC Bank', shortName: 'HDFC', accountNo: '****8834', balance: '₹1,23,450', color: '#e53935', logo: 'HDFC', type: 'Current', upiId: `${phone}@hdfcbank` },
    { id: 3, name: 'ICICI Bank', shortName: 'ICICI', accountNo: '****2210', balance: '₹67,800', color: '#f57c00', logo: 'ICICI', type: 'Savings', upiId: `${phone}@icici` },
  ];
  
  res.json(linkedBanks);
});

export default router;