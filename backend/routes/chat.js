import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY || "dummy_key",
    });

    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages,
      max_tokens: 300,
    });

    res.json(response);
  } catch (err) {
    console.error("Groq Chat Error:", err);
    res.status(500).json({ error: "API error" });
  }
});

export default router;