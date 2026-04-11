import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ═══════════════════════════════════════════════════
// PINCODE → APPROXIMATE COORDINATES (Indian Pincodes)
// ═══════════════════════════════════════════════════
const PINCODE_DB = {
  '400001': { city: 'Mumbai', lat: 18.9387, lng: 72.8353, area: 'Fort' },
  '400002': { city: 'Mumbai', lat: 18.9489, lng: 72.8345, area: 'Masjid Bunder' },
  '400053': { city: 'Mumbai', lat: 19.1136, lng: 72.8697, area: 'Andheri West' },
  '400069': { city: 'Mumbai', lat: 19.0748, lng: 72.8856, area: 'Malad' },
  '400078': { city: 'Mumbai', lat: 19.0459, lng: 72.9199, area: 'Powai' },
  '400092': { city: 'Mumbai', lat: 19.1663, lng: 72.9455, area: 'Borivali' },
  '110001': { city: 'Delhi', lat: 28.6315, lng: 77.2167, area: 'Connaught Place' },
  '110032': { city: 'Delhi', lat: 28.7041, lng: 77.1025, area: 'Rohini' },
  '110045': { city: 'Delhi', lat: 28.6562, lng: 77.0662, area: 'Dwarka' },
  '110019': { city: 'Delhi', lat: 28.5355, lng: 77.2533, area: 'Okhla' },
  '560001': { city: 'Bangalore', lat: 12.9716, lng: 77.5946, area: 'MG Road' },
  '560034': { city: 'Bangalore', lat: 12.9352, lng: 77.6245, area: 'Koramangala' },
  '560085': { city: 'Bangalore', lat: 12.9078, lng: 77.6476, area: 'HSR Layout' },
  '560076': { city: 'Bangalore', lat: 13.0236, lng: 77.5716, area: 'Rajajinagar' },
  '600001': { city: 'Chennai', lat: 13.0827, lng: 80.2707, area: 'Parrys' },
  '600017': { city: 'Chennai', lat: 13.0418, lng: 80.2341, area: 'T Nagar' },
  '600042': { city: 'Chennai', lat: 12.9698, lng: 80.1992, area: 'Velachery' },
  '500001': { city: 'Hyderabad', lat: 17.3659, lng: 78.4749, area: 'Charminar' },
  '500034': { city: 'Hyderabad', lat: 17.4126, lng: 78.4480, area: 'Banjara Hills' },
  '500072': { city: 'Hyderabad', lat: 17.4935, lng: 78.3960, area: 'Kukatpally' },
  '700001': { city: 'Kolkata', lat: 22.5726, lng: 88.3639, area: 'Dalhousie' },
  '700029': { city: 'Kolkata', lat: 22.5355, lng: 88.3476, area: 'Alipore' },
  '411001': { city: 'Pune', lat: 18.5204, lng: 73.8567, area: 'Pune City' },
  '411007': { city: 'Pune', lat: 18.5462, lng: 73.8346, area: 'Shivajinagar' },
  '733201': { city: 'D/Dinajpur', lat: 25.6107, lng: 88.0849, area: 'Dangram' },
  '733202': { city: 'D/Dinajpur', lat: 25.6150, lng: 88.0900, area: 'Balurghat' },
};

export function getPincodeCoords(pincode) {
  if (!pincode) return null;
  const pin = String(pincode).trim();
  if (PINCODE_DB[pin]) return { ...PINCODE_DB[pin], pincode: pin };
  const prefix = pin.slice(0, 3);
  const match = Object.entries(PINCODE_DB).find(([k]) => k.startsWith(prefix));
  if (match) return { ...match[1], pincode: pin, area: `${pin} area` };
  const zoneFallbacks = {
    '1': { city: 'Delhi',     lat: 28.7041, lng: 77.1025, area: 'Delhi Region' },
    '4': { city: 'Mumbai',    lat: 19.0760, lng: 72.8777, area: 'Mumbai Region' },
    '5': { city: 'Hyderabad', lat: 17.3850, lng: 78.4867, area: 'Hyderabad Region' },
    '6': { city: 'Chennai',   lat: 13.0827, lng: 80.2707, area: 'Chennai Region' },
    '7': { city: 'Kolkata',   lat: 22.5726, lng: 88.3639, area: 'Kolkata Region' },
  };
  return zoneFallbacks[pin[0]] || { city: 'India', lat: 20.5937, lng: 78.9629, area: 'Unknown' };
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const BLOOD_COMPATIBILITY = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

const CITY_COORDS = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'D/Dinajpur': { lat: 25.6107, lng: 88.0849 },
};

// Map API's snake_case fields to camelCase for the frontend
function normalizeNgo(n) {
  if (!n) return n;
  return {
    ...n,
    id: n.id,
    name: n.name,
    phone: n.phone,
    city: n.city,
    pincode: n.pincode,
    address: n.address,
    regNumber: n.reg_number || n.regNumber || '',
    contactPerson: n.contact_person || n.contactPerson || '',
    verified: !!n.verified,
    lat: n.lat,
    lng: n.lng,
    inventory: n.inventory || {},
    registeredAt: n.created_at || n.registeredAt || '',
  };
}

