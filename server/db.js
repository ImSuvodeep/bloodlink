/**
 * IN-MEMORY DATABASE
 * Simulates the following tables:
 *   - BloodRequests
 *   - DonorAvailability
 *   - NGOStockReservation
 *
 * Resets on server restart (production would use real DB).
 * Completely isolated from the existing React state.
 */

// ─── BloodRequests ───────────────────────────────────────────
// Map<requestId, BloodRequest>
// BloodRequest {
//   request_id, patient_id, patient_name, patient_phone,
//   blood_group, pincode, emergency_level,
//   status, matched_donor_id, matched_ngo_id,
//   created_at, expires_at,
//   donor_queue: [donorId, ...],   // ranked list
//   current_trial_index: number,   // which donor we are asking
//   patient_lat, patient_lng
// }
export const bloodRequests = new Map();

// ─── DonorAvailability ───────────────────────────────────────
// Map<donorId, DonorAvailability>
// { donor_id, is_available, locked_until, current_request_id,
//   socket_id, name, phone, blood_group, pincode, lat, lng, ngo_id }
export const donorAvailability = new Map();

// ─── NGOStockReservation ─────────────────────────────────────
// Map<`${ngoId}-${bloodGroup}`, NGOStockReservation>
// { ngo_id, blood_group, units_available, reserved_units }
export const ngoReservations = new Map();

// ─── Online Sockets ──────────────────────────────────────────
// Map<donorId, socketId>           – online volunteers
export const donorSockets = new Map();
// Map<patientRequestId, socketId>  – waiting patients
export const patientSockets = new Map();
// Map<ngoId, socketId>             – online NGO admins
export const ngoSockets = new Map();

// ─── Active Dispatch Timers ───────────────────────────────────
// Map<requestId, NodeJS.Timeout>   – the 2-min countdown per request
export const dispatchTimers = new Map();

// ─── Helpers ─────────────────────────────────────────────────
export function isDonorAvailable(donorId) {
  const rec = donorAvailability.get(donorId);
  if (!rec) return true; // not yet tracked → assume available
  if (!rec.is_available) {
    // Check if lock has expired
    if (rec.locked_until && new Date() > new Date(rec.locked_until)) {
      rec.is_available = true;
      rec.locked_until = null;
      rec.current_request_id = null;
      donorAvailability.set(donorId, rec);
      return true;
    }
    return false;
  }
  return true;
}

export function lockDonor(donorId, requestId, minutes = 30) {
  const existing = donorAvailability.get(donorId) || {};
  donorAvailability.set(donorId, {
    ...existing,
    donor_id: donorId,
    is_available: false,
    locked_until: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    current_request_id: requestId,
  });
}

export function releaseDonor(donorId) {
  const existing = donorAvailability.get(donorId) || {};
  donorAvailability.set(donorId, {
    ...existing,
    is_available: true,
    locked_until: null,
    current_request_id: null,
  });
}

export function reserveNgoStock(ngoId, bloodGroup, units = 1) {
  const key = `${ngoId}-${bloodGroup}`;
  const rec = ngoReservations.get(key) || { ngo_id: ngoId, blood_group: bloodGroup, units_available: 0, reserved_units: 0 };
  if (rec.units_available - rec.reserved_units >= units) {
    rec.reserved_units += units;
    ngoReservations.set(key, rec);
    return true;
  }
  return false;
}

export function syncNgoStock(ngoId, inventory) {
  for (const [bg, units] of Object.entries(inventory)) {
    const key = `${ngoId}-${bg}`;
    const existing = ngoReservations.get(key) || { ngo_id: ngoId, blood_group: bg, reserved_units: 0 };
    ngoReservations.set(key, { ...existing, units_available: Number(units) });
  }
}
