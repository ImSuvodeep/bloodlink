// server/auth.js — JWT helpers, OTP generator, and Express middleware
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const OTP_ENABLED = process.env.OTP_ENABLED === 'true';

// ─── Token helpers ────────────────────────────────────────────
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ─── Password helpers ─────────────────────────────────────────
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ─── OTP helpers ──────────────────────────────────────────────
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendOTP(phone, otp, name = 'Volunteer') {
  if (OTP_ENABLED) {
    // Twilio SMS — plug in credentials in .env to enable
    sendViaTwilio(phone, otp).catch(err => {
      console.error('❌ Twilio error:', err.message);
    });
  } else {
    // Development: print to console
    console.log('\n' + '═'.repeat(50));
    console.log(`🔐 OTP for ${name} (${phone}): \x1b[33m${otp}\x1b[0m`);
    console.log(`   Expires in 10 minutes`);
    console.log('═'.repeat(50) + '\n');
  }
}

async function sendViaTwilio(phone, otp) {
  const { createRequire } = await import('module');
  const req = createRequire(import.meta.url);
  const twilio = req('twilio');
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  await client.messages.create({
    body: `BloodLink OTP: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
    from: process.env.TWILIO_FROM,
    to: phone,
  });
}

// ─── Express Middleware ───────────────────────────────────────

/** Requires a valid JWT in Authorization: Bearer <token> */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Requires JWT AND specific user roles */
export function requireRole(...roles) {
  return [requireAuth, (req, res, next) => {
    if (!roles.includes(req.user.type)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  }];
}

/** Requires JWT AND that the NGO in JWT matches the resource ngoId */
export function requireNgoOwnership(req, res, next) {
  if (req.user?.type !== 'ngo') return res.status(403).json({ error: 'NGO account required' });
  const ngoId = req.params.id || req.params.ngoId || req.body.ngoId;
  if (req.user.ngoId !== ngoId) return res.status(403).json({ error: 'You can only manage your own NGO' });
  next();
}

/** Optional auth — attaches user if token present, continues regardless */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyToken(header.split(' ')[1]); } catch (_) {}
  }
  next();
}
