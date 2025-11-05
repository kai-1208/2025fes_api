// index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
require('dotenv').config(); // .envファイルの内容を読み込む

// ルートファイルをインポート
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// corsの設定
const allowedOrigins = [
  'https://pinattutaro.github.io',
  'https://kai-1208.github.io',
  'http://127.0.0.1:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    // originがない場合（curlなどからの直接アクセス）も許可
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200
};

// ミドルウェアの設定
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// ルーティングの設定
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// エラーハンドリング
app.use(errorHandler);

// データベース接続
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // サーバーを起動
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });