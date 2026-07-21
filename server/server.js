const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
dotenv.config({ path: path.resolve(__dirname, '.env') });
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
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PrepAgent API is running' });
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui { background: #1a1a2e } .swagger-ui .info .title { color: #e0e0e0 } .swagger-ui .opblock-tag { color: #e0e0e0 } .swagger-ui .opblock .opblock-summary-description { color: #b0b0b0 }',
  customSiteTitle: 'PrepAgent API Docs',
}));
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