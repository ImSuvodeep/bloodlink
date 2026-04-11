import React, { useState } from 'react';
import { useApp, BLOOD_COMPATIBILITY } from '../context/AppContext';
import {
  Zap, MapPin, Phone, Droplets, Search, Filter,
  CheckCircle, AlertCircle, Building2, ArrowRight, Info,
  UserCheck, Hash, Navigation, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function BGCompatibilityTable() {
  return (
    <div className="card" style={{ overflow: 'auto', marginTop: '16px' }}>
      <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={16} color="var(--red-400)" />
        Blood Type Compatibility Chart
      </h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--dark-border)' }}>Patient Type</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--dark-border)' }}>Compatible Donors</th>
          </tr>
        </thead>
        <tbody>
          {BLOOD_GROUPS.map((bg, i) => (
            <tr key={bg} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--dark-border)' }}>
                <span className="badge badge-red">{bg}</span>
              </td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--dark-border)' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {BLOOD_COMPATIBILITY[bg].map(c => (
                    <span key={c} className={`badge ${c === bg ? 'badge-red' : 'badge-blue'}`}>{c}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolunteerCard({ volunteer, ngoName }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--dark-border)',
      borderRadius: 'var(--radius-md)',
      flexWrap: 'wrap',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: volunteer.available ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${volunteer.available ? 'rgba(34,197,94,0.3)' : 'var(--dark-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '800', fontSize: '0.9rem', color: volunteer.available ? '#4ade80' : 'var(--text-muted)',
        flexShrink: 0,
      }}>
        {volunteer.name.charAt(0)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {volunteer.name}
          <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>{volunteer.bloodGroup}</span>
          {volunteer.available
            ? <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Ready</span>
            : <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>Unavailable</span>
          }
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
          <span><Hash size={10} /> {volunteer.pincode}</span>
          <span><Navigation size={10} /> {volunteer.distanceKm} km away</span>
          <span><Building2 size={10} /> {ngoName}</span>
        </div>
      </div>
      {volunteer.available && (
        <a href={`tel:${volunteer.phone}`} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
          <Phone size={12} /> Call
        </a>
      )}
    </div>
  );
}

