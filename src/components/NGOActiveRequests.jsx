/**
 * NGOActiveRequests
 *
 * Added NON-DESTRUCTIVELY to the existing NGO dashboard Requests tab.
 * Shows live auto-match requests that are being dispatched.
 * Uses Socket.IO to receive real-time updates.
 *
 * Does NOT replace or break the existing request display logic.
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Zap, Droplets, MapPin, Clock, UserCheck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  Pending:   '#60a5fa',
  Searching: '#f59e0b',
  Requested: '#a78bfa',
  Accepted:  '#4ade80',
  Rejected:  '#ef4444',
  Cancelled: '#6b7280',
  Completed: '#4ade80',
};

export default function NGOActiveRequests({ ngo }) {
  const [requests, setRequests] = useState([]);
  const [connected, setConnected] = useState(false);

  const { emit, socket } = useSocket({
    'connect':    () => setConnected(true),
    'disconnect': () => setConnected(false),
    'ngo:newRequest': (req) => {
      setRequests(prev => {
        const exists = prev.find(r => r.request_id === req.request_id);
        if (exists) return prev;
        return [req, ...prev];
      });
    },
    'ngo:requestUpdate': ({ requestId, status, matched_donor_id, matched_ngo_id }) => {
      setRequests(prev => prev.map(r =>
        r.request_id === requestId
          ? { ...r, status, matched_donor_id, matched_ngo_id }
          : r
      ));
    },
  });

  // Check if already connected on mount (event fires before handler attaches)
  useEffect(() => {
    const s = socket?.current;
    if (s?.connected) setConnected(true);
  }, [socket]);


  // Register NGO online when component mounts
  useEffect(() => {
    if (!ngo) return;
    emit('register:ngo', {
      ngoId: ngo.id,
      name: ngo.name,
      inventory: ngo.inventory,
      lat: ngo.lat,
      lng: ngo.lng,
    });
    // Fetch any existing active requests
    fetch('http://localhost:3001/api/requests')
      .then(r => r.json())
      .then(data => setRequests(data.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled')))
      .catch(() => {}); // Silently fail if server is offline
  }, [ngo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeAgo = (iso) => {
    const diff = Math.round((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)} hr ago`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <Zap size={16} color="var(--red-400)" />
          <h5 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Auto-Match Active Requests</h5>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#4ade80' : '#6b7280',
            animation: connected ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ color: connected ? '#4ade80' : 'var(--text-muted)' }}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--dark-border)' }}>
          <Zap size={24} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
          No active auto-match requests yet.<br />
          Requests from patients using Automatic Match will appear here in real time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.slice(0, 10).map(req => {
            const color = STATUS_COLORS[req.status] || '#6b7280';
            return (
              <div key={req.request_id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {req.patient_name}
                      <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>{req.blood_group}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span><MapPin size={10} /> {req.pincode || 'No pincode'}</span>
                      <span><Clock size={10} /> {timeAgo(req.created_at)}</span>
                      {req.emergency_level === 'critical' && (
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>🚨 CRITICAL</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: `${color}22`, color }}>
                    {req.status}
                  </span>
                </div>
                {req.matched_donor_id && (
                  <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={11} /> Donor matched: {req.matched_donor_id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
