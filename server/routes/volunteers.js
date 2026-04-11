// server/routes/volunteers.js
import { Router } from 'express';
import { db_volunteers } from '../database.js';
import { requireAuth } from '../auth.js';

const router = Router();

// GET /api/volunteers — Public list (filters by ngoId if ?ngoId= given)
router.get('/', (req, res) => {
  const { ngoId } = req.query;
  const vols = db_volunteers.findAll(ngoId || null)
    .map(v => ({ ...v, otp: undefined, otp_expires: undefined }));
  res.json(vols);
});

// GET /api/volunteers/:id
router.get('/:id', (req, res) => {
  const vol = db_volunteers.findById(req.params.id);
  if (!vol) return res.status(404).json({ error: 'Volunteer not found' });
  res.json({ ...vol, otp: undefined, otp_expires: undefined });
});

// PATCH /api/volunteers/:id/availability — Toggle availability (volunteer only, must be own record)
router.patch('/:id/availability', requireAuth, (req, res) => {
  if (req.user.type !== 'volunteer' || req.user.volId !== req.params.id) {
    return res.status(403).json({ error: 'You can only update your own availability' });
  }
  const { available } = req.body;
  if (typeof available !== 'boolean') return res.status(400).json({ error: 'available (boolean) required' });

  const updated = db_volunteers.toggleAvailability(req.params.id, available);
  res.json({ message: 'Availability updated', volunteer: { ...updated, otp: undefined, otp_expires: undefined } });
});

export default router;
