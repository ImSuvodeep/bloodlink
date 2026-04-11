import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import {
  UserCheck, Heart, MapPin, Phone, User, Building2,
  CheckCircle, AlertCircle, ArrowRight, Hash, Shield,
  Navigation, Clock, Droplets, ToggleLeft, ToggleRight,
  Zap, LogIn, XCircle, Bell, BellOff, RefreshCw, LogOut,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Blood Group Selector ────────────────────────────────────
function BloodGroupSelector({ value, onChange }) {
  return (
    <div className="blood-group-grid">
      {BLOOD_GROUPS.map(bg => (
        <button key={bg} type="button" className={`blood-group-btn ${value === bg ? 'selected' : ''}`} onClick={() => onChange(bg)}>
          {bg}
        </button>
      ))}
    </div>
  );
}

// ─── Volunteer Login ──────────────────────────────────────────
function VolunteerLogin({ onSwitch }) {
  const { requestOTP, loginVolunteer } = useApp();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOTP = async () => {
    setError(''); setLoading(true);
    try {
      await requestOTP(phone.trim());
      setOtpSent(true);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Phone not found. Please register first.');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setError(''); setLoading(true);
    try {
      await loginVolunteer(phone.trim(), otp.trim());
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="card fade-in-up">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <LogIn size={24} color="white" />
        </div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Volunteer Login</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {step === 1 ? 'Enter your registered phone number to receive OTP' : 'Enter the OTP sent to your phone'}
        </p>
      </div>

      {step === 1 ? (
        <>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-group">
              <span className="input-icon"><Phone size={16} /></span>
              <input id="vol-login-phone" className="form-input" type="tel" placeholder="Your registered phone"
                value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRequestOTP()} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{error}</p>}
          </div>
          <button id="vol-login-btn" className="btn btn-primary" style={{ width: '100%' }} onClick={handleRequestOTP} disabled={!phone || loading}>
            {loading ? <span className="spinner" /> : <><Phone size={16} /> Send OTP</>}
          </button>
          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            💡 OTP will be printed in the <strong>server console</strong> (dev mode). Check the terminal running the server.
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#4ade80', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <CheckCircle size={14} /> OTP sent to {phone}. Check server console.
          </div>
          <div className="form-group">
            <label className="form-label">Enter OTP</label>
            <div className="input-group">
              <span className="input-icon">🔑</span>
              <input id="vol-login-otp" className="form-input" type="text" inputMode="numeric" placeholder="6-digit OTP"
                maxLength={6} value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{error}</p>}
          </div>
          <button id="vol-verify-otp-btn" className="btn btn-primary" style={{ width: '100%' }} onClick={handleVerifyOTP} disabled={otp.length < 6 || loading}>
            {loading ? <span className="spinner" /> : <><LogIn size={16} /> Verify OTP & Login</>}
          </button>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setStep(1); setOtp(''); setError(''); }}>
            ← Change Phone Number
          </button>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onSwitch}>New here? Register as Volunteer →</button>
      </div>
    </div>
  );
}


