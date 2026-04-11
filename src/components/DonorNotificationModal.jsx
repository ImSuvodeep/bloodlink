/**
 * DonorNotificationModal
 *
 * Renders a full-screen popup for online volunteers when a patient
 * nearby needs their blood type. Shown at the App level so it appears
 * regardless of which page the volunteer is on.
 *
 * Uses Socket.IO 'donor:incoming' event.
 * Does NOT affect any existing feature.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { Heart, Clock, CheckCircle, XCircle, Navigation, Droplets } from 'lucide-react';

const COUNTDOWN_SECONDS = 120; // 2 minutes

export default function DonorNotificationModal() {
  const { user, volunteers } = useApp();
  const [incoming, setIncoming] = useState(null);   // { requestId, donorId, bloodGroup, emergency, km, patientArea }
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [answered, setAnswered] = useState(null);   // 'accepted' | 'rejected'
  const timerRef = useRef(null);

  // Only relevant for volunteer users
  const myVolunteer = user?.type === 'volunteer' ? user.data : null;
  const donorId = myVolunteer?.id;

  const { emit } = useSocket({
    'donor:incoming': (data) => {
      // Only react if this is for us
      if (data.donorId !== donorId) return;
      setIncoming(data);
      setSecondsLeft(COUNTDOWN_SECONDS);
      setAnswered(null);
    },
    'donor:cancel': ({ requestId }) => {
      if (incoming?.requestId === requestId) {
        setIncoming(null);
      }
    },
    'donor:confirmed': ({ requestId }) => {
      if (incoming?.requestId === requestId) {
        setAnswered('accepted');
        setTimeout(() => setIncoming(null), 3000);
      }
    },
  });

  // Register as online donor when logged in as volunteer
  useEffect(() => {
    if (!myVolunteer) return;
    const { getPincodeCoords } = window.__bloodlinkApp || {};
    const coords = getPincodeCoords?.(myVolunteer.pincode) || {};
    emit('register:donor', {
      donorId: myVolunteer.id,
      name: myVolunteer.name,
      phone: myVolunteer.phone,
      blood_group: myVolunteer.bloodGroup,
      pincode: myVolunteer.pincode,
      lat: coords.lat,
      lng: coords.lng,
      ngo_id: myVolunteer.ngoId,
      ngo_name: myVolunteer.ngoName,
    });
  }, [donorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!incoming || answered) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          // Auto-reject on timeout (server will handle next dispatch)
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [incoming, answered]);

  const handleAccept = useCallback(() => {
    if (!incoming) return;
    clearInterval(timerRef.current);
    emit('donor:accept', { requestId: incoming.requestId, donorId });
    setAnswered('accepted');
  }, [incoming, donorId, emit]);

  const handleReject = useCallback(() => {
    if (!incoming) return;
    clearInterval(timerRef.current);
    emit('donor:reject', { requestId: incoming.requestId, donorId });
    setAnswered('rejected');
    setTimeout(() => setIncoming(null), 2000);
  }, [incoming, donorId, emit]);

  if (!myVolunteer || !incoming) return null;

  const progressPct = (secondsLeft / COUNTDOWN_SECONDS) * 100;
  const isUrgent = secondsLeft < 30;
  const emergencyLabel = incoming.emergency === 'critical' ? 'CRITICAL' : incoming.emergency?.toUpperCase() || 'URGENT';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'var(--dark-card)',
        border: `2px solid ${isUrgent ? '#ef4444' : 'rgba(232,25,44,0.3)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        maxWidth: '440px', width: '100%',
        boxShadow: `0 0 60px rgba(232,25,44,${isUrgent ? '0.4' : '0.2'})`,
        animation: 'slideInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Pulsing top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, var(--red-500) ${progressPct}%, rgba(255,255,255,0.06) 0)`,
          transition: 'background 1s linear',
        }} />

        {answered === 'accepted' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={56} color="#4ade80" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: '#4ade80' }}>Thank You! 🙏</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              You've been matched! The patient will be notified with your contact details.
            </p>
          </div>
        ) : answered === 'rejected' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <XCircle size={56} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Request Declined</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>The system will find another match.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--gradient-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <Droplets size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--red-400)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🚨 Blood Request — {emergencyLabel}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '2px' }}>
                  Patient Nearby Needs Help
                </h3>
              </div>
            </div>

            {/* Details */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--dark-border)',
              borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px',
            }}>
              {[
                { icon: Droplets, label: 'Blood Type Needed', value: incoming.bloodGroup, color: 'var(--red-400)' },
                { icon: Navigation, label: 'Distance', value: incoming.km != null ? `~${incoming.km} km from you` : 'Nearby', color: '#60a5fa' },
                { icon: Heart, label: 'Area', value: incoming.patientArea || 'Nearby', color: '#4ade80' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <item.icon size={15} color={item.color} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem', flex: 1 }}>{item.label}</span>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              justifyContent: 'center', marginBottom: '20px',
              color: isUrgent ? '#ef4444' : 'var(--text-secondary)',
              fontSize: '0.88rem',
            }}>
              <Clock size={15} />
              <span>
                Respond within <strong style={{ fontSize: '1.1rem', color: isUrgent ? '#ef4444' : 'var(--red-400)' }}>
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </strong>
              </span>
            </div>

            {secondsLeft === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Time expired — system moving to next donor.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  id="donor-reject-btn"
                  className="btn btn-secondary"
                  onClick={handleReject}
                  style={{ padding: '14px' }}
                >
                  <XCircle size={18} /> Decline
                </button>
                <button
                  id="donor-accept-btn"
                  className="btn btn-primary"
                  onClick={handleAccept}
                  style={{ padding: '14px', fontSize: '1rem' }}
                >
                  <CheckCircle size={18} /> Accept
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
