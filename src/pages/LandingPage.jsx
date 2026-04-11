import React from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Users, Zap, Shield, ArrowRight, MapPin, Droplets, ChevronRight } from 'lucide-react';


const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Patient Registers',
    desc: 'A patient in need fills out their blood group, hospital details and prescription to raise a request.',
    color: '#e8192c',
    icon: Heart,
  },
  {
    step: '02',
    title: 'NGO Logs Inventory',
    desc: 'Registered NGOs log updated blood unit counts they collect from donors by type and date.',
    color: '#f97316',
    icon: Droplets,
  },
  {
    step: '03',
    title: 'AI Matching Engine',
    desc: 'Our system instantly matches compatible blood groups within NGOs nearest to the patient\'s location.',
    color: '#a855f7',
    icon: Zap,
  },
  {
    step: '04',
    title: 'Instant Connection',
    desc: 'A prioritized list of matched NGOs is shown so patients can contact them immediately for help.',
    color: '#22c55e',
    icon: Shield,
  },
];

export default function LandingPage() {
  const { setActiveTab, ngos, volunteers } = useApp();

  const totalUnits = ngos.reduce((sum, n) =>
    sum + Object.values(n.inventory).reduce((s, v) => s + (Number(v) || 0), 0), 0
  );
  const verifiedNgos = ngos.filter(n => n.verified).length;
  const availableVols = volunteers.filter(v => v.available).length;

  const STATS = [
    { value: verifiedNgos || '—', label: 'Verified NGOs' },
    { value: volunteers.length || '—', label: 'Volunteers' },
    { value: totalUnits || '—', label: 'Blood Units Available' },
    { value: ngos.length > 0 ? `${Math.round((verifiedNgos / ngos.length) * 100)}%` : '—', label: 'NGOs Verified' },
  ];


  return (
    <div className="page-wrapper">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="container hero-content">
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="section-eyebrow">
              <Heart size={12} /> Blood Donor Network
            </div>
          </div>

          <h1 className="hero-title fade-in-up" style={{ animationDelay: '0.2s' }}>
            Every Drop of Blood
            <br />
            <span className="hero-title-gradient">Saves a Life</span>
          </h1>

          <p className="hero-subtitle fade-in-up" style={{ animationDelay: '0.3s' }}>
            Our intelligent matching platform connects patients in critical need with
            nearby NGO blood centers — instantly, accurately, and compassionately.
          </p>

          <div className="hero-actions fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button
              id="hero-patient-btn"
              className="btn btn-primary btn-lg"
              onClick={() => setActiveTab('patient')}
            >
              <Heart size={18} />
              I Need Blood
              <ArrowRight size={16} />
            </button>
            <button
              id="hero-ngo-btn"
              className="btn btn-secondary btn-lg"
              onClick={() => setActiveTab('ngo')}
            >
              <Users size={18} />
              Register as NGO
            </button>
          </div>

          {/* Floating Blood Drop */}
          <div className="hero-visual fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="pulse-container">
              <div className="pulse-ring pulse-ring-1" />
              <div className="pulse-ring pulse-ring-2" />
              <div className="pulse-center">
                <Droplets size={40} color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="container">
            <div className="stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="stat-item">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label-hero">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
              <Zap size={12} /> How It Works
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '12px' }}>
              Intelligent Blood Matching, <span style={{ color: 'var(--red-400)' }}>Made Simple</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
              Our platform bridges the gap between blood seekers and trusted NGOs in four seamless steps.
            </p>
          </div>

          <div className="how-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="how-card fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="how-step-num" style={{ color: item.color }}>
                  {item.step}
                </div>
                <div className="how-icon" style={{ background: `${item.color}1a`, border: `1px solid ${item.color}33` }}>
                  <item.icon size={24} color={item.color} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-bg" />
            <div className="cta-content">
              <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', marginBottom: '12px' }}>
                Ready to Make a Difference?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
                Whether you're a patient in need or an NGO with blood to share —
                join our network and be part of saving lives every day.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  id="cta-patient-btn"
                  className="btn btn-lg"
                  style={{ background: 'white', color: '#e8192c', fontWeight: '700' }}
                  onClick={() => setActiveTab('patient')}
                >
                  <Heart size={18} />
                  Request Blood Now
                </button>
                <button
                  id="cta-ngo-btn"
                  className="btn btn-lg"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                  onClick={() => setActiveTab('ngo')}
                >
                  <Users size={18} />
                  NGO Registration
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="logo" style={{ cursor: 'default' }}>
              <div className="logo-icon"><Droplets size={18} /></div>
              Blood<span>Link</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              © 2025 BloodLink. Connecting lives with care.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        /* Hero */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-top: 90px;
        }

        .hero-bg-orbs { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: float 8s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #e8192c, transparent);
          top: -150px; right: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #a50d24, transparent);
          bottom: 100px; left: -100px;
          animation-delay: -3s;
        }

        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #c8102e, transparent);
          top: 40%; left: 50%;
          animation-delay: -6s;
        }

        .hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 24px 40px;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.03em;
        }

        .hero-title-gradient {
          background: linear-gradient(135deg, #ff5757 0%, #e8192c 40%, #a50d24 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--text-secondary);
          max-width: 540px;
          margin-bottom: 36px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 60px;
        }

        /* Pulse */
        .hero-visual {
          margin-bottom: 20px;
        }

        .pulse-container {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          animation: float 4s ease-in-out infinite;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(232, 25, 44, 0.4);
          animation: pulse-ring 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        .pulse-ring-1 { width: 100%; height: 100%; animation-delay: 0s; }
        .pulse-ring-2 { width: 100%; height: 100%; animation-delay: 0.8s; }

        .pulse-center {
          width: 72px;
          height: 72px;
          background: var(--gradient-red);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-red-lg);
          z-index: 1;
        }

        /* Stats */
        .stats-bar {
          background: rgba(255,255,255,0.03);
          border-top: 1px solid var(--dark-border);
          padding: 24px 0;
          position: relative;
          z-index: 2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 8px;
        }

        .stat-value {
          display: block;
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--red-400);
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label-hero {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        /* How Section */
        .section { padding: 80px 0; }

        .how-section {
          background: linear-gradient(180deg, var(--dark-bg) 0%, rgba(20, 5, 8, 0.8) 100%);
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .how-card {
          background: var(--dark-card);
          border: 1px solid var(--dark-border);
          border-radius: var(--radius-xl);
          padding: 28px 22px;
          text-align: center;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .how-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gradient-red);
          opacity: 0;
          transition: var(--transition);
        }

        .how-card:hover {
          transform: translateY(-6px);
          border-color: rgba(232,25,44,0.2);
          box-shadow: var(--shadow-md);
        }

        .how-card:hover::before { opacity: 1; }

        .how-step-num {
          font-size: 3rem;
          font-weight: 900;
          opacity: 0.15;
          line-height: 1;
          margin-bottom: 16px;
        }

        .how-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        /* CTA */
        .cta-section { background: var(--dark-bg); }

        .cta-card {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          padding: 64px 40px;
          text-align: center;
        }

        .cta-bg {
          position: absolute;
          inset: 0;
          background: var(--gradient-red);
          opacity: 0.9;
        }

        .cta-content { position: relative; z-index: 1; }

        /* Footer */
        .footer {
          border-top: 1px solid var(--dark-border);
          padding: 24px 0;
          background: var(--dark-bg);
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .how-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 480px) {
          .how-grid { grid-template-columns: 1fr; }
          .footer-inner { justify-content: center; text-align: center; }
        }
      `}</style>
    </div>
  );
}