function NGOResultCard({ ngo, index, patientPincode, ngos }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="match-card slide-in-right" style={{ animationDelay: `${index * 0.07}s` }}>
      {/* NGO Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              width: 28, height: 28, borderRadius: '6px',
              background: 'var(--gradient-red)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: '800', color: 'white',
            }}>
              {index + 1}
            </span>
            <h4 style={{ fontSize: '1rem' }}>{ngo.name}</h4>
            {ngo.verified && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
            {index === 0 && <span className="badge badge-red">🏆 Best Match</span>}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {ngo.address}
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} /> {ngo.ngoDistance} km from your pincode
            </span>
            {ngo.pincode && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Hash size={12} /> {ngo.pincode}
              </span>
            )}
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} /> {ngo.phone}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '90px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--red-400)', lineHeight: 1 }}>
            {ngo.availableUnits}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>blood units</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--red-400)', fontWeight: '700', marginTop: '2px' }}>
            {ngo.score}% match
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="match-score-bar">
        <div className="match-score-fill" style={{ width: `${ngo.score}%` }} />
      </div>

      {/* Volunteers Toggle */}
      {ngo.matchedVolunteers.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={() => setExpanded(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dark-border)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px', cursor: 'pointer',
              color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'var(--transition)',
            }}
            id={`toggle-vol-${ngo.id}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
              <UserCheck size={15} color="var(--red-400)" />
              {ngo.matchedVolunteers.length} volunteer{ngo.matchedVolunteers.length !== 1 ? 's' : ''} available
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>
                (sorted by proximity)
              </span>
            </span>
            {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
          </button>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }} className="fade-in">
              {ngo.matchedVolunteers.map(v => (
                <VolunteerCard key={v.id} volunteer={v} ngoName={ngo.name} />
              ))}
            </div>
          )}
        </div>
      )}

      {ngo.matchedVolunteers.length === 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={13} /> No volunteers with matching blood type registered at this NGO yet
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <a href={`mailto:${ngo.email}`} className="btn btn-secondary btn-sm">Email NGO</a>
        <a href={`tel:${ngo.phone}`} className="btn btn-primary btn-sm" id={`call-ngo-${ngo.id}`}>
          <Phone size={13} /> Call NGO
        </a>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const { ngos, cities, getMatches, getPincodeCoords } = useApp();
  const [bloodGroup, setBloodGroup] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [showCompat, setShowCompat] = useState(false);

  const handlePincodeChange = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 6);
    setPincode(v);
    if (v.length === 6) {
      const info = getPincodeCoords(v);
      setPincodeInfo(info);
      if (info?.city) setCity(info.city);
    } else {
      setPincodeInfo(null);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    const matched = getMatches({ bloodGroup, pincode, city });
    setResults(matched);
    setLoading(false);
  };

  const totalByGroup = BLOOD_GROUPS.reduce((acc, bg) => {
    acc[bg] = ngos.reduce((sum, n) => sum + (n.inventory[bg] || 0), 0);
    return acc;
  }, {});

  const canSearch = bloodGroup && (pincode.length === 6 || city);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', paddingTop: '90px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }} className="fade-in-up">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
            <Zap size={12} /> Intelligence Match
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', marginBottom: '8px' }}>
            Find Blood & Volunteers <span style={{ color: 'var(--red-400)' }}>Near You</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto' }}>
            Enter your <strong style={{ color: 'var(--text-primary)' }}>pincode</strong> for precise proximity matching — we show the nearest NGOs and their available volunteers sorted by distance.
          </p>
        </div>

        {/* Search Card */}
        <div className="card fade-in-up" style={{ marginBottom: '28px', animationDelay: '0.1s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Blood Group *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    id={`match-bg-${bg.replace('+', 'pos').replace('-', 'neg')}`}
                    className={`blood-group-btn ${bloodGroup === bg ? 'selected' : ''}`}
                    onClick={() => setBloodGroup(bg)}
                    style={{ padding: '7px 4px', fontSize: '0.8rem' }}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hash size={12} /> Pincode *
              </label>
              <div className="input-group">
                <span className="input-icon"><Navigation size={16} /></span>
                <input
                  id="match-pincode"
                  className="form-input"
                  placeholder="e.g. 400053"
                  maxLength={6}
                  value={pincode}
                  onChange={e => handlePincodeChange(e.target.value)}
                />
              </div>
              {pincodeInfo && (
                <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={11} /> {pincodeInfo.area}, {pincodeInfo.city}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Or Select City</label>
              <div className="input-group">
                <span className="input-icon"><MapPin size={16} /></span>
                <select
                  id="match-city"
                  className="form-select"
                  style={{ paddingLeft: '42px' }}
                  value={city}
                  onChange={e => { setCity(e.target.value); setResults(null); }}
                >
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button
              id="run-match-btn"
              className="btn btn-primary btn-lg"
              onClick={handleSearch}
              disabled={!canSearch || loading}
              style={{ height: '48px', whiteSpace: 'nowrap' }}
            >
              {loading ? <span className="spinner" /> : <><Search size={18} /> Match</>}
            </button>
          </div>
        </div>

        {/* Network Availability */}
        <div className="fade-in-up" style={{ marginBottom: '28px', animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={16} color="var(--red-400)" /> Network Blood Availability
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ngos.length} NGOs · Click to select</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
            {BLOOD_GROUPS.map(bg => (
              <div
                key={bg}
                className="stat-card"
                style={{
                  padding: '12px 8px', cursor: 'pointer',
                  border: bloodGroup === bg ? '1px solid rgba(232,25,44,0.4)' : '1px solid var(--dark-border)',
                  background: bloodGroup === bg ? 'rgba(232,25,44,0.08)' : 'var(--dark-card)',
                }}
                onClick={() => setBloodGroup(bg)}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--red-400)', marginBottom: '4px' }}>{bg}</div>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: totalByGroup[bg] > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                  {totalByGroup[bg]}
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>units</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4>
                  {results.length > 0 ? (
                    <><span style={{ color: 'var(--red-400)' }}>{results.length}</span> NGO{results.length !== 1 ? 's' : ''} found for <strong>{bloodGroup}</strong></>
                  ) : 'No matches found'}
                </h4>
                {(pincodeInfo || city) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                    Near {pincodeInfo ? `${pincodeInfo.area} (${pincode})` : city} · sorted by proximity
                  </p>
                )}
              </div>
              <span className="badge badge-purple">
                <Zap size={11} /> AI + Pincode Ranked
              </span>
            </div>

            {results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ marginBottom: '8px' }}>No Matches Found</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  No NGOs near your location currently have <strong>{bloodGroup}</strong> or compatible blood.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '8px' }}>
                  Compatible types accepted: {BLOOD_COMPATIBILITY[bloodGroup]?.join(', ')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {results.map((ngo, i) => (
                  <NGOResultCard
                    key={ngo.id}
                    ngo={ngo}
                    index={i}
                    patientPincode={pincode}
                    ngos={ngos}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compatibility Table */}
        <div style={{ marginTop: '40px' }} className="fade-in-up">
          <button
            id="toggle-compat-table"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setShowCompat(p => !p)}
          >
            <Filter size={16} />
            {showCompat ? 'Hide' : 'Show'} Blood Compatibility Chart
            <ArrowRight size={14} style={{ transform: showCompat ? 'rotate(90deg)' : 'none', transition: 'var(--transition)' }} />
          </button>
          {showCompat && <BGCompatibilityTable />}
        </div>
      </div>
    </div>
  );
}
