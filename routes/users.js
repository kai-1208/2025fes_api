// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const questApiAuth = require('../middleware/questApiAuth');

// GET /api/users/me はJWT認証
router.get('/me', authMiddleware, userController.getMe);

// PUT /api/users/me - 自分の名前を更新
router.put('/me', authMiddleware, userController.updateMyName);

// POST /api/users/update-flag はクエストAPIキー認証
router.post('/update-flag', questApiAuth, userController.updateFlag);

module.exports = router;