function normalizeVolunteer(v) {
  if (!v) return v;
  return {
    ...v,
    id: v.id,
    name: v.name,
    phone: v.phone,
    email: v.email || '',
    bloodGroup: v.blood_group || v.bloodGroup,
    pincode: v.pincode,
    address: v.address || '',
    ngoId: v.ngo_id || v.ngoId,
    availability: v.availability || 'anytime',
    available: v.is_available === undefined ? v.available : !!v.is_available,
    joinedAt: v.joined_at || v.joinedAt || '',
  };
}

// Local matching (client-side, for quick results display)
function matchNGOsWithVolunteers(request, ngos, volunteers) {
  if (!request?.bloodGroup) return [];
  const { bloodGroup, pincode, city } = request;
  const compatible = BLOOD_COMPATIBILITY[bloodGroup] || [bloodGroup];
  let patientCoords = pincode ? getPincodeCoords(pincode) : null;
  if (!patientCoords && city) patientCoords = CITY_COORDS[city] || { lat: 20.5937, lng: 78.9629 };

  return ngos
    .map(ngo => {
      const ngoCoords = getPincodeCoords(ngo.pincode) || { lat: ngo.lat, lng: ngo.lng };
      const ngoDistance = patientCoords ? getDistanceKm(patientCoords.lat, patientCoords.lng, ngoCoords.lat, ngoCoords.lng) : 9999;
      const availableUnits = compatible.reduce((sum, bg) => sum + (ngo.inventory[bg] || 0), 0);

      const ngoVolunteers = volunteers
        .filter(v => v.ngoId === ngo.id && compatible.includes(v.bloodGroup))
        .map(v => {
          const vCoords = getPincodeCoords(v.pincode);
          const vDistance = patientCoords && vCoords ? getDistanceKm(patientCoords.lat, patientCoords.lng, vCoords.lat, vCoords.lng) : 9999;
          return { ...v, distanceKm: Math.round(vDistance * 10) / 10, pincodeInfo: vCoords };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const score = Math.max(0, 100 - ngoDistance / 20) * 0.6 + (availableUnits > 0 ? 25 : 0) + (ngoVolunteers.filter(v => v.available).length * 5);
      return { ...ngo, ngoDistance: Math.round(ngoDistance * 10) / 10, availableUnits, matchedVolunteers: ngoVolunteers, score: Math.min(100, Math.round(score)) };
    })
    .filter(n => n.availableUnits > 0 || n.matchedVolunteers.length > 0)
    .sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════
// CONTEXT PROVIDER
// ═══════════════════════════════════════════════════
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // ── Boot: load user from token + fetch NGOs/volunteers ────────
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        // Decode JWT payload (no verification on client — server will verify on API calls)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (exp && Date.now() > exp) {
          clearToken();
        } else {
          // Restore user session from token
          setUser({ type: payload.type, data: { id: payload.ngoId || payload.volId, ...payload } });
        }
      } catch { clearToken(); }
    }
    // Load all data from DB
    Promise.all([
      api.get('/api/ngos').catch(() => []),
      api.get('/api/volunteers').catch(() => []),
      api.get('/api/patient-requests').catch(() => []),
    ]).then(([ngoData, volData, reqData]) => {
      setNgos((ngoData || []).map(normalizeNgo));
      setVolunteers((volData || []).map(normalizeVolunteer));
      setPatientRequests(reqData || []);
    }).finally(() => setLoading(false));
  }, []);

  const pushNotification = useCallback((msg, type = 'info', targetId = null) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, msg, type, targetId, time: new Date() }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  }, []);

  // ── NGO: Register ─────────────────────────────────────────────
  const registerNgo = async (data) => {
    const res = await api.post('/api/auth/ngo/register', {
      name: data.name, email: data.email, phone: data.phone,
      city: data.city, pincode: data.pincode, address: data.address,
      regNumber: data.regNumber, contactPerson: data.contactPerson,
      password: data.password,
    });
    setToken(res.token);
    const ngo = normalizeNgo(res.user.data);
    setNgos(prev => [...prev, ngo]);
    setUser({ type: 'ngo', data: ngo });
    pushNotification(`✅ "${data.name}" registered! Add your blood inventory to get started.`, 'success');
    return { type: 'ngo', data: ngo };
  };

  // ── NGO: Login ────────────────────────────────────────────────
  const loginNgo = async (name, password) => {
    const res = await api.post('/api/auth/ngo/login', { name, password });
    setToken(res.token);
    // Fetch fresh NGO data including inventory
    const freshNgo = normalizeNgo(await api.get(`/api/ngos/${res.user.data.id}`));
    setNgos(prev => prev.map(n => n.id === freshNgo.id ? freshNgo : n).concat(prev.find(n => n.id === freshNgo.id) ? [] : [freshNgo]));
    const userObj = { type: 'ngo', data: freshNgo };
    setUser(userObj);
    return userObj;
  };

  // ── Volunteer: Register ────────────────────────────────────────
  const registerVolunteer = async (data) => {
    const res = await api.post('/api/auth/volunteer/register', {
      name: data.name, phone: data.phone, email: data.email,
      bloodGroup: data.bloodGroup, pincode: data.pincode,
      address: data.address, ngoId: data.ngoId, availability: data.availability,
    });
    setToken(res.token);
    const vol = normalizeVolunteer(res.user.data);
    setVolunteers(prev => [...prev, vol]);
    // Refresh NGO inventory (server updated it)
    api.get('/api/ngos').then(d => setNgos((d || []).map(normalizeNgo))).catch(() => {});
    setUser({ type: 'volunteer', data: vol });
    const ngo = ngos.find(n => n.id === vol.ngoId);
    pushNotification(`🙋 ${vol.name} (${vol.bloodGroup}) joined ${ngo?.name || 'NGO'} — inventory updated!`, 'success');
    return vol;
  };

  // ── Volunteer: Request OTP ─────────────────────────────────────
  const requestOTP = async (phone) => {
    await api.post('/api/auth/volunteer/otp/request', { phone });
  };

  // ── Volunteer: Verify OTP ──────────────────────────────────────
  const loginVolunteer = async (phone, otp) => {
    const res = await api.post('/api/auth/volunteer/otp/verify', { phone, otp });
    setToken(res.token);
    const vol = normalizeVolunteer(res.user.data);
    setUser({ type: 'volunteer', data: vol });
    return { type: 'volunteer', data: vol };
  };

  // ── Patient: Register + submit request ───────────────────────
  const registerPatient = (data) => {
    const u = { type: 'patient', data: { ...data, id: Date.now(), registeredAt: new Date().toISOString() } };
    setUser(u);
    return u;
  };

  const submitPatientRequest = async (data) => {
    try {
      const res = await api.post('/api/patient-requests', {
        patient_name: data.fullName,
        phone: data.phone, email: data.email,
        age: data.age, gender: data.gender,
        blood_group: data.bloodGroup,
        hospital: data.hospital, city: data.city, pincode: data.pincode,
        units: data.units, urgency: data.urgency,
        doctorName: data.doctorName, prescriptionId: data.prescriptionId,
        notes: data.notes, dispatchMode: data.dispatchMode || 'manual',
      });
      const req = { ...data, id: res.request.id, status: 'pending', createdAt: res.request.created_at };
      setPatientRequests(prev => [req, ...prev]);
      return req;
    } catch (err) {
      // Fallback to local if API unavailable
      const req = { ...data, id: Date.now(), status: 'pending', createdAt: new Date().toISOString() };
      setPatientRequests(prev => [req, ...prev]);
      return req;
    }
  };

  // ── NGO Inventory ──────────────────────────────────────────────
  const updateNgoInventory = async (ngoId, inventory) => {
    try {
      await api.patch(`/api/ngos/${ngoId}/inventory`, { inventory });
    } catch { /* Fallback: update local state only */ }
    setNgos(prev => prev.map(n => n.id !== ngoId ? n : { ...n, inventory }));
  };

  // ── Volunteer Availability ─────────────────────────────────────
  const toggleVolunteerAvailability = async (volId) => {
    const vol = volunteers.find(v => v.id === volId);
    if (!vol) return;
    const nowAvailable = !vol.available;

    // Optimistically update UI
    setVolunteers(prev => prev.map(v => v.id !== volId ? v : { ...v, available: nowAvailable }));
    setNgos(prev => prev.map(n => {
      if (n.id !== vol.ngoId) return n;
      return { ...n, inventory: { ...n.inventory, [vol.bloodGroup]: Math.max(0, (n.inventory[vol.bloodGroup] || 0) + (nowAvailable ? 1 : -1)) } };
    }));

    try {
      await api.patch(`/api/volunteers/${volId}/availability`, { available: nowAvailable });
    } catch { /* Server will be retried next refresh */ }
  };

  const getMatches     = (request) => matchNGOsWithVolunteers(request, ngos, volunteers);
  const getVolunteersForNgo = (ngoId) => volunteers.filter(v => v.ngoId === ngoId);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AppContext.Provider value={{
      user, setUser, ngos, volunteers, patientRequests, notifications, loading,
      registerPatient, registerNgo, loginNgo, registerVolunteer, loginVolunteer,
      requestOTP, submitPatientRequest,
      updateNgoInventory, toggleVolunteerAvailability,
      getMatches, getVolunteersForNgo, logout, pushNotification,
      activeTab, setActiveTab,
      cities: Object.keys(CITY_COORDS),
      getPincodeCoords,
    }}>
      {children}
    </AppContext.Provider>
  );
}
