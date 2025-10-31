// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// このルートのすべてのAPIはapiKeyAuthミドルウェアによって保護される
router.use(apiKeyAuth);

// POST /api/admin/create-users というURLでユーザー一括作成処理を実行
router.post('/create-users', adminController.createUsers);

module.exports = router;