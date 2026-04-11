# BloodLink — Security & Sensitive Data Handling

> WARNING: This document contains security-sensitive information about the platform's current vulnerabilities, data risks, and the mandatory steps required before going to production.

---

## Sensitive Data Inventory

| Data Type | Where Stored | Sensitivity Level | Current Risk |
|---|---|---|---|
| Volunteer phone number | React state + server Maps | 🔴 HIGH | Exposed in client state, visible in Redux DevTools |
| Patient phone number | React state | 🔴 HIGH | Same as above |
| Patient prescription details | React state | 🔴 HIGH | Unencrypted, client-side only |
| NGO registration number | React state | 🟡 MEDIUM | Not validated |
| Donor GPS coordinates | Server Maps (in-memory) | 🟡 MEDIUM | Lost on restart, no persistence |
| Blood group | React state + server | 🟢 LOW | Medical but not uniquely identifying alone |
| NGO inventory | React state + server | 🟢 LOW | Operational data |

---

## Current Security Posture (Development)

### What Is NOT Secure (Intentional for Testing)

1. **No Authentication** — Any user can register as any NGO or volunteer
2. **No Authorization** — Anyone can see all data in React DevTools
3. **NGO Auto-Verification** — All NGOs are auto-approved (`verified: true`)
4. **CORS wide-open** — Server allows all origins (`origin: '*'`)
5. **No Rate Limiting** — Dispatch server has no request limiting
6. **Data not persisted** — All data resets on page refresh/server restart
7. **Socket connections unverified** — Any socket can emit any event
8. **Volunteer login by phone only** — No password or OTP required
9. **Patient contact exposed** — After match, full phone number shown

---

## Production Security Requirements

### 1. Authentication

```
Recommended: JWT (JSON Web Tokens)

Flow:
Patient/Volunteer:
  Register → Server creates account (hashed password or sends OTP)
  Login → Server returns JWT
  All API calls → Bearer token in Authorization header

NGO Admin:
  Register → Admin approval required (not auto-verify)
  Login → JWT with ngo_id claim
  All NGO operations → JWT must contain matching ngo_id
```

**Volunteer: OTP-based login (no password needed)**
```
Volunteer enters phone → Server sends OTP via SMS (Twilio/MSG91)
Volunteer enters OTP → Server returns JWT
JWT expires in 24 hours
```

---

### 2. Data Encryption

```
In transit:
  - All HTTP traffic → HTTPS (TLS 1.3)
  - Socket.IO → WSS (WebSocket Secure)

At rest (database):
  - Encrypt PII columns: phone, email, address
  - Use PostgreSQL column-level encryption or AES-256 at application layer
  - Prescription images → encrypted file storage (AWS S3 with SSE)
```

**Sensitive field masking example:**
```javascript
// Before sending to patient — mask donor phone until accepted
const safeContact = status === 'Accepted'
  ? { name: donor.name, phone: donor.phone }      // full
  : { name: donor.name, phone: '****' + donor.phone.slice(-4) }; // masked
```

---

### 3. Authorization Rules

| Action | Who Can Do It | Enforcement |
|---|---|---|
| View any NGO's inventory | Anyone | Public (read-only) |
| Edit NGO inventory | Only that NGO's admin | JWT ngo_id claim check |
| Add volunteer to NGO | Only that NGO's admin | JWT ngo_id claim check |
| Access volunteer contact | Only matched patient + NGO admin | Request status check + JWT |
| Cancel a blood request | Only the patient who created it | JWT patient_id claim |
| Mark request complete | NGO admin or volunteer | JWT check |
| Delete an NGO | Super-admin only | Admin panel |

---

### 4. Socket.IO Security

```javascript
// Current (insecure):
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Production (secure):
const io = new Server(httpServer, {
  cors: {
    origin: ['https://bloodlink.org', 'https://app.bloodlink.org'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware: verify JWT on connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userType = decoded.type; // 'volunteer' | 'ngo' | 'patient'
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});
```

---

### 5. Input Validation & Sanitization

```javascript
// Install: npm install express-validator

// On blood request submission:
body('bloodGroup').isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
body('pincode').matches(/^\d{6}$/),
body('phone').matches(/^\+?[0-9]{10,13}$/),
body('emergencyLevel').isIn(['critical','urgent','moderate','planned']),

// Sanitize all text inputs:
body('patientName').trim().escape().isLength({ max: 200 }),
```

