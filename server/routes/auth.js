// server/routes/auth.js — NGO and Volunteer authentication
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db_ngos, db_volunteers } from '../database.js';
import { generateToken, hashPassword, comparePassword, generateOTP, sendOTP } from '../auth.js';

// Pincode → lat/lng (mirrors AppContext PINCODE_DB)
import { getPincodeCoords } from '../pincodeDB.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// ═══════════════════════════════════════════════════
// NGO AUTH
// ═══════════════════════════════════════════════════

// POST /api/auth/ngo/register
router.post('/ngo/register', [
  body('name').trim().notEmpty().withMessage('NGO name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Valid 6-digit pincode required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
], validate, async (req, res) => {
  try {
    const { name, email, phone, city, pincode, address, regNumber, contactPerson, password } = req.body;

    // Check duplicate
    const existing = db_ngos.findByName(name);
    if (existing) return res.status(409).json({ error: 'NGO with this name already registered' });

    const coords = getPincodeCoords(pincode);
    const passwordHash = await hashPassword(password);
    const id = `ngo-${Date.now()}`;

    const ngo = db_ngos.create({
      id, name, email: email || '', phone,
      city, pincode, address: address || '', reg_number: regNumber || '',
      contact_person: contactPerson || '', lat: coords.lat, lng: coords.lng,
      password_hash: passwordHash,
    });

    const token = generateToken({ type: 'ngo', ngoId: id, name });

    res.status(201).json({
      message: 'NGO registered successfully',
      token,
      user: { type: 'ngo', data: { ...ngo, password_hash: undefined } },
    });
  } catch (err) {
    console.error('NGO register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/ngo/login
router.post('/ngo/login', [
  body('name').trim().notEmpty(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { name, password } = req.body;
    const ngo = db_ngos.findByName(name);
    if (!ngo) return res.status(401).json({ error: 'NGO not found' });

    const valid = await comparePassword(password, ngo.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = generateToken({ type: 'ngo', ngoId: ngo.id, name: ngo.name });
    res.json({
      message: 'Login successful',
      token,
      user: { type: 'ngo', data: { ...ngo, password_hash: undefined } },
    });
  } catch (err) {
    console.error('NGO login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ═══════════════════════════════════════════════════
// VOLUNTEER AUTH
// ═══════════════════════════════════════════════════

// POST /api/auth/volunteer/register
router.post('/volunteer/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('bloodGroup').isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Valid blood group required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Valid 6-digit pincode required'),
  body('ngoId').trim().notEmpty().withMessage('NGO is required'),
], validate, async (req, res) => {
  try {
    const { name, phone, email, bloodGroup, pincode, address, ngoId, availability } = req.body;

    const existing = db_volunteers.findByPhone(phone);
    if (existing) return res.status(409).json({ error: 'A volunteer with this phone is already registered' });

    const coords = getPincodeCoords(pincode);
    const id = `vol-${Date.now()}`;

    const vol = db_volunteers.create({
      id, name, phone, email: email || '',
      blood_group: bloodGroup, pincode,
      lat: coords.lat, lng: coords.lng,
      address: address || '', ngo_id: ngoId,
      availability: availability || 'anytime',
    });

    const token = generateToken({ type: 'volunteer', volId: id, name, bloodGroup, ngoId });
    res.status(201).json({
      message: 'Volunteer registered successfully',
      token,
      user: { type: 'volunteer', data: { ...vol, otp: undefined, otp_expires: undefined } },
    });
  } catch (err) {
    console.error('Volunteer register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/volunteer/otp/request
router.post('/volunteer/otp/request', [
  body('phone').trim().notEmpty(),
], validate, async (req, res) => {
  try {
    const { phone } = req.body;
    const vol = db_volunteers.findByPhone(phone);
    if (!vol) return res.status(404).json({ error: 'No volunteer found with that phone number' });

    const otp = generateOTP();
    db_volunteers.setOTP(vol.id, otp, 10);
    sendOTP(phone, otp, vol.name);

    res.json({ message: 'OTP sent. Check server console if OTP_ENABLED=false.' });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/volunteer/otp/verify
router.post('/volunteer/otp/verify', [
  body('phone').trim().notEmpty(),
  body('otp').trim().isLength({ min: 6, max: 6 }),
], validate, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const vol = db_volunteers.findByPhone(phone);
    if (!vol) return res.status(404).json({ error: 'Volunteer not found' });

    if (!vol.otp || vol.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(vol.otp_expires)) return res.status(401).json({ error: 'OTP expired. Request a new one.' });

    db_volunteers.clearOTP(vol.id);
    const token = generateToken({
      type: 'volunteer', volId: vol.id, name: vol.name, bloodGroup: vol.blood_group, ngoId: vol.ngo_id,
    });

    res.json({
      message: 'Login successful',
      token,
      user: { type: 'volunteer', data: { ...vol, otp: undefined, otp_expires: undefined } },
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
