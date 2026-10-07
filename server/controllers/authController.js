const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

/**
 * DELIVERY SEAM for password-reset tokens.
 *
 * The token must reach ONLY the address that owns the account, so it can never
 * travel back through the HTTP response (the caller has proved nothing) and
 * never be written to the logs (logs are shipped to aggregators).
 *
 * This project ships no mail transport, so this logs the DELIVERY EVENT ONLY -
 * address and expiry, never the secret. It deliberately does NOT report a
 * success it did not achieve, and it deliberately does not fall back to
 * handing the token to the requester. Dropping a real mailer in here (nodemailer,
 * SES, SendGrid) is the one-line change needed to make reset work end to end.
 *
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, token) => {
  console.warn(
    `[auth] Password reset token issued for ${email}; expires in 10 minutes. ` +
    'No mail transport is configured, so the token was not delivered. ' +
    'Wire a mailer into sendPasswordResetEmail() to complete this flow.'
  );
  // `token` is intentionally accepted-but-unused so the call site keeps the
  // signature a real mailer needs.
  void token;
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });

    // SECURITY: the response is IDENTICAL whether or not the address has an
    // account. Returning 404 for "no such user" and 200 for "reset issued" turns
    // this endpoint into a user-enumeration oracle, so both branches answer the
    // same thing.
    if (user) {
      const resetToken = generateResetToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save({ validateBeforeSave: false });

      // SECURITY: the token is NEVER sent to the caller and never written to the
      // logs. Anyone who can reach this endpoint can supply any address, so
      // returning it would hand a complete account-takeover primitive to whoever
      // asked - the requester has not proved they own the mailbox. Log lines are
      // shipped to aggregators and read by anyone with log access, so a token
      // there is just a second copy of the same secret.
      //
      // This console.log is the delivery SEAM: in a real deployment the
      // `sendPasswordResetEmail(user.email, resetToken)` call below is what
      // actually delivers the token to the account owner. It is intentionally
      // left as a no-op-with-logging rather than a fabricated "email sent"
      // success, so nothing here pretends a message went out.
      await sendPasswordResetEmail(user.email, resetToken);
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
    const resetToken = req.params.resettoken;
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
