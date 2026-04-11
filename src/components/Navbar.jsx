import React from 'react';
import { useApp } from '../context/AppContext';
import { Droplets, Heart, Building2, Zap, LogOut, User, UserCheck } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Droplets },
  { id: 'patient', label: 'Patient Portal', icon: Heart },
  { id: 'ngo', label: 'NGO Portal', icon: Building2 },
  { id: 'volunteer', label: 'Volunteer', icon: UserCheck },
  { id: 'match', label: 'Find Blood', icon: Zap },
];

export default function Navbar() {
  const { activeTab, setActiveTab, user, logout } = useApp();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <div className="logo" onClick={() => setActiveTab('home')} id="nav-logo">
          <div className="logo-icon">
            <Droplets size={18} />
          </div>
          Blood<span>Link</span>
        </div>

        {/* Links */}
        <div className="nav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'rgba(232,25,44,0.1)', border: '1px solid rgba(232,25,44,0.2)',
                borderRadius: 'var(--radius-full)', padding: '6px 12px',
              }}>
                <User size={13} color="var(--red-400)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--red-400)' }}>
                  {user.type === 'patient' ? user.data.fullName?.split(' ')[0] : user.data.name?.split(' ')[0]}
                </span>
              </div>
              <button
                id="nav-logout"
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Logout"
                style={{ padding: '7px 10px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              id="nav-get-started"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('patient')}
            >
              <Heart size={14} />
              Get Started
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .nav-links .nav-link { padding: 7px 9px; font-size: 0.78rem; }
        }
        @media (max-width: 700px) {
          .navbar-inner { flex-wrap: wrap; height: auto; padding: 10px 0; gap: 8px; }
          .nav-links { order: 3; width: 100%; justify-content: center; flex-wrap: wrap; }
          .nav-link { font-size: 0.76rem; padding: 6px 10px; }
        }
      `}</style>
    </nav>
  );
}
