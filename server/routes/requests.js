// server/routes/requests.js
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db_requests } from '../database.js';
import { optionalAuth } from '../auth.js';
import { getPincodeCoords } from '../pincodeDB.js';

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// POST /api/patient-requests — Public (anyone can submit a blood request)
router.post('/', optionalAuth, [
  body('patient_name').trim().notEmpty().withMessage('Patient name required'),
  body('blood_group').isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Valid blood group required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Valid 6-digit pincode required'),
], validate, (req, res) => {
  try {
    const coords = getPincodeCoords(req.body.pincode);
    const id = `req-${Date.now()}`;
    const data = {
      id,
      patient_name: req.body.patient_name,
      phone: req.body.phone || '',
      email: req.body.email || '',
      age: req.body.age || '',
      gender: req.body.gender || '',
      blood_group: req.body.blood_group,
      hospital: req.body.hospital || '',
      city: req.body.city || '',
      pincode: req.body.pincode,
      lat: coords.lat,
      lng: coords.lng,
      units_needed: parseInt(req.body.units) || 1,
      urgency: req.body.urgency || 'Urgent',
      emergency_level: req.body.urgency?.toLowerCase().includes('critical') ? 'critical' : 'urgent',
      doctor_name: req.body.doctorName || '',
      prescription_id: req.body.prescriptionId || '',
      notes: req.body.notes || '',
      dispatch_mode: req.body.dispatchMode || 'manual',
    };
    const request = db_requests.create(data);
    res.status(201).json({ message: 'Blood request submitted', request });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// GET /api/patient-requests — Public list (with optional status filter)
router.get('/', (req, res) => {
  const requests = db_requests.findAll({ status: req.query.status, limit: parseInt(req.query.limit) || 100 });
  res.json(requests);
});

// GET /api/patient-requests/:id
router.get('/:id', (req, res) => {
  const request = db_requests.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json(request);
});

export default router;
