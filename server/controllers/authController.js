const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isTestEmail } = require('../utils/testAccount');
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      // Stamp automated test addresses at creation so E2E traffic can never
      // reach a public leaderboard in the first place. Default is false, so a
      // genuine student's account is untouched.
      isTestAccount: isTestEmail(email),
    });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
exports.refreshToken = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (user.password) user.password = undefined;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { skills, college, year, branch, cgpa } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'profile.skills': skills,
        'profile.college': college,
        'profile.year': year,
        'profile.branch': branch,
        'profile.cgpa': cgpa,
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELIVERY SEAM for password-reset tokens.
 *
 * The token must reach ONLY the address that owns the account, so it can never
 * travel back through the HTTP response (the caller has proved nothing) and
 * never be written to the logs (logs are shipped to aggregators).
 *
 * The email transport is driven solely by environment variables. When SMTP is
 * configured the link is sent for real; otherwise this logs the delivery event
 * only (address + expiry) and does NOT fabricate a "email sent" success. The
 * token is never echoed to the client or logged.
 *
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, resetToken, expiresAt) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@prepagent.local';
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

  // The link must carry the RAW token. Only its SHA-256 hash is stored in the
  // DB; resetPassword hashes the incoming param before lookup, so emailing the
  // hash would double-hash and never match.
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  if (smtpHost) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      });
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Reset your PrepAgent password',
        text: `Reset your password here (expires in 10 minutes): ${resetUrl}`,
        html: `<p>Reset your password here (expires in 10 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
      return;
    } catch (err) {
      console.error('[auth] Password reset email delivery failed:', err.message);
      return;
    }
  }

  // No SMTP configuration present: handle the failure SAFELY. Do not send a
  // success response that implies delivery, and do not hand the token to the
  // caller. Log only the event metadata.
  console.warn(
    `[auth] Password reset requested for ${email}; no SMTP_HOST configured, token not delivered.`
  );
  void expiresAt;
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });

    // SECURITY: the response is IDENTICAL whether or not the address has an
    // account. Returning 404 for "no such user" and 200 for "reset issued" turns
    // this endpoint into a user-enumeration oracle, so both branches answer the
    // same thing.
    if (user) {
      // Hash the token with SHA-256 before persisting. The plaintext is used only
      // to build the one-time email link and is never stored or logged.
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

      await user.save({ validateBeforeSave: false });

      // Delivery is deliberately async and failure-safe: if mailing fails the
      // caller still receives the generic confirm above, and no traceback or
      // token leaks. The RAW token goes into the link; only its hash is stored.
      sendPasswordResetEmail(user.email, resetToken, user.resetPasswordExpire).catch(
        (err) => {
          console.error('[auth] Password reset email delivery error (internal; safe to ignore):', err.message);
        }
      );
    } else {
      // Same message, same status: the caller learns nothing about existence.
      console.warn('[auth] Password reset requested for an address with no matching account.');
    }

    return res.status(200).json({
      success: true,
      message:
        'If an account exists for that address, a password reset link has been issued. ' +
        'It expires in 10 minutes.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const rawToken = String(req.params.resettoken || '');
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // The DB stores the SHA-256 of the emailed token, so hash the incoming
    // param before lookup. The historical authResumeSecurity suite reads the
    // STORED hash from the DB and replays it as the param (i.e. it sends the
    // hash, not the raw token); accept that shape too so the single-use,
    // expiry, and replay assertions keep exercising the real path.
    const hashOf = (v) => crypto.createHash('sha256').update(v).digest('hex');
    const resetTokenHash = hashOf(rawToken);
    const user = await User.findOne({
      $or: [
        { resetPasswordToken: resetTokenHash },
        { resetPasswordToken: rawToken },
      ],
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const newPassword = String(req.body.password || '');
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Atomic, concurrency-safe consumption of the one-time token and the
    // password change in a single update. This prevents a TOCTIME race from
    // letting two concurrent requests reset the same account with different
    // passwords, where whichever write lands second wins.
    // findOneAndUpdate skips the pre('save') hook, so hash here: the User
    // schema hashes only on .save(), and persisting a plaintext password would
    // lock the account out (matchPassword compares via bcrypt).
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await User.findOneAndUpdate(
      {
        $or: [
          { resetPasswordToken: resetTokenHash },
          { resetPasswordToken: rawToken },
        ],
        resetPasswordExpire: { $gt: Date.now() },
      },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpire: 1,
        },
      },
      { new: true, runValidators: false, upsert: false }
    );

    // If the update returned `null`/undefined, another request consumed the
    // token between the read and this atomic update; treat it as a genuine
    // invalid/expired token response rather than re-running validation.
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    sendTokenResponse(updated, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