---

### 6. Rate Limiting

```javascript
// Install: npm install express-rate-limit

import rateLimit from 'express-rate-limit';

// Limit blood request creation: 5 per hour per IP
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many requests. Please wait before submitting again.'
});
app.use('/api/requests', requestLimiter);

// Limit donor:accept: prevent spam acceptance
// Implemented at Socket.IO middleware level
```

---

### 7. Data Privacy / DPDP Act (India) Compliance

The **Digital Personal Data Protection Act, 2023** applies to this platform.

| Requirement | Status | Action Required |
|---|---|---|
| Explicit consent before collecting personal data | Partially done (volunteer checkbox) | Add patient consent checkbox |
| Purpose limitation | Not enforced | Document data usage in privacy policy |
| Data minimization | Not enforced | Don't collect fields not needed for matching |
| Right to erasure | Not implemented | Add "Delete my account" endpoint |
| Data localisation | N/A (currently local) | Use Indian cloud region (AWS ap-south-1) |
| Breach notification | Not implemented | Add error monitoring + alerting |
| Grievance officer | Not appointed | Appoint per DPDP requirement |

**Required privacy documents:**
- `/docs/privacy_policy.md` (patient data handling)
- `/docs/terms_of_service.md`
- `/docs/dpdp_compliance.md`

---

### 8. Environment Variables

Never hardcode secrets. Use `.env` files (never commit to Git).

```bash
# .env (server)
PORT=3001
JWT_SECRET=your_very_long_random_secret_here_min_64_chars
DATABASE_URL=postgresql://user:password@localhost:5432/bloodlink
REDIS_URL=redis://localhost:6379
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_auth_token
TWILIO_FROM=+1XXXXXXXXXX
ALLOWED_ORIGINS=https://bloodlink.org,https://app.bloodlink.org

# .env (frontend)
VITE_SOCKET_URL=https://api.bloodlink.org
VITE_GOOGLE_MAPS_KEY=AIza...
```

**Add to .gitignore:**
```
.env
.env.local
.env.production
*.pem
*.key
```

---

### 9. Volunteer Contact Protection

```mermaid
flowchart LR
    A[Patient requests blood] --> B{Automatic Match?}
    B -->|Yes| C[Donor queue built server-side\nNo contact visible]
    C --> D{Donor accepts?}
    D -->|No| E[Next donor tried\nContact never revealed]
    D -->|Yes| F[ONLY NOW: phone + name sent to patient\nvia encrypted channel]
    B -->|Manual| G[Patient sees volunteer list\nPhone shown only if patient\nclicks 'Notify' or 'Call']
```

**Recommendation for production:** Show only the first 6 digits of phone until the match is accepted.

---

### 10. Incident Response Plan

```
Level 1 - Data Exposure:
  → Immediately rotate JWT_SECRET
  → Force-logout all active sessions
  → Notify affected users within 72 hours (DPDP requirement)
  → Audit access logs

Level 2 - Server Compromise:
  → Shut down dispatch server
  → Fallback to manual match only
  → Restore from last backup
  → Conduct security audit before restart

Level 3 - Abuse (fake blood requests):
  → Implement CAPTCHA on patient portal
  → Add phone verification (OTP) for request submission
  → Limit requests: 3 per phone per 24 hours
```

---

## Security Checklist (Before Production)

- [ ] Replace in-memory storage with PostgreSQL + encrypted backups
- [ ] Implement JWT authentication for all three user types
- [ ] Add OTP verification for volunteers (phone-based login)
- [ ] Add NGO admin approval workflow (no auto-verify)
- [ ] Enable HTTPS + WSS with valid SSL certificate
- [ ] Lock CORS to specific domains
- [ ] Add rate limiting on REST + Socket.IO
- [ ] Sanitize and validate all inputs with express-validator
- [ ] Add environment variable management (.env + secrets manager)
- [ ] Implement soft-delete (don't hard-delete personal data)
- [ ] Add audit logging for all match events
- [ ] Publish Privacy Policy + DPDP-compliant consent flow
- [ ] Set up monitoring (Sentry / Datadog)
- [ ] Penetration testing before go-live
