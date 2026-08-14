const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const { isJudge0Reachable } = require('./utils/judge0Coding');
let swaggerSpec = null;
try {
  swaggerSpec = require('./config/swagger');
} catch (swaggerError) {
  console.error('Swagger load failed:', swaggerError.message);
}
dotenv.config({ path: path.resolve(__dirname, '.env') });
connectDB();

// Auto-start Judge0 if not running (development only)
const { autoStart } = require('./utils/autoStartJudge0');
if (process.env.NODE_ENV !== 'production') {
  autoStart().catch(err => console.error('Auto-start error:', err));
}
const app = express();
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests and the explicitly listed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      // In development, allow any localhost origin/port so Vite running on a
      // non-default port (e.g. 5176 when 5173 is busy) is not CORS-blocked.
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/ats/analyze', apiRateLimiter);
app.use('/api/coding/run', apiRateLimiter);
app.use('/api/coding/submit', apiRateLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/ats', require('./routes/ats'));
app.use('/api/role-requirements', require('./routes/roleRequirements'));
app.use('/api/jd-match', require('./routes/jdMatch'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/mistakes', require('./routes/mistakes'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/readiness', require('./routes/readiness'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/coding-problems', require('./routes/codingProblems'));
app.use('/api/dsa', require('./routes/dsa'));
app.use('/api/interview-experiences', require('./routes/interviewExperiences'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/progress', require('./routes/progressExport'));
app.use('/api/mock-interview', require('./routes/mockInterview'));
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PrepAgent API is running' });
});
if (swaggerSpec) {
  const spec = swaggerSpec.definition || swaggerSpec;
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { display: none } .swagger-ui { background: #1a1a2e } .swagger-ui .info .title { color: #e0e0e0 } .swagger-ui .opblock-tag { color: #e0e0e0 } .swagger-ui .opblock .opblock-summary-description { color: #b0b0b0 }',
    customSiteTitle: 'PrepAgent API Docs',
  }));
}
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
const PORT = Number(process.env.PORT || 5000);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`PrepAgent server running on port ${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);

// One-shot Judge0 reachability check on boot.
// Does NOT crash the server — logs and moves on so analytics/leaderboard/etc. keep working.
if (process.env.JUDGE0_API_URL) {
  isJudge0Reachable()
    .then((ok) => {
      if (ok) {
        console.log(`✅ Judge0 connected at ${process.env.JUDGE0_API_URL}`);
      } else {
        console.warn(
          `⚠️  Judge0 not reachable at ${process.env.JUDGE0_API_URL} — ` +
          'code execution will fail until Docker Desktop is started ' +
          '(run: docker compose up -d in judge0-server/) or JUDGE0_API_KEY is set for hosted mode'
        );
      }
    })
    .catch(() => {
      console.warn(
        `⚠️  Judge0 health check errored for ${process.env.JUDGE0_API_URL} — ` +
        'code execution will fail until Docker Desktop is started ' +
        '(run: docker compose up -d in judge0-server/) or JUDGE0_API_KEY is set for hosted mode'
      );
    });
}

module.exports = app;