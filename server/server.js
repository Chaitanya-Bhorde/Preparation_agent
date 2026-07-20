const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
connectDB();
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/ats', require('./routes/ats'));
app.use('/api/analytics', require('./routes/analytics'));
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PrepAgent API is running' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PrepAgent server running on port ${PORT}`);
});
module.exports = app;