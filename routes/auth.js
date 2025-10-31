// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login というURLでログイン処理を実行
router.post('/login', authController.login);

module.exports = router;