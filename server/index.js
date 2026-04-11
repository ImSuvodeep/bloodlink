/**
 * BLOODLINK DISPATCH SERVER — Production Edition
 * Express + Socket.IO + SQLite + JWT Auth + Helmet + Rate Limiting
 *
 * Dev:  npm run dev:full  (Vite + this server on port 3001, proxied)
 * Prod: npm start         (React build served from Express on port 3001)
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { initDB } from './database.js';
import { verifyToken } from './auth.js';
import authRoutes from './routes/auth.js';
import ngoRoutes from './routes/ngos.js';
import volunteerRoutes from './routes/volunteers.js';
import requestRoutes from './routes/requests.js';
import { rankCandidates } from './matchingEngine.js';
import {
  bloodRequests, donorAvailability, ngoReservations,
  donorSockets, patientSockets, ngoSockets, dispatchTimers,
  isDonorAvailable, lockDonor, releaseDonor, reserveNgoStock, syncNgoStock,
} from './db.js';

// ─── Init DB ──────────────────────────────────────────────────
initDB();

// ─── Express setup ───────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Rate limiting
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 15,
  message: { error: 'Too many attempts. Try again in 1 hour.' },
});

app.use(generalLimiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',            authLimiter, authRoutes);
app.use('/api/ngos',            ngoRoutes);
app.use('/api/volunteers',      volunteerRoutes);
app.use('/api/patient-requests',requestRoutes);

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
}));

// Legacy dispatch endpoints (used by Socket.IO UI)
app.get('/api/requests/:id', (req, res) => {
  const r = bloodRequests.get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});
app.get('/api/requests', (_, res) => res.json([...bloodRequests.values()]));

// ─── Serve React build in production ─────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*$/, (_, res) => res.sendFile(join(distPath, 'index.html')));
  console.log('📁 Serving React build from:', distPath);
}

// ─── HTTP + Socket.IO ─────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Optional auth on socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try { socket.user = verifyToken(token); } catch (_) {}
  }
  next(); // allow unauthenticated connections (patients, public users)
});

const DONOR_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// ─── Helper functions ─────────────────────────────────────────
function notifyPatient(requestId, event, payload) {
  const sid = patientSockets.get(requestId);
  if (sid) io.to(sid).emit(event, payload);
}

function notifyDonor(donorId, event, payload) {
  const sid = donorSockets.get(donorId);
  if (sid) io.to(sid).emit(event, payload);
}

function notifyAllNgos(event, payload) {
  for (const sid of ngoSockets.values()) io.to(sid).emit(event, payload);
}

function updateRequestStatus(requestId, status, extra = {}) {
  const r = bloodRequests.get(requestId);
  if (!r) return;
  const updated = { ...r, status, ...extra };
  bloodRequests.set(requestId, updated);
  notifyPatient(requestId, 'request:status', { requestId, status, ...extra });
  notifyAllNgos('ngo:requestUpdate', { requestId, status, ...extra });
  return updated;
}

function dispatchNext(requestId) {
  const req = bloodRequests.get(requestId);
  if (!req || ['Cancelled','Accepted','Completed'].includes(req.status)) return;

  const queue = req.donor_queue || [];
  const idx = req.current_trial_index ?? 0;

  if (idx >= queue.length) {
    updateRequestStatus(requestId, 'Rejected', { message: 'No donors accepted the request' });
    return;
  }

  const candidate = queue[idx];
  req.current_trial_index = idx + 1;
  bloodRequests.set(requestId, req);

  if (candidate.type === 'donor' && !isDonorAvailable(candidate.id)) {
    return dispatchNext(requestId);
  }

  updateRequestStatus(requestId, 'Requested', { message: `Contacting ${candidate.name || candidate.id}...` });

  if (candidate.type === 'ngo') {
    handleNgoAccept(requestId, candidate);
    return;
  }

  notifyDonor(candidate.id, 'donor:incoming', {
    requestId, donorId: candidate.id,
    bloodGroup: req.blood_group, emergency: req.emergency_level,
    km: candidate.km, patientArea: req.patient_area || 'Nearby',
  });

  if (dispatchTimers.has(requestId)) clearTimeout(dispatchTimers.get(requestId));
  const timer = setTimeout(() => {
    notifyDonor(candidate.id, 'donor:cancel', { requestId });
    dispatchNext(requestId);
  }, DONOR_TIMEOUT_MS);
  dispatchTimers.set(requestId, timer);
}

function handleNgoAccept(requestId, candidate) {
  const req = bloodRequests.get(requestId);
  if (!req) return;
  reserveNgoStock(candidate.id, req.blood_group);
  updateRequestStatus(requestId, 'Accepted', { matched_ngo_id: candidate.id, message: 'Blood reserved at NGO' });
  notifyPatient(requestId, 'request:matched', {
    requestId, matchType: 'ngo',
    contact: { name: candidate.name, phone: candidate.phone, address: candidate.address, ngoName: candidate.name },
  });
}

// ─── Socket Events ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id} (user: ${socket.user?.type || 'anonymous'})`);

  socket.on('register:donor', (data) => {
    const { donorId, ...rest } = data;
    donorSockets.set(donorId, socket.id);
    const existing = donorAvailability.get(donorId) || {};
    donorAvailability.set(donorId, { ...existing, donor_id: donorId, socket_id: socket.id, is_available: true, ...rest });
    console.log(`[Donor] ${data.name} (${donorId}) online`);
  });

  socket.on('register:ngo', ({ ngoId, inventory, ...rest }) => {
    ngoSockets.set(ngoId, socket.id);
    if (inventory) syncNgoStock(ngoId, inventory);
    console.log(`[NGO] ${ngoId} online`);
  });

  socket.on('register:patient', ({ requestId }) => {
    patientSockets.set(requestId, socket.id);
  });

  socket.on('autoMatch:start', ({ request, donors, ngos }) => {
    const requestId = request.request_id || `req-${Date.now()}`;
    for (const ngo of (ngos || [])) { if (ngo.inventory) syncNgoStock(ngo.id, ngo.inventory); }

    const ranked = rankCandidates(request, donors || [], ngos || []);
    const bloodReq = {
      request_id: requestId, patient_id: request.patient_id,
      patient_name: request.patient_name, patient_phone: request.patient_phone,
      blood_group: request.blood_group, pincode: request.pincode,
      emergency_level: request.emergency_level,
      patient_lat: request.patient_lat, patient_lng: request.patient_lng,
      patient_area: request.patient_area,
      status: 'Searching', matched_donor_id: null, matched_ngo_id: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      donor_queue: ranked, current_trial_index: 0,
    };

    bloodRequests.set(requestId, bloodReq);
    patientSockets.set(requestId, socket.id);
    notifyAllNgos('ngo:newRequest', bloodReq);
    socket.emit('request:status', { requestId, status: 'Searching', message: 'Finding the best match...' });
    setTimeout(() => dispatchNext(requestId), 500);
    console.log(`[Match] Request ${requestId} — queue: ${ranked.length} candidates`);
  });

  socket.on('autoMatch:cancel', ({ requestId }) => {
    const req = bloodRequests.get(requestId);
    if (!req) return;
    if (dispatchTimers.has(requestId)) { clearTimeout(dispatchTimers.get(requestId)); dispatchTimers.delete(requestId); }
    const idx = (req.current_trial_index || 1) - 1;
    const current = (req.donor_queue || [])[idx];
    if (current?.type === 'donor') notifyDonor(current.id, 'donor:cancel', { requestId });
    updateRequestStatus(requestId, 'Cancelled');
  });

  socket.on('donor:accept', ({ requestId, donorId }) => {
    const req = bloodRequests.get(requestId);
    if (!req || req.status === 'Accepted' || req.status === 'Cancelled') return;
    if (dispatchTimers.has(requestId)) { clearTimeout(dispatchTimers.get(requestId)); dispatchTimers.delete(requestId); }
    lockDonor(donorId, requestId, 30);
    const donorData = donorAvailability.get(donorId) || {};
    updateRequestStatus(requestId, 'Accepted', { matched_donor_id: donorId });
    notifyPatient(requestId, 'request:matched', {
      requestId, matchType: 'donor',
      contact: { name: donorData.name || 'Donor', phone: donorData.phone || 'N/A', bloodGroup: donorData.blood_group, ngoName: donorData.ngo_name || '', km: donorData.km },
    });
    notifyDonor(donorId, 'donor:confirmed', { requestId, patientName: req.patient_name });
    console.log(`[Match] Donor ${donorId} accepted ${requestId}`);
  });

  socket.on('donor:reject', ({ requestId, donorId }) => {
    const req = bloodRequests.get(requestId);
    if (!req || req.status !== 'Requested') return;
    if (dispatchTimers.has(requestId)) { clearTimeout(dispatchTimers.get(requestId)); dispatchTimers.delete(requestId); }
    updateRequestStatus(requestId, 'Searching', { message: 'Looking for next match...' });
    dispatchNext(requestId);
  });

  socket.on('donor:setAvailable', ({ donorId, available }) => {
    const existing = donorAvailability.get(donorId) || {};
    donorAvailability.set(donorId, { ...existing, is_available: available });
  });

  socket.on('disconnect', () => {
    for (const [id, sid] of donorSockets.entries()) { if (sid === socket.id) { donorSockets.delete(id); break; } }
    for (const [id, sid] of ngoSockets.entries()) { if (sid === socket.id) { ngoSockets.delete(id); break; } }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Graceful shutdown ────────────────────────────────────────
process.on('SIGTERM', () => { console.log('SIGTERM — shutting down'); httpServer.close(() => process.exit(0)); });
process.on('SIGINT',  () => { console.log('SIGINT  — shutting down'); httpServer.close(() => process.exit(0)); });

// ─── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🩸 BloodLink ${process.env.NODE_ENV === 'production' ? 'Production' : 'Dev'} Server → http://localhost:${PORT}`);
  console.log(`   JWT auth: enabled | SQLite: bloodlink.db | OTP: ${process.env.OTP_ENABLED === 'true' ? 'SMS (Twilio)' : 'console'}\n`);
});
