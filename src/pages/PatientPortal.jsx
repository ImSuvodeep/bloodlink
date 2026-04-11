import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ModeToggle, AutoMatchLauncher } from '../components/AutoMatchEngine';
import {
  Heart, User, Mail, Phone, MapPin, Calendar, FileText,
  AlertCircle, CheckCircle, ArrowRight, Droplets, Building2,
  Hash, Navigation, UserCheck, Zap, Hand
} from 'lucide-react';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['Critical (< 24 hrs)', 'Urgent (1–3 days)', 'Moderate (4–7 days)', 'Planned (> 7 days)'];

function BloodGroupSelector({ value, onChange }) {
  return (
    <div className="blood-group-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {BLOOD_GROUPS.map(bg => (
        <button
          key={bg}
          type="button"
          className={`blood-group-btn ${value === bg ? 'selected' : ''}`}
          onClick={() => onChange(bg)}
        >
          {bg}
        </button>
      ))}
    </div>
  );
}

function StepOne({ formData, setFormData, onNext }) {
  const isValid = formData.fullName && formData.age && formData.gender && formData.phone && formData.email;

  return (
    <div className="fade-in-up">
      <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Personal Information</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '28px' }}>
        Tell us about yourself so NGOs can reach you
      </p>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <div className="input-group">
            <span className="input-icon"><User size={16} /></span>
            <input
              id="patient-name"
              className="form-input"
              placeholder="e.g. Priya Sharma"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Age *</label>
          <input
            id="patient-age"
            className="form-input"
            type="number"
            min="1"
            max="120"
            placeholder="e.g. 35"
            value={formData.age}
            onChange={e => setFormData({ ...formData, age: e.target.value })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Gender *</label>
          <select
            id="patient-gender"
            className="form-select"
            value={formData.gender}
            onChange={e => setFormData({ ...formData, gender: e.target.value })}
          >
            <option value="">Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <div className="input-group">
            <span className="input-icon"><Phone size={16} /></span>
            <input
              id="patient-phone"
              className="form-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <div className="input-group">
          <span className="input-icon"><Mail size={16} /></span>
          <input
            id="patient-email"
            className="form-input"
            type="email"
            placeholder="priya@example.com"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <button
        id="patient-step1-next"
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: '8px' }}
        onClick={onNext}
        disabled={!isValid}
      >
        Continue
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

