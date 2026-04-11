/**
 * AutoMatchEngine
 *
 * A self-contained component added NON-DESTRUCTIVELY to the Patient Portal.
 * Only active when the toggle is set to "Automatic Match".
 * When "Manual Search" is active, nothing from this file is used.
 *
 * Contains:
 *  - ModeToggle          (Manual ↔ Automatic switch)
 *  - AutoMatchLauncher   (Start dispatch, passes donor/NGO list to server)
 *  - AutoMatchStatusBox  (Live status: Pending → Searching → Accepted → etc.)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { getPincodeCoords } from '../context/AppContext';
import {
  Zap, Hand, Clock, CheckCircle, XCircle, Search,
  Phone, MapPin, Droplets, UserCheck, AlertCircle, RefreshCw
} from 'lucide-react';

// Status → display config
const STATUS_CONFIG = {
  Pending:    { color: '#60a5fa', icon: Clock,       label: 'Request saved' },
  Searching:  { color: '#f59e0b', icon: Search,      label: 'Searching for donors...' },
  Requested:  { color: '#a78bfa', icon: Zap,         label: 'Contacting donor...' },
  Accepted:   { color: '#4ade80', icon: CheckCircle, label: 'Donor accepted! 🎉' },
  Rejected:   { color: '#ef4444', icon: XCircle,     label: 'No donors available' },
  Cancelled:  { color: 'var(--text-muted)', icon: XCircle, label: 'Request cancelled' },
  Completed:  { color: '#4ade80', icon: CheckCircle, label: 'Completed' },
};

// ─── Mode Toggle ─────────────────────────────────────────────
export function ModeToggle({ mode, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--dark-border)',
      borderRadius: 'var(--radius-full)',
      padding: '4px',
      gap: '2px',
      marginBottom: '28px',
      width: '100%',
      maxWidth: '380px',
    }}>
      {[
        { id: 'manual',    icon: Hand, label: 'Manual Search' },
        { id: 'automatic', icon: Zap,  label: 'Automatic Match' },
      ].map(option => (
        <button
          key={option.id}
          id={`mode-toggle-${option.id}`}
          onClick={() => onChange(option.id)}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: mode === option.id ? 'var(--gradient-red)' : 'transparent',
            color: mode === option.id ? 'white' : 'var(--text-muted)',
            fontWeight: mode === option.id ? '700' : '500',
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'var(--transition)',
            whiteSpace: 'nowrap',
          }}
        >
          <option.icon size={14} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ─── Live Status Box ─────────────────────────────────────────
function StatusBox({ status, message, contact, requestId, onCancel, onReset }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  const isLive = status === 'Searching' || status === 'Requested';
  const isDone = status === 'Accepted' || status === 'Rejected' || status === 'Cancelled';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1.5px solid ${cfg.color}44`,
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      marginTop: '20px',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `${cfg.color}1a`, border: `2px solid ${cfg.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          animation: isLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}>
          <Icon size={20} color={cfg.color} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: cfg.color }}>{cfg.label}</div>
          {message && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>{message}</div>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="badge" style={{ background: `${cfg.color}22`, color: cfg.color, fontSize: '0.72rem' }}>
            {status}
          </span>
        </div>
      </div>

      {/* Animated progress bar while searching */}
      {isLive && (
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: '40%',
            background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Steps display */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['Pending', 'Searching', 'Requested', 'Accepted'].map((s, i) => {
          const steps = ['Pending', 'Searching', 'Requested', 'Accepted'];
          const currentIdx = steps.indexOf(status);
          const sDone = currentIdx > i;
          const sCurrent = currentIdx === i;
          return (
            <React.Fragment key={s}>
              <div style={{
                fontSize: '0.72rem', fontWeight: '600', padding: '3px 8px',
                borderRadius: '20px',
                background: sDone ? '#4ade8022' : sCurrent ? `${cfg.color}22` : 'rgba(255,255,255,0.04)',
                color: sDone ? '#4ade80' : sCurrent ? cfg.color : 'var(--text-muted)',
                border: `1px solid ${sDone ? '#4ade80' : sCurrent ? cfg.color : 'transparent'}44`,
              }}>
                {sDone ? '✓ ' : ''}{s}
              </div>
              {i < 3 && <div style={{ width: '16px', height: '1px', background: sDone ? '#4ade8055' : 'var(--dark-border)' }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Matched contact — revealed only after acceptance */}
      {status === 'Accepted' && contact && (
        <div style={{
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            ✅ Matched — Contact Details
          </div>
          {[
            { label: 'Name', value: contact.name },
            { label: 'Phone', value: contact.phone },
            contact.bloodGroup && { label: 'Blood Group', value: contact.bloodGroup },
            contact.ngoName && { label: 'NGO / Center', value: contact.ngoName },
            contact.km && { label: 'Distance', value: `~${contact.km} km` },
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{row.label}</span>
              <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{row.value}</span>
            </div>
          ))}
          <a href={`tel:${contact.phone}`} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
            <Phone size={15} /> Call Now
          </a>
        </div>
      )}

      {status === 'Rejected' && (
        <div className="alert" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', marginBottom: '12px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          No available donors matched your request. Try the Manual Search or contact NGOs directly.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {isLive && (
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel Request
          </button>
        )}
        {isDone && (
          <button className="btn btn-secondary btn-sm" onClick={onReset}>
            <RefreshCw size={14} /> New Request
          </button>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

// ─── Auto Match Launcher ─────────────────────────────────────
export function AutoMatchLauncher({ formData, onReset }) {
  const { ngos, volunteers } = useApp();
  const [requestId] = useState(() => `req-${Date.now()}`);
  const [status, setStatus] = useState('Pending');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState(null);
  const [started, setStarted] = useState(false);

  const { emit } = useSocket({
    'request:status': ({ requestId: rId, status: s, message: m }) => {
      if (rId !== requestId) return;
      setStatus(s);
      if (m) setMessage(m);
    },
    'request:matched': ({ requestId: rId, contact: c }) => {
      if (rId !== requestId) return;
      setStatus('Accepted');
      setContact(c);
    },
  });

  // Prepare donor data with coordinates for server
  const buildDonorList = useCallback(() => {
    return volunteers
      .filter(v => v.available)
      .map(v => {
        const coords = getPincodeCoords(v.pincode) || {};
        return {
          id: v.id,
          name: v.name,
          phone: v.phone,
          blood_group: v.bloodGroup,
          pincode: v.pincode,
          lat: coords.lat,
          lng: coords.lng,
          ngo_id: v.ngoId,
          ngo_name: ngos.find(n => n.id === v.ngoId)?.name || '',
          available: true,
        };
      });
  }, [volunteers, ngos]);

  const handleStart = () => {
    const patientCoords = getPincodeCoords(formData.pincode);
    const requestPayload = {
      request_id: requestId,
      patient_id: formData.patientId || `pat-${Date.now()}`,
      patient_name: formData.fullName,
      patient_phone: formData.phone,
      blood_group: formData.bloodGroup,
      pincode: formData.pincode,
      emergency_level: formData.urgency?.toLowerCase().includes('critical') ? 'critical' : 'urgent',
      patient_lat: patientCoords?.lat,
      patient_lng: patientCoords?.lng,
      patient_area: patientCoords?.area || formData.city,
    };

    const ngoList = ngos.map(n => ({
      ...n,
      lat: getPincodeCoords(n.pincode)?.lat || n.lat,
      lng: getPincodeCoords(n.pincode)?.lng || n.lng,
    }));

    // Register patient socket
    emit('register:patient', { requestId, patientId: requestPayload.patient_id });
    // Fire the match
    emit('autoMatch:start', { request: requestPayload, donors: buildDonorList(), ngos: ngoList });

    setStatus('Searching');
    setStarted(true);
  };

  const handleCancel = () => {
    emit('autoMatch:cancel', { requestId });
    setStatus('Cancelled');
  };

  return (
    <div>
      {!started ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(232,25,44,0.06)', border: '1px solid rgba(232,25,44,0.15)',
            borderRadius: 'var(--radius-xl)', padding: '28px', marginBottom: '20px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--gradient-red)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              <Zap size={28} color="white" />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Ready to Auto-Dispatch</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              The system will automatically contact the nearest available donor or NGO with <strong>{formData.bloodGroup}</strong> blood. You'll be notified the moment someone accepts.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
              {[
                { icon: UserCheck, label: `${volunteers.filter(v => v.available).length} donors available` },
                { icon: Droplets, label: `${ngos.length} NGOs in network` },
                { icon: MapPin, label: formData.pincode ? `Near ${formData.pincode}` : formData.city },
              ].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '5px 10px', borderRadius: '20px' }}>
                  <item.icon size={13} color="var(--red-400)" /> {item.label}
                </span>
              ))}
            </div>
            <button
              id="start-automatch-btn"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '1rem' }}
              onClick={handleStart}
            >
              <Zap size={20} /> Start Automatic Match
            </button>
          </div>
        </div>
      ) : (
        <StatusBox
          status={status}
          message={message}
          contact={contact}
          requestId={requestId}
          onCancel={handleCancel}
          onReset={onReset}
        />
      )}
    </div>
  );
}
