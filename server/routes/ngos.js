// server/routes/ngos.js
import { Router } from 'express';
import { db_ngos } from '../database.js';
import { requireAuth, requireNgoOwnership } from '../auth.js';

const router = Router();

// GET /api/ngos — Public list of all NGOs (no password_hash)
router.get('/', (req, res) => {
  const ngos = db_ngos.findAll().map(n => ({ ...n, password_hash: undefined }));
  res.json(ngos);
});

// GET /api/ngos/:id — Single NGO (no password_hash)
router.get('/:id', (req, res) => {
  const ngo = db_ngos.findById(req.params.id);
  if (!ngo) return res.status(404).json({ error: 'NGO not found' });
  res.json({ ...ngo, password_hash: undefined });
});

// PATCH /api/ngos/:id/inventory — Update blood inventory (NGO owner only)
router.patch('/:id/inventory', requireAuth, (req, res) => {
  if (req.user.type !== 'ngo' || req.user.ngoId !== req.params.id) {
    return res.status(403).json({ error: 'You can only update your own inventory' });
  }
  const { inventory } = req.body;
  if (!inventory || typeof inventory !== 'object') {
    return res.status(400).json({ error: 'inventory object required' });
  }
  db_ngos.updateInventory(req.params.id, inventory);
  res.json({ message: 'Inventory updated', inventory: db_ngos.getInventory(req.params.id) });
});

export default router;