function StepTwo({ formData, setFormData, onNext, onBack, cities }) {
  const { getPincodeCoords } = useApp();
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const isValid = formData.bloodGroup && formData.city && formData.hospital && formData.urgency;

  const handlePincode = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 6);
    setFormData({ ...formData, pincode: v });
    if (v.length === 6) {
      const info = getPincodeCoords(v);
      setPincodeInfo(info);
      if (info?.city && !formData.city) setFormData({ ...formData, pincode: v, city: info.city });
    } else setPincodeInfo(null);
  };

  return (
    <div className="fade-in-up">
      <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Medical Details</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '28px' }}>
        Help us find the right blood match for you
      </p>

      <div className="form-group">
        <label className="form-label">Blood Group Required *</label>
        <BloodGroupSelector
          value={formData.bloodGroup}
          onChange={bg => setFormData({ ...formData, bloodGroup: bg })}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Hash size={12} /> Your Pincode
            <span style={{ fontSize: '0.72rem', color: 'var(--red-400)', fontWeight: '400' }}>
              (for precise matching)
            </span>
          </label>
          <div className="input-group">
            <span className="input-icon"><Navigation size={16} /></span>
            <input
              id="patient-pincode"
              className="form-input"
              placeholder="e.g. 400053"
              maxLength={6}
              value={formData.pincode}
              onChange={e => handlePincode(e.target.value)}
            />
          </div>
          {pincodeInfo && (
            <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={11} /> {pincodeInfo.area}, {pincodeInfo.city}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">City *</label>
          <div className="input-group">
            <span className="input-icon"><MapPin size={16} /></span>
            <select
              id="patient-city"
              className="form-select"
              style={{ paddingLeft: '42px' }}
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            >
              <option value="">Select city</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Hospital Name *</label>
          <div className="input-group">
            <span className="input-icon"><Building2 size={16} /></span>
            <input
              id="patient-hospital"
              className="form-input"
              placeholder="e.g. Apollo Hospital, Mumbai"
              value={formData.hospital}
              onChange={e => setFormData({ ...formData, hospital: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Units Needed</label>
          <input
            id="patient-units"
            className="form-input"
            type="number"
            min="1"
            placeholder="e.g. 2"
            value={formData.units}
            onChange={e => setFormData({ ...formData, units: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Urgency Level *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {URGENCY_LEVELS.map(u => (
            <button
              key={u}
              type="button"
              className={`urgency-btn ${formData.urgency === u ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, urgency: u })}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ flex: 1 }}>Back</button>
        <button
          id="patient-step2-next"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!isValid}
          style={{ flex: 2 }}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        .urgency-btn {
          padding: 10px;
          border: 1.5px solid var(--dark-border);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
          font-family: 'Inter', sans-serif;
        }
        .urgency-btn:hover { border-color: var(--red-500); color: var(--red-400); background: rgba(232,25,44,0.06); }
        .urgency-btn.selected { border-color: var(--red-500); background: rgba(232,25,44,0.12); color: var(--red-400); }
      `}</style>
    </div>
  );
}



function StepThree({ formData, setFormData, onSubmit, onBack, loading }) {
  return (
    <div className="fade-in-up">
      <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Prescription & Details</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '28px' }}>
        Provide prescription or additional medical information
      </p>

      <div className="form-group">
        <label className="form-label">Doctor's Name</label>
        <div className="input-group">
          <span className="input-icon"><User size={16} /></span>
          <input
            id="patient-doctor"
            className="form-input"
            placeholder="e.g. Dr. Arvind Mehta"
            value={formData.doctorName}
            onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Prescription / Medical Notes *</label>
        <textarea
          id="patient-prescription"
          className="form-textarea"
          placeholder="Describe the medical condition, diagnosis, or paste prescription notes here..."
          rows={4}
          value={formData.prescription}
          onChange={e => setFormData({ ...formData, prescription: e.target.value })}
        />
        <span className="form-hint">Include diagnosis, required procedure, and urgency reason</span>
      </div>

      <div className="form-group">
        <label className="form-label">Prescription Reference ID</label>
        <div className="input-group">
          <span className="input-icon"><FileText size={16} /></span>
          <input
            id="patient-prescription-id"
            className="form-input"
            placeholder="e.g. RX-2025-00842"
            value={formData.prescriptionId}
            onChange={e => setFormData({ ...formData, prescriptionId: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Additional Notes</label>
        <textarea
          className="form-textarea"
          placeholder="Any allergies, special conditions, or specific requirements..."
          rows={2}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        Your data is kept private and shared only with matched NGOs to fulfill your request.
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ flex: 1 }} disabled={loading}>
          Back
        </button>
        <button
          id="patient-submit-btn"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!formData.prescription || loading}
          style={{ flex: 2 }}
        >
          {loading ? <span className="spinner" /> : <><Heart size={18} /> Find NGOs</>}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ request, matches, onNewRequest }) {
  const { pushNotification } = useApp();
  const [notifiedVols, setNotifiedVols] = useState({});
  const [expandedNgo, setExpandedNgo] = useState(null);

  const handleNotifyVolunteer = (vol, ngo) => {
    pushNotification(
      `📲 Notification sent to ${vol.name} (${vol.bloodGroup}) at ${ngo.name} — patient ${request.fullName} needs blood urgently!`,
      'alert'
    );
    setNotifiedVols(prev => ({ ...prev, [vol.id]: true }));
    // Auto-reset after 5s so you can notify again
    setTimeout(() => setNotifiedVols(prev => ({ ...prev, [vol.id]: false })), 5000);
  };

  return (
    <div className="fade-in-up">
      <div className="alert alert-success">
        <CheckCircle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Request Submitted!</strong> We found {matches.length} matching NGO{matches.length !== 1 ? 's' : ''} for blood group <strong>{request.bloodGroup}</strong>.
        </div>
      </div>

      {/* Request Summary */}
      <div className="card" style={{ marginBottom: '28px', background: 'var(--gradient-card)', border: '1px solid rgba(232,25,44,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Your Blood Request</div>
            <h4 style={{ fontSize: '1rem' }}>Submitted {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</h4>
          </div>
          <span className="badge badge-red" style={{ fontSize: '1rem', padding: '6px 14px' }}>
            {request.bloodGroup}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { label: 'Patient', value: request.fullName },
            { label: 'Hospital', value: request.hospital },
            { label: 'City', value: request.city },
            { label: 'Urgency', value: request.urgency },
          ].map((item, i) => (
            <div key={i}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '500', marginTop: '2px' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Matched NGOs */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplets size={18} color="var(--red-400)" />
          Matched NGOs &amp; Volunteers
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Sorted by proximity &amp; blood availability · Click an NGO to see its volunteers
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No NGOs found with {request.bloodGroup} blood in {request.city}.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>Try expanding to nearby cities.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {matches.map((ngo, i) => {
            const isExpanded = expandedNgo === ngo.id;
            const availVols = (ngo.matchedVolunteers || []).filter(v => v.available);
            const allVols   = ngo.matchedVolunteers || [];

            return (
              <div key={ngo.id} className="match-card" style={{ animationDelay: `${i * 0.08}s` }}>
                {/* NGO Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1rem' }}>{ngo.name}</h4>
                      {ngo.verified && <span className="badge badge-green">Verified</span>}
                      {i === 0 && <span className="badge badge-red">Best Match</span>}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {ngo.address}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--red-400)', lineHeight: 1 }}>
                      {ngo.availableUnits ?? ngo.available}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>units available</div>
                  </div>
                </div>

                {/* NGO Meta */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {ngo.ngoDistance ?? ngo.distance} km away
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {ngo.phone}
                  </span>
                  {allVols.length > 0 && (
                    <span style={{ fontSize: '0.82rem', color: availVols.length > 0 ? '#4ade80' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} /> {availVols.length}/{allVols.length} volunteers available
                    </span>
                  )}
                </div>

                <div className="match-score-bar">
                  <div className="match-score-fill" style={{ width: `${ngo.score}%` }} />
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Match Score: {ngo.score}%
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {allVols.length > 0 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpandedNgo(isExpanded ? null : ngo.id)}
                        style={{ fontSize: '0.78rem' }}
                      >
                        <UserCheck size={13} />
                        {isExpanded ? 'Hide' : 'See'} Volunteers ({allVols.length})
                      </button>
                    )}
                    <a
                      href={`tel:${ngo.phone}`}
                      className="btn btn-primary btn-sm"
                      id={`contact-ngo-${ngo.id}`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Phone size={13} /> Contact NGO
                    </a>
                  </div>
                </div>

                {/* Volunteer List — shown when expanded */}
                {isExpanded && allVols.length > 0 && (
                  <div style={{
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: '1px solid var(--dark-border)',
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                      Volunteers at {ngo.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {allVols.map(vol => (
                        <div key={vol.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: vol.available ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${vol.available ? 'rgba(74,222,128,0.2)' : 'var(--dark-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px',
                          flexWrap: 'wrap',
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: vol.available ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.82rem', fontWeight: '800',
                            color: vol.available ? '#4ade80' : 'var(--text-muted)',
                          }}>
                            {vol.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>{vol.name}</span>
                              <span className="badge badge-red" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>{vol.bloodGroup}</span>
                              <span className={`badge ${vol.available ? 'badge-green' : ''}`}
                                style={!vol.available ? { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' } : {}}>
                                {vol.available ? '● Available' : '○ Unavailable'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {vol.distanceKm != null && <span><Navigation size={10} /> ~{vol.distanceKm} km</span>}
                              {vol.pincode && <span><Hash size={10} /> {vol.pincode}</span>}
                              {vol.phone && <span><Phone size={10} /> {vol.phone}</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                            {vol.phone && (
                              <a href={`tel:${vol.phone}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                                <Phone size={12} /> Call
                              </a>
                            )}
                            <button
                              id={`notify-vol-${vol.id}`}
                              className="btn btn-sm"
                              disabled={!vol.available || notifiedVols[vol.id]}
                              onClick={() => handleNotifyVolunteer(vol, ngo)}
                              style={{
                                fontSize: '0.75rem', padding: '6px 12px',
                                background: notifiedVols[vol.id]
                                  ? 'rgba(74,222,128,0.15)'
                                  : vol.available
                                    ? 'var(--gradient-red)'
                                    : 'rgba(255,255,255,0.05)',
                                color: notifiedVols[vol.id] ? '#4ade80' : vol.available ? 'white' : 'var(--text-muted)',
                                border: 'none', borderRadius: 'var(--radius-md)',
                                cursor: vol.available && !notifiedVols[vol.id] ? 'pointer' : 'not-allowed',
                                transition: 'var(--transition)',
                                display: 'flex', alignItems: 'center', gap: '5px',
                              }}
                            >
                              {notifiedVols[vol.id]
                                ? <><CheckCircle size={12} /> Sent!</>
                                : <><Zap size={12} /> Notify</>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        id="new-request-btn"
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: '24px' }}
        onClick={onNewRequest}
      >
        Submit Another Request
      </button>
    </div>
  );
}

export default function PatientPortal() {
  const { registerPatient, submitPatientRequest, getMatches, cities } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [request, setRequest] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '', phone: '', email: '',
    bloodGroup: '', city: '', hospital: '', units: '1', urgency: '', pincode: '',
    doctorName: '', prescription: '', prescriptionId: '', notes: '',
  });

  // Mode: 'manual' (existing system) | 'automatic' (new auto-dispatch)
  const [dispatchMode, setDispatchMode] = useState('manual');
  // Auto-match submitted form data (passed to AutoMatchLauncher)
  const [autoMatchData, setAutoMatchData] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800)); // Simulated AI matching delay
    const user = registerPatient({ fullName: formData.fullName, phone: formData.phone, email: formData.email });
    const req = submitPatientRequest(formData);
    setRequest(req);

    if (dispatchMode === 'automatic') {
      // Hand off to auto-match — do NOT run manual getMatches
      setAutoMatchData({ ...formData, request_id: req.id });
      setLoading(false);
      return;
    }

    const found = getMatches(formData);
    setMatches(found);
    setLoading(false);
  };

  const stepLabels = ['Personal Info', 'Medical Details', 'Prescription'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', paddingTop: '90px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }} className="fade-in-up">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
            <Heart size={12} /> Patient Portal
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '8px' }}>
            Request <span style={{ color: 'var(--red-400)' }}>Blood</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Fill in the details below and our AI will instantly match you with nearby NGOs
          </p>
        </div>

        {/* ── MODE TOGGLE (new — non-breaking) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }} className="fade-in-up">
          <ModeToggle mode={dispatchMode} onChange={setDispatchMode} />
        </div>
        {dispatchMode === 'automatic' && (
          <div className="alert alert-info fade-in" style={{ marginBottom: '20px', fontSize: '0.83rem' }}>
            <Zap size={14} style={{ flexShrink: 0, color: 'var(--red-400)' }} />
            <span><strong>Automatic Mode:</strong> After submitting, the system contacts the nearest donors instantly — like Uber for blood.</span>
          </div>
        )}
        {dispatchMode === 'manual' && (
          <div className="alert" style={{ marginBottom: '20px', fontSize: '0.83rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
            <Hand size={14} style={{ flexShrink: 0 }} />
            <span><strong>Manual Mode:</strong> You'll see a ranked list of nearby NGOs and volunteers to contact yourself.</span>
          </div>
        )}

        {matches === null && (
          <>
            {/* Progress */}
            <div className="progress-steps fade-in-up" style={{ animationDelay: '0.1s' }}>
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const status = step > stepNum ? 'completed' : step === stepNum ? 'active' : '';
                return (
                  <React.Fragment key={i}>
                    <div className={`progress-step ${status}`}>
                      <div className="progress-step-circle">
                        {step > stepNum ? <CheckCircle size={14} /> : stepNum}
                      </div>
                      <span className="progress-step-label">{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className={`progress-line ${step > stepNum ? 'completed' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Form Card */}
            <div className="card fade-in-up" style={{ animationDelay: '0.2s' }}>
              {step === 1 && (
                <StepOne formData={formData} setFormData={setFormData} onNext={() => setStep(2)} />
              )}
              {step === 2 && (
                <StepTwo formData={formData} setFormData={setFormData} cities={cities}
                  onNext={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <StepThree formData={formData} setFormData={setFormData} loading={loading}
                  onSubmit={handleSubmit} onBack={() => setStep(2)} />
              )}
            </div>
          </>
        )}

        {/* ── AUTO-MATCH RESULTS (new — only shown in automatic mode) ── */}
        {autoMatchData !== null && (
          <div className="card fade-in-up">
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--red-400)" /> Automatic Dispatch
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Request for <strong>{autoMatchData.fullName}</strong> — {autoMatchData.bloodGroup} blood</p>
            </div>
            <AutoMatchLauncher
              formData={autoMatchData}
              onReset={() => {
                setAutoMatchData(null);
                setRequest(null);
                setStep(1);
                setDispatchMode('manual');
                setFormData({
                  fullName: '', age: '', gender: '', phone: '', email: '',
                  bloodGroup: '', city: '', hospital: '', units: '1', urgency: '', pincode: '',
                  doctorName: '', prescription: '', prescriptionId: '', notes: '',
                });
              }}
            />
          </div>
        )}

        {/* ── MANUAL RESULTS (existing — completely unchanged) ── */}
        {matches !== null && (
          <div className="card fade-in-up">
            <Dashboard
              request={request}
              matches={matches}
              onNewRequest={() => {
                setMatches(null);
                setRequest(null);
                setStep(1);
                setFormData({
                  fullName: '', age: '', gender: '', phone: '', email: '',
                  bloodGroup: '', city: '', hospital: '', units: '1', urgency: '', pincode: '',
                  doctorName: '', prescription: '', prescriptionId: '', notes: '',
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
