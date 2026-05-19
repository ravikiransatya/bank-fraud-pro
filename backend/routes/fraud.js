import express from "express";

const router = express.Router();  // ✅ CREATE router

// Example route
router.get("/", (req, res) => {
  res.json({ message: "Fraud route working" });
});

export default router;  // ✅ EXPORT