// ─── Volunteer Dashboard ──────────────────────────────────────
function VolunteerDashboard({ volunteer }) {
  const { ngos, patientRequests, toggleVolunteerAvailability, volunteers, logout, pushNotification } = useApp();
  const [acceptedReqs, setAcceptedReqs] = useState({});
  const [rejectedReqs, setRejectedReqs] = useState({});
  const [socketRequests, setSocketRequests] = useState([]); // from auto-match dispatch

  const myVol = volunteers.find(v => v.id === volunteer.id) || volunteer;
  const myNgo = ngos.find(n => n.id === myVol.ngoId);

  // Listen to real-time incoming dispatch requests via socket
  const { emit } = useSocket({
    'donor:incoming': (data) => {
      if (data.donorId !== myVol.id) return;
      setSocketRequests(prev => {
        const exists = prev.find(r => r.requestId === data.requestId);
        if (exists) return prev;
        return [{ ...data, type: 'dispatch', status: 'pending', arrivedAt: new Date() }, ...prev];
      });
    },
    'donor:cancel': ({ requestId }) => {
      setSocketRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'expired' } : r));
    },
    'donor:confirmed': ({ requestId }) => {
      setSocketRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'accepted' } : r));
    },
  });

  // Register as online donor
  useEffect(() => {
    if (!myVol) return;
    emit('register:donor', {
      donorId: myVol.id,
      name: myVol.name,
      phone: myVol.phone,
      blood_group: myVol.bloodGroup,
      pincode: myVol.pincode,
      ngo_id: myVol.ngoId,
    });
  }, [myVol.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual patient requests matching this volunteer's blood group
  const BLOOD_COMPAT = {
    'A+':  ['A+', 'AB+'],
    'A-':  ['A+', 'A-', 'AB+', 'AB-'],
    'B+':  ['B+', 'AB+'],
    'B-':  ['B+', 'B-', 'AB+', 'AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+', 'AB-'],
    'O+':  ['A+', 'B+', 'AB+', 'O+'],
    'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  };
  const canDonateFor = BLOOD_COMPAT[myVol.bloodGroup] || [];
  const pendingRequests = patientRequests.filter(r =>
    canDonateFor.includes(r.bloodGroup) &&
    !acceptedReqs[r.id] && !rejectedReqs[r.id]
  );

  const handleToggle = () => toggleVolunteerAvailability(myVol.id);

  const handleManualAccept = (req) => {
    setAcceptedReqs(prev => ({ ...prev, [req.id]: true }));
    pushNotification(
      `✅ You accepted to donate for ${req.fullName} (${req.bloodGroup}) at ${req.hospital}. Please contact (${req.phone || 'NGO'}) for coordination.`,
      'success'
    );
  };

  const handleManualReject = (req) => {
    setRejectedReqs(prev => ({ ...prev, [req.id]: true }));
    pushNotification(`Request from ${req.fullName} declined.`, 'info');
  };

  const handleSocketAccept = (req) => {
    emit('donor:accept', { requestId: req.requestId, donorId: myVol.id });
    setSocketRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: 'accepting' } : r));
  };

  const handleSocketReject = (req) => {
    emit('donor:reject', { requestId: req.requestId, donorId: myVol.id });
    setSocketRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: 'rejected' } : r));
  };

  const timeAgo = (date) => {
    const diff = Math.round((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)} hr ago`;
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Profile + Status Card */}
      <div className="card" style={{ background: 'var(--gradient-card)', border: '1px solid rgba(232,25,44,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: '800', color: 'white', flexShrink: 0,
          }}>
            {myVol.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{myVol.name}</h3>
              <span className="badge badge-red">{myVol.bloodGroup}</span>
              <span className={`badge ${myVol.available ? 'badge-green' : 'badge-orange'}`}>
                {myVol.available ? '● Online & Available' : '○ Unavailable'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span><Building2 size={11} /> {myNgo?.name || 'Unknown NGO'}</span>
              <span><Hash size={11} /> {myVol.pincode}</span>
              <span><Phone size={11} /> {myVol.phone}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Availability Toggle */}
        <div style={{
          marginTop: '16px', padding: '14px 16px',
          background: myVol.available ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${myVol.available ? 'rgba(74,222,128,0.2)' : 'var(--dark-border)'}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: myVol.available ? '#4ade80' : 'var(--text-secondary)' }}>
              {myVol.available ? 'You are Available for Donation' : 'You are Currently Unavailable'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {myVol.available
                ? 'Patients can see you and send requests. Toggle OFF to go offline.'
                : 'You won\'t receive requests. Toggle ON when ready to donate.'}
            </div>
          </div>
          <button
            id="vol-toggle-availability"
            onClick={handleToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer',
              background: myVol.available ? 'rgba(239,68,68,0.15)' : 'var(--gradient-red)',
              color: myVol.available ? '#ef4444' : 'white',
              fontWeight: '700', fontSize: '0.88rem',
              transition: 'var(--transition)',
            }}
          >
            {myVol.available ? <><ToggleRight size={20} /> Go Offline</> : <><ToggleLeft size={20} /> Go Online</>}
          </button>
        </div>
      </div>

      {/* Auto-Match Dispatch Requests (Socket.IO) */}
      {socketRequests.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(232,25,44,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={16} color="var(--red-400)" />
            <h4 style={{ fontSize: '0.95rem' }}>Auto-Dispatch Requests</h4>
            <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>{socketRequests.filter(r => r.status === 'pending').length} pending</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {socketRequests.map(req => (
              <div key={req.requestId} style={{
                padding: '14px', borderRadius: 'var(--radius-md)',
                background: req.status === 'pending' ? 'rgba(232,25,44,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${req.status === 'pending' ? 'rgba(232,25,44,0.25)' : 'var(--dark-border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span className="badge badge-red">{req.bloodGroup}</span>
                      <span className="badge" style={{ background: req.emergency === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.15)', color: req.emergency === 'critical' ? '#ef4444' : '#fbbf24' }}>
                        {req.emergency === 'critical' ? '🚨 Critical' : '⚡ Urgent'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(req.arrivedAt)}</span>
                    </div>
                    {req.km != null && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Navigation size={11} /> ~{req.km} km from patient · {req.patientArea || ''}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                    background: req.status === 'accepted' ? 'rgba(74,222,128,0.15)' : req.status === 'rejected' ? 'rgba(255,255,255,0.05)' : req.status === 'expired' ? 'rgba(255,255,255,0.05)' : 'rgba(232,25,44,0.15)',
                    color: req.status === 'accepted' ? '#4ade80' : req.status === 'rejected' || req.status === 'expired' ? 'var(--text-muted)' : 'var(--red-400)',
                  }}>
                    {req.status === 'accepting' ? 'Accepting...' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleSocketReject(req)}>
                      <XCircle size={14} /> Decline
                    </button>
                    <button id={`accept-dispatch-${req.requestId}`} className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={() => handleSocketAccept(req)}>
                      <CheckCircle size={14} /> Accept Request
                    </button>
                  </div>
                )}
                {req.status === 'accepted' && (
                  <div className="alert alert-success" style={{ marginTop: '10px', fontSize: '0.82rem' }}>
                    <CheckCircle size={14} /> You accepted! Patient has been notified with your contact details.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Patient Requests */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Shield size={16} color="var(--red-400)" />
          <h4 style={{ fontSize: '0.95rem', flex: 1 }}>Patient Requests Matching Your Blood ({myVol.bloodGroup})</h4>
          <span className="badge" style={{ background: pendingRequests.length > 0 ? 'rgba(232,25,44,0.15)' : 'rgba(255,255,255,0.05)', color: pendingRequests.length > 0 ? 'var(--red-400)' : 'var(--text-muted)', fontSize: '0.72rem' }}>
            {pendingRequests.length} pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
            <Shield size={28} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
            <p style={{ fontSize: '0.85rem' }}>No patient requests for your blood group right now.</p>
            <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>You'll see requests here when patients need {myVol.bloodGroup} blood.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.map(req => (
              <div key={req.id} style={{
                padding: '14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--dark-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>{req.fullName}</span>
                      <span className="badge badge-red">{req.bloodGroup}</span>
                      <span className={`badge ${req.urgency?.includes('Critical') ? 'badge-red' : 'badge-orange'}`}>
                        {req.urgency?.split(' ')[0]}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span><Building2 size={10} /> {req.hospital}</span>
                      <span><MapPin size={10} /> {req.city}{req.pincode ? ` · ${req.pincode}` : ''}</span>
                      <span><Clock size={10} /> {timeAgo(req.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {req.phone && (
                    <a href={`tel:${req.phone}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                      <Phone size={12} /> Call Patient
                    </a>
                  )}
                  <button
                    id={`vol-reject-${req.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', color: '#ef4444' }}
                    onClick={() => handleManualReject(req)}
                  >
                    <XCircle size={12} /> Decline
                  </button>
                  <button
                    id={`vol-accept-${req.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', flex: 1 }}
                    disabled={!myVol.available}
                    onClick={() => handleManualAccept(req)}
                    title={!myVol.available ? 'Set yourself as Available first' : ''}
                  >
                    <CheckCircle size={12} /> {myVol.available ? 'Accept & Donate' : 'Go Online First'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accepted / Rejected */}
        {(Object.keys(acceptedReqs).length > 0 || Object.keys(rejectedReqs).length > 0) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--dark-border)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Responded Requests
            </div>
            {patientRequests.filter(r => acceptedReqs[r.id] || rejectedReqs[r.id]).map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--dark-border)', fontSize: '0.83rem' }}>
                <span>{req.fullName} — {req.bloodGroup}</span>
                {acceptedReqs[req.id] && <span style={{ color: '#4ade80', fontWeight: '600' }}>✓ Accepted</span>}
                {rejectedReqs[req.id] && <span style={{ color: 'var(--text-muted)' }}>✗ Declined</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Registration Form ────────────────────────────────────────
function VolunteerForm({ onSubmit, ngos }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { getPincodeCoords } = useApp();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', bloodGroup: '',
    pincode: '', address: '', ngoId: '', availability: 'anytime',
    agreeTerms: false,
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const [pincodeInfo, setPincodeInfo] = useState(null);

  const handlePincodeChange = (val) => {
    set('pincode', val);
    if (val.length === 6) {
      const info = getPincodeCoords(val);
      setPincodeInfo(info);
    } else setPincodeInfo(null);
  };

  const step1Valid = form.name && form.phone && form.bloodGroup && form.pincode.length === 6;
  const step2Valid = form.ngoId && form.agreeTerms;

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    onSubmit(form);
    setLoading(false);
  };

  return (
    <div>
      <div className="tabs" style={{ marginBottom: '28px' }}>
        <button className={`tab ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Your Details</button>
        <button className={`tab ${step === 2 ? 'active' : ''}`} disabled={!step1Valid} onClick={() => step1Valid && setStep(2)}>2. Join NGO</button>
      </div>

      {step === 1 && (
        <div className="fade-in-up">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-group">
                <span className="input-icon"><User size={16} /></span>
                <input id="vol-name" className="form-input" placeholder="e.g. Amit Verma" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <div className="input-group">
                <span className="input-icon"><Phone size={16} /></span>
                <input id="vol-phone" className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group *</label>
            <BloodGroupSelector value={form.bloodGroup} onChange={bg => set('bloodGroup', bg)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Hash size={13} /> Your Pincode *
              <span style={{ fontSize: '0.75rem', color: 'var(--red-400)', fontWeight: '400' }}>(Used for distance matching)</span>
            </label>
            <div className="input-group">
              <span className="input-icon"><Navigation size={16} /></span>
              <input id="vol-pincode" className="form-input" placeholder="e.g. 400053" maxLength={6} value={form.pincode}
                onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))} />
            </div>
            {pincodeInfo && <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={12} /> {pincodeInfo.area}, {pincodeInfo.city}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Home Address</label>
            <div className="input-group">
              <span className="input-icon"><MapPin size={16} /></span>
              <input id="vol-address" className="form-input" placeholder="Street, Area, City" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <button id="vol-step1-next" className="btn btn-primary" style={{ width: '100%' }} disabled={!step1Valid} onClick={() => setStep(2)}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in-up">
          <div className="form-group">
            <label className="form-label">Choose NGO to Join *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ngos.length === 0 ? (
                <div className="alert" style={{ fontSize: '0.83rem' }}>
                  <AlertCircle size={14} /> No NGOs registered yet. Ask your NGO to register on the platform first.
                </div>
              ) : ngos.map(ngo => (
                <button key={ngo.id} type="button" id={`vol-ngo-${ngo.id}`} onClick={() => set('ngoId', ngo.id)} style={{
                  background: form.ngoId === ngo.id ? 'rgba(232,25,44,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${form.ngoId === ngo.id ? 'var(--red-500)' : 'var(--dark-border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                  transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: form.ngoId === ngo.id ? 'var(--gradient-red)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} color={form.ngoId === ngo.id ? 'white' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: form.ngoId === ngo.id ? 'var(--red-400)' : 'var(--text-primary)' }}>{ngo.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <MapPin size={10} /> {ngo.address} {ngo.pincode && <><Hash size={10} /> {ngo.pincode}</>}
                    </div>
                  </div>
                  {ngo.verified && <span className="badge badge-green" style={{ flexShrink: 0 }}>Verified</span>}
                </button>
              ))}
            </div>
          </div>

          <div onClick={() => set('agreeTerms', !form.agreeTerms)} style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
            padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px',
            background: form.agreeTerms ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${form.agreeTerms ? 'rgba(34,197,94,0.25)' : 'var(--dark-border)'}`,
            transition: 'var(--transition)',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '4px', border: `2px solid ${form.agreeTerms ? '#4ade80' : 'var(--dark-border)'}`, background: form.agreeTerms ? 'rgba(34,197,94,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {form.agreeTerms && <CheckCircle size={13} color="#4ade80" />}
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5', userSelect: 'none' }}>
              I agree to share my contact details and blood group. I will receive urgent notifications when patients nearby need my blood type.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button id="vol-submit-btn" className="btn btn-primary" style={{ flex: 2 }} disabled={!step2Valid || loading} onClick={handleSubmit}>
              {loading ? <span className="spinner" /> : <><UserCheck size={16} /> Join as Volunteer</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Volunteer Browse Panel ───────────────────────────────────
function VolunteerBrowse() {
  const { ngos, volunteers } = useApp();
  const [searchBg, setSearchBg] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const allCities = [...new Set(ngos.map(n => n.city))];
  const filteredVolunteers = volunteers.filter(v => {
    const ngo = ngos.find(n => n.id === v.ngoId);
    return (!searchBg || v.bloodGroup === searchBg) && (!searchCity || ngo?.city === searchCity);
  });

  return (
    <div className="fade-in-up">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {BLOOD_GROUPS.map(bg => {
          const count = volunteers.filter(v => v.bloodGroup === bg && v.available).length;
          return (
            <div key={bg} className="stat-card" style={{ padding: '12px 8px', cursor: 'pointer', border: searchBg === bg ? '1px solid var(--red-400)' : undefined }} onClick={() => setSearchBg(searchBg === bg ? '' : bg)}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--red-400)' }}>{bg}</div>
              <span className="stat-number" style={{ fontSize: '1.3rem' }}>{count}</span>
              <span className="stat-label" style={{ fontSize: '0.7rem' }}>available</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button className={`btn btn-sm ${searchBg === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchBg('')}>All Types</button>
        {BLOOD_GROUPS.map(bg => (
          <button key={bg} className={`btn btn-sm ${searchBg === bg ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSearchBg(searchBg === bg ? '' : bg)} id={`vol-filter-${bg.replace('+','pos').replace('-','neg')}`}>{bg}</button>
        ))}
        <select className="form-select" style={{ width: 'auto', minWidth: '130px' }} value={searchCity} onChange={e => setSearchCity(e.target.value)}>
          <option value="">All Cities</option>
          {allCities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredVolunteers.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No volunteers found with these filters.</div>
        )}
        {filteredVolunteers.map(v => {
          const ngo = ngos.find(n => n.id === v.ngoId);
          return (
            <div key={v.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--gradient-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                  {v.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700' }}>{v.name}</span>
                    <span className="badge badge-red">{v.bloodGroup}</span>
                    <span className={`badge ${v.available ? 'badge-green' : 'badge-orange'}`}>{v.available ? '✓ Available' : 'Unavailable'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><Hash size={10} /> {v.pincode}</span>
                    <span><Building2 size={10} /> {ngo?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────
export default function VolunteerPortal() {
  const { user, ngos, volunteers, registerVolunteer } = useApp();

  // If currently logged in as a volunteer → show dashboard
  const isVolunteer = user?.type === 'volunteer';

  const [tab, setTab] = useState('register'); // 'register' | 'login' | 'browse'

  const handleRegister = (formData) => {
    registerVolunteer(formData);
    // After register, user is set to volunteer → dashboard shows automatically
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', paddingTop: '90px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }} className="fade-in-up">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
            <UserCheck size={12} /> Volunteer Network
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '8px' }}>
            {isVolunteer ? <>Welcome, <span style={{ color: 'var(--red-400)' }}>{user.data.name}</span> 👋</> : <>Become a <span style={{ color: 'var(--red-400)' }}>Blood Hero</span></>}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
            {isVolunteer
              ? 'Manage your availability and respond to blood requests from your dashboard.'
              : 'Register with your nearest NGO. Get notified instantly when someone near you needs your blood type.'}
          </p>
        </div>

        {/* Volunteer Dashboard */}
        {isVolunteer ? (
          <VolunteerDashboard volunteer={user.data} />
        ) : (
          <>
            {/* Tabs */}
            <div className="tabs fade-in-up" style={{ marginBottom: '20px', animationDelay: '0.1s' }}>
              <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')} id="vol-tab-register">
                <UserCheck size={13} /> Register
              </button>
              <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')} id="vol-tab-login">
                <LogIn size={13} /> Login
              </button>
              <button className={`tab ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')} id="vol-tab-browse">
                Browse Volunteers ({volunteers.length})
              </button>
            </div>

            {tab === 'register' && (
              <div className="card fade-in-up" style={{ animationDelay: '0.15s' }}>
                <VolunteerForm onSubmit={handleRegister} ngos={ngos} />
              </div>
            )}

            {tab === 'login' && (
              <VolunteerLogin onSwitch={() => setTab('register')} />
            )}

            {tab === 'browse' && <VolunteerBrowse />}
          </>
        )}
      </div>
    </div>
  );
}
