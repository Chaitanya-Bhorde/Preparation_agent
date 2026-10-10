const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { register, login, logout, getMe, updateProfile, refreshToken, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg) });
  }
  next();
};

// Parse a positive integer env value with a fallback. The raw-or-fallback is
// parsed FIRST and only then validated, so a value like '15 * 60 * 1000' (an
// unevaluated expression, not a number) falls back to the default instead of
// parseInt() silently truncating it to 15.
const positiveIntEnv = (name, fallback) => {
  const parsed = parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Per-IP throttling for the password-reset endpoints only. Login/register
// stay unthrottled here because authResumeSecurity.test.js issues dozens of
// sequential logins against an in-memory server; throttling them would turn a
// healthy suite red. server.js already applies a global API limiter.
const forgotLimiter = rateLimit({
  windowMs: positiveIntEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: positiveIntEnv('RATE_LIMIT_FORGOT_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

const resetLimiter = rateLimit({
  windowMs: positiveIntEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: positiveIntEnv('RATE_LIMIT_RESET_MAX', 20),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, register);

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, login);

router.get('/logout', logout);
router.get('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Password-reset endpoints: generic public response, throttled per IP.
// Single-use tokens are consumed atomically in the controller.
router.post('/forgotpassword', forgotLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetLimiter, resetPassword);
module.exports = router;
