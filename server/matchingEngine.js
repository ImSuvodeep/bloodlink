/**
 * MATCHING ENGINE
 * Implements the scoring formula:
 *   +100 if blood group matches exactly
 *   +50  if donor is available (not locked)
 *   +40  if NGO has blood stock available
 *   +30  if emergency is critical
 *   -5   per km distance
 *
 * Returns a ranked array of candidates: { type:'donor'|'ngo', id, score, ...data }
 */

import { BLOOD_COMPATIBILITY } from './bloodCompat.js';
import { isDonorAvailable, ngoReservations } from './db.js';

// Haversine formula
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * rankCandidates
 * @param {Object} request  – { blood_group, emergency_level, patient_lat, patient_lng }
 * @param {Array}  donors   – array of donor objects with { id, blood_group, lat, lng, available }
 * @param {Array}  ngos     – array of NGO objects with { id, inventory, lat, lng }
 * @returns {Array} ranked candidates sorted by score descending
 */
export function rankCandidates(request, donors = [], ngos = []) {
  const { blood_group, emergency_level, patient_lat, patient_lng } = request;
  const compatible = BLOOD_COMPATIBILITY[blood_group] || [blood_group];
  const isCritical = emergency_level === 'critical';

  const scored = [];

  // ── Score Donors ─────────────────────────────────────────────
  for (const donor of donors) {
    if (!compatible.includes(donor.blood_group)) continue;

    let score = 0;

    // Exact blood group match
    if (donor.blood_group === blood_group) score += 100;

    // Donor availability (server-side lock check)
    if (isDonorAvailable(donor.id)) score += 50;
    else continue; // skip locked donors entirely

    // Emergency bonus
    if (isCritical) score += 30;

    // Distance penalty
    if (patient_lat && patient_lng && donor.lat && donor.lng) {
      const km = distanceKm(patient_lat, patient_lng, donor.lat, donor.lng);
      score -= km * 5;
      scored.push({ type: 'donor', id: donor.id, score: Math.round(score), km: Math.round(km * 10) / 10, ...donor });
    } else {
      scored.push({ type: 'donor', id: donor.id, score: Math.round(score), km: null, ...donor });
    }
  }

  // ── Score NGOs ────────────────────────────────────────────────
  for (const ngo of ngos) {
    const hasStock = compatible.some(bg => {
      const key = `${ngo.id}-${bg}`;
      const rec = ngoReservations.get(key);
      if (!rec) {
        // Fallback: check inventory directly
        return (ngo.inventory?.[bg] || 0) > 0;
      }
      return (rec.units_available - rec.reserved_units) > 0;
    });

    if (!hasStock) continue;

    let score = 0;
    if (ngo.inventory?.[blood_group] > 0) score += 100; // exact match stock
    score += 40; // has blood
    if (isCritical) score += 30;

    if (patient_lat && patient_lng && ngo.lat && ngo.lng) {
      const km = distanceKm(patient_lat, patient_lng, ngo.lat, ngo.lng);
      score -= km * 5;
      scored.push({ type: 'ngo', id: ngo.id, score: Math.round(score), km: Math.round(km * 10) / 10, ...ngo });
    } else {
      scored.push({ type: 'ngo', id: ngo.id, score: Math.round(score), km: null, ...ngo });
    }
  }

  return scored.sort((a, b) => b.score - a.score);
}
