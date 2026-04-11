# BloodLink — REST API & Socket.IO Reference

## REST API (Express — port 3001)

### Base URL
```
http://localhost:3001
```

---

### GET /api/health

Check if the dispatch server is running.

**Response:**
```json
{
  "status": "ok",
  "time": "2026-04-11T05:00:00.000Z"
}
```

---

### GET /api/requests

List all active (non-completed, non-cancelled) blood requests.

**Response:**
```json
[
  {
    "request_id": "req-1712345678903",
    "patient_name": "Ram Kumar",
    "blood_group": "A+",
    "pincode": "700001",
    "emergency_level": "critical",
    "status": "Searching",
    "matched_donor_id": null,
    "matched_ngo_id": null,
    "created_at": "2026-04-11T05:00:00Z",
    "donor_queue": [...],
    "current_trial_index": 2
  }
]
```

---

### GET /api/requests/:id

Get a specific request by ID.

**Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `id` | string | The `request_id` |

**Response:** Single request object (same shape as above).

**Error (404):**
```json
{ "error": "Not found" }
```

---

## Socket.IO Events Reference

### Connection

```
ws://localhost:3001
```

Socket.IO shared connection is maintained via `useSocket.js`.

---

### CLIENT → SERVER Events

#### `register:donor`

Register a volunteer as online and available.

```javascript
socket.emit('register:donor', {
  donorId: "vol-1712345678901",    // string
  name: "Rahul Sharma",
  phone: "9876543210",
  blood_group: "B+",
  pincode: "700029",
  lat: 22.5355,                    // float | undefined
  lng: 88.3476,                    // float | undefined
  ngo_id: "ngo-1712345678900",
  ngo_name: "Dangram Blood Donation"
});
```

---

#### `register:ngo`

Register an NGO admin as online and sync their blood stock to the server.

```javascript
socket.emit('register:ngo', {
  ngoId: "ngo-1712345678900",
  name: "Dangram Blood Donation",
  inventory: { "A+": 5, "B+": 3, "O+": 2, ... },
  lat: 25.6107,
  lng: 88.0849
});
```

---

#### `register:patient`

Link a patient's socket connection to their blood request.

```javascript
socket.emit('register:patient', {
  requestId: "req-1712345678903",
  patientId: "pat-1712345678904"
});
```

---

#### `autoMatch:start`

Trigger the automatic dispatch flow.

```javascript
socket.emit('autoMatch:start', {
  request: {
    request_id: "req-...",
    patient_name: "Ram Kumar",
    patient_phone: "9123456789",
    blood_group: "A+",
    pincode: "700001",
    emergency_level: "critical",
    patient_lat: 22.5726,
    patient_lng: 88.3639,
    patient_area: "Dalhousie"
  },
  donors: [
    { id: "vol-...", name: "...", blood_group: "B+", lat: 22.5355, lng: 88.3476, available: true }
  ],
  ngos: [
    { id: "ngo-...", name: "...", inventory: {"A+": 5}, lat: 25.6107, lng: 88.0849 }
  ]
});
```

---

#### `autoMatch:cancel`

Cancel an in-progress dispatch.

```javascript
socket.emit('autoMatch:cancel', {
  requestId: "req-1712345678903"
});
```

---

#### `donor:accept`

Volunteer accepts an incoming blood request.

```javascript
socket.emit('donor:accept', {
  requestId: "req-1712345678903",
  donorId: "vol-1712345678901"
});
```

---

#### `donor:reject`

Volunteer declines an incoming blood request.

```javascript
socket.emit('donor:reject', {
  requestId: "req-1712345678903",
  donorId: "vol-1712345678901"
});
```

---

#### `donor:setAvailable`

Manually toggle volunteer's server-side availability.

```javascript
socket.emit('donor:setAvailable', {
  donorId: "vol-1712345678901",
  available: false
});
```

---

### SERVER → CLIENT Events

#### `request:status`

Sent to the **patient** whenever the request status changes.

```javascript
// Received by patient
socket.on('request:status', ({ requestId, status, message }) => {
  // status: 'Searching' | 'Requested' | 'Accepted' | 'Rejected' | 'Cancelled'
  // message: human-readable description
});
```

---

#### `request:matched`

Sent to the **patient** when a donor or NGO accepts. Contains contact details.

```javascript
socket.on('request:matched', ({
  requestId,
  matchType,     // 'donor' | 'ngo'
  contact: {
    name: "Rahul Sharma",
    phone: "9876543210",
    bloodGroup: "B+",
    ngoName: "Dangram Blood Donation",
    km: 1.2
  }
}) => { /* show contact to patient */ });
```

---

#### `donor:incoming`

Sent to a **specific volunteer** when the dispatch engine selects them.

```javascript
socket.on('donor:incoming', ({
  requestId: "req-...",
  donorId: "vol-...",
  bloodGroup: "A+",        // Patient's needed blood group
  emergency: "critical",
  km: 1.2,                 // Distance from patient
  patientArea: "Dalhousie"
}) => { /* show 2-min accept/reject popup */ });
```

---

#### `donor:cancel`

Sent to a volunteer if their pending request was cancelled or timed out.

```javascript
socket.on('donor:cancel', ({ requestId }) => {
  // Hide the popup, clear countdown
});
```

---

#### `donor:confirmed`

Sent to a volunteer after they accept and the server confirms.

```javascript
socket.on('donor:confirmed', ({
  requestId: "req-...",
  patientName: "Ram Kumar"
}) => { /* show "Thank you" message */ });
```

---

#### `ngo:newRequest`

Sent to **all online NGO admins** when a new auto-match request arrives.

```javascript
socket.on('ngo:newRequest', (request) => {
  // Add to NGO dashboard live request list
});
```

---

#### `ngo:requestUpdate`

Sent to **all online NGO admins** when a request status changes.

```javascript
socket.on('ngo:requestUpdate', ({
  requestId, status, matched_donor_id, matched_ngo_id
}) => { /* update request row in NGO dashboard */ });
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Server offline when patient starts auto-match | `autoMatch:start` never emits; UI stays in "manual" fallback |
| Volunteer disconnects mid-request | Socket removed from `donorSockets`; server timer fires → next donor tried |
| NGO disconnects | `ngoSockets` entry removed; they'll miss live updates until reconnect |
| All donors reject | Status set to `Rejected`; patient directed to manual search |
| Dispatch timer fires (2 min) | Server emits `donor:cancel` → dispatch moves to next queue entry |
