// middleware/questApiAuth.js
require('dotenv').config();

const QUEST_API_KEY = process.env.QUEST_API_KEY;

module.exports = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== QUEST_API_KEY) {
      return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during API key validation.' });
  }
};