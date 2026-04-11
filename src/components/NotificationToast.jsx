import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: { icon: CheckCircle, color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
  alert: { icon: Bell, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)' },
  info: { icon: Info, color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  error: { icon: AlertCircle, color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
};

function ToastItem({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const cfg = ICONS[notification.type] || ICONS.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className="toast-item"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Phone notch indicator */}
      <div className="toast-phone-bar" style={{ background: cfg.color }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px' }}>
        <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: cfg.color, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '3px' }}>
            {notification.type === 'alert' ? '📳 BloodLink Alert' : notification.type === 'success' ? '✅ BloodLink' : '💬 BloodLink'}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4', margin: 0 }}>
            {notification.msg}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {notification.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, pushNotification } = useApp();
  const [dismissed, setDismissed] = useState([]);

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id]);
  };

  const visible = notifications.filter(n => !dismissed.includes(n.id));

  return (
    <>
      <div className="toast-container">
        {visible.map(n => (
          <ToastItem key={n.id} notification={n} onDismiss={handleDismiss} />
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 360px;
          width: calc(100vw - 40px);
          pointer-events: none;
        }

        .toast-item {
          pointer-events: all;
          border-radius: 14px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          overflow: hidden;
          position: relative;
        }

        .toast-phone-bar {
          height: 3px;
          width: 100%;
        }
      `}</style>
    </>
  );
}
