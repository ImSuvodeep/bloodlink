import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import NGOActiveRequests from '../components/NGOActiveRequests';
import {
  Building2, Mail, Phone, MapPin, Users, Plus, Minus,
  CheckCircle, Droplets, AlertCircle, ArrowRight, BarChart3,
  Package, Calendar, Shield, UserCheck, Hash, Navigation,
  Trash2, ToggleLeft, ToggleRight, Search
} from 'lucide-react';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ══════════════════════════════
// INVENTORY EDITOR
// ══════════════════════════════
function InventoryEditor({ inventory, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {BLOOD_GROUPS.map(bg => (
        <div key={bg} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dark-border)',
          borderRadius: 'var(--radius-md)', padding: '12px 8px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--red-400)', marginBottom: '8px' }}>{bg}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <button type="button"
              onClick={() => onChange(bg, Math.max(0, (inventory[bg] || 0) - 1))}
              style={{ width: '24px', height: '24px', border: '1px solid var(--dark-border)', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><Minus size={12} /></button>
            <input
              id={`inv-${bg}`}
              type="number" min="0"
              value={inventory[bg] || 0}
              onChange={e => onChange(bg, Number(e.target.value))}
              style={{ width: '36px', textAlign: 'center', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
            <button type="button"
              onClick={() => onChange(bg, (inventory[bg] || 0) + 1)}
              style={{ width: '24px', height: '24px', border: '1px solid var(--red-700)', borderRadius: '50%', background: 'rgba(232,25,44,0.1)', cursor: 'pointer', color: 'var(--red-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><Plus size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════
// VOLUNTEER MANAGEMENT
// ══════════════════════════════
function NGOVolunteerManager({ ngo }) {
  const { getVolunteersForNgo, toggleVolunteerAvailability, registerVolunteer } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [filterBg, setFilterBg] = useState('');
  const [addForm, setAddForm] = useState({ name: '', phone: '', bloodGroup: '', pincode: '', address: '', availability: 'anytime' });
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { getPincodeCoords } = useApp();
  const [pincodeInfo, setPincodeInfo] = useState(null);

  const volunteers = getVolunteersForNgo(ngo.id);
  const filtered = filterBg ? volunteers.filter(v => v.bloodGroup === filterBg) : volunteers;

  const setA = (key, val) => setAddForm(p => ({ ...p, [key]: val }));

  const handlePincodeChange = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 6);
    setA('pincode', v);
    if (v.length === 6) setPincodeInfo(getPincodeCoords(v));
    else setPincodeInfo(null);
  };

  const handleAddVolunteer = async () => {
    setAdding(true);
    await new Promise(r => setTimeout(r, 1000));
    registerVolunteer({ ...addForm, ngoId: ngo.id });
    setAdding(false);
    setAdded(true);
    setAddForm({ name: '', phone: '', bloodGroup: '', pincode: '', address: '', availability: 'anytime' });
    setPincodeInfo(null);
    setTimeout(() => { setAdded(false); setActiveSubTab('list'); }, 2000);
  };

  const addValid = addForm.name && addForm.phone && addForm.bloodGroup && addForm.pincode.length === 6;

  return (
    <div>
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab ${activeSubTab === 'list' ? 'active' : ''}`} onClick={() => setActiveSubTab('list')} id="ngo-vol-list-tab">
          Volunteers ({volunteers.length})
        </button>
        <button className={`tab ${activeSubTab === 'add' ? 'active' : ''}`} onClick={() => setActiveSubTab('add')} id="ngo-vol-add-tab">
          + Add Volunteer
        </button>
      </div>

      {activeSubTab === 'list' && (
        <div className="fade-in-up">
          {/* Blood group filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button className={`btn btn-sm ${filterBg === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterBg('')}>All</button>
            {BLOOD_GROUPS.map(bg => (
              <button key={bg} className={`btn btn-sm ${filterBg === bg ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterBg(bg)}>{bg}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <UserCheck size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              No volunteers {filterBg ? `with blood group ${filterBg}` : ''} yet.<br />
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setActiveSubTab('add')}>
                + Add First Volunteer
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dark-border)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px', flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', fontWeight: '800', fontSize: '1rem',
                    background: v.available ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${v.available ? 'rgba(34,197,94,0.3)' : 'var(--dark-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: v.available ? '#4ade80' : 'var(--text-muted)', flexShrink: 0,
                  }}>
                    {v.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      {v.name}
                      <span className="badge badge-red">{v.bloodGroup}</span>
                      <span className={`badge ${v.available ? 'badge-green' : 'badge-orange'}`}>
                        {v.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span><Phone size={10} /> {v.phone}</span>
                      <span><Hash size={10} /> {v.pincode}</span>
                      {v.address && <span><MapPin size={10} /> {v.address}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleVolunteerAvailability(v.id)}
                    title={v.available ? 'Mark unavailable' : 'Mark available'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                  >
                    {v.available
                      ? <ToggleRight size={26} color="#4ade80" />
                      : <ToggleLeft size={26} color="var(--text-muted)" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'add' && (
        <div className="fade-in-up">
          {added && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              Volunteer added to your database and notified!
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Add volunteers to your NGO's private database. They appear in the match system for patients.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Volunteer Name *</label>
              <input id="ngo-vol-name" className="form-input" placeholder="Full name" value={addForm.name} onChange={e => setA('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <div className="input-group">
                <span className="input-icon"><Phone size={16} /></span>
                <input id="ngo-vol-phone" className="form-input" placeholder="+91 98765 43210" value={addForm.phone} onChange={e => setA('phone', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Group *</label>
            <div className="blood-group-grid">
              {BLOOD_GROUPS.map(bg => (
                <button key={bg} type="button" className={`blood-group-btn ${addForm.bloodGroup === bg ? 'selected' : ''}`} onClick={() => setA('bloodGroup', bg)}>{bg}</button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hash size={12} /> Pincode * <span style={{ fontSize: '0.72rem', color: 'var(--red-400)' }}>for distance match</span>
              </label>
              <div className="input-group">
                <span className="input-icon"><Navigation size={16} /></span>
                <input id="ngo-vol-pincode" className="form-input" placeholder="6-digit pincode" maxLength={6} value={addForm.pincode} onChange={e => handlePincodeChange(e.target.value)} />
              </div>
              {pincodeInfo && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px' }}><CheckCircle size={11} /> {pincodeInfo.area}, {pincodeInfo.city}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <div className="input-group">
                <span className="input-icon"><MapPin size={16} /></span>
                <input id="ngo-vol-address" className="form-input" placeholder="Area, City" value={addForm.address} onChange={e => setA('address', e.target.value)} />
              </div>
            </div>
          </div>
          <button
            id="ngo-add-volunteer-btn"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!addValid || adding}
            onClick={handleAddVolunteer}
          >
            {adding ? <span className="spinner" /> : <><UserCheck size={16} /> Add to NGO Database</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════
// NGO DASHBOARD TABS
// ══════════════════════════════
function NGODashboard({ ngo, onUpdateInventory }) {
  const [dashTab, setDashTab] = useState('inventory');
  const [inventory, setInventory] = useState({ ...ngo.inventory });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { getVolunteersForNgo, patientRequests } = useApp();

  const volunteers = getVolunteersForNgo(ngo.id);
  const totalUnits = Object.values(inventory).reduce((s, v) => s + (Number(v) || 0), 0);
  const availableVols = volunteers.filter(v => v.available).length;

  const handleChange = (bg, value) => { setInventory(prev => ({ ...prev, [bg]: value })); setSaved(false); };
  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    onUpdateInventory(ngo.id, inventory);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="fade-in-up">
      {/* Welcome Banner */}
      <div style={{ background: 'var(--gradient-red)', borderRadius: 'var(--radius-xl)', padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ fontSize: '0.78rem', opacity: 0.75, marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Welcome back</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '4px' }}>{ngo.name}</h3>
        <p style={{ opacity: 0.8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <MapPin size={13} /> {ngo.city}
          {ngo.pincode && <><Hash size={13} /> {ngo.pincode}</>}
          · {ngo.verified ? '✓ Verified NGO' : '⏳ Pending Verification'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: Droplets, value: totalUnits, label: 'Blood Units', color: 'var(--red-400)' },
          { icon: UserCheck, value: availableVols, label: 'Active Volunteers', color: '#4ade80' },
          { icon: BarChart3, value: ngo.verified ? 'Active' : 'Pending', label: 'Status', color: '#60a5fa' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <s.icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
            <span className="stat-number" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Dashboard Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button id="dash-tab-inventory" className={`tab ${dashTab === 'inventory' ? 'active' : ''}`} onClick={() => setDashTab('inventory')}>
          <Droplets size={13} /> Blood Inventory
        </button>
        <button id="dash-tab-volunteers" className={`tab ${dashTab === 'volunteers' ? 'active' : ''}`} onClick={() => setDashTab('volunteers')}>
          <UserCheck size={13} /> Volunteers ({volunteers.length})
        </button>
        <button id="dash-tab-requests" className={`tab ${dashTab === 'requests' ? 'active' : ''}`} onClick={() => setDashTab('requests')}>
          <Shield size={13} /> Requests
        </button>
      </div>

      {dashTab === 'inventory' && (
        <div className="card fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ marginBottom: '2px' }}>Blood Inventory</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Adjust physical units · Volunteer registrations auto-update counts
              </p>
            </div>
            <span className="badge badge-blue"><Calendar size={11} /> Updated Today</span>
          </div>
          <InventoryEditor inventory={inventory} onChange={handleChange} />
          {saved && <div className="alert alert-success" style={{ marginTop: '16px' }}><CheckCircle size={16} style={{ flexShrink: 0 }} /> Inventory saved!</div>}
          <button id="ngo-save-inventory" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Package size={16} /> Save Inventory</>}
          </button>

          {/* ── Volunteer Blood Availability Breakdown ── */}
          {volunteers.length > 0 && (() => {
            const grouped = {};
            volunteers.forEach(v => {
              if (!grouped[v.bloodGroup]) grouped[v.bloodGroup] = { available: 0, unavailable: 0 };
              if (v.available) grouped[v.bloodGroup].available++;
              else grouped[v.bloodGroup].unavailable++;
            });
            return (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--dark-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <UserCheck size={14} color="#4ade80" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80' }}>
                    Volunteer Blood Availability
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    Auto-synced with inventory
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {Object.entries(grouped).map(([bg, counts]) => (
                    <div key={bg} style={{
                      background: counts.available > 0 ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${counts.available > 0 ? 'rgba(74,222,128,0.25)' : 'var(--dark-border)'}`,
                      borderRadius: 'var(--radius-md)', padding: '10px 8px', textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: '800', fontSize: '1rem', color: counts.available > 0 ? '#4ade80' : 'var(--text-muted)', marginBottom: '4px' }}>{bg}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: '#4ade80', fontWeight: '700' }}>{counts.available}</span> avail
                        {counts.unavailable > 0 && <span> · <span style={{ color: '#ef4444' }}>{counts.unavailable}</span> off</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                  💡 Toggling a volunteer's availability in the Volunteers tab automatically updates the inventory count above.
                </p>
              </div>
            );
          })()}
        </div>
      )}



      {dashTab === 'volunteers' && (
        <div className="card fade-in-up">
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={16} color="var(--red-400)" /> Volunteer Database</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Manage volunteers registered under {ngo.name}</p>
          </div>
          <NGOVolunteerManager ngo={ngo} />
        </div>
      )}

      {dashTab === 'requests' && (
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ border: '1px solid rgba(232,25,44,0.15)' }}>
            <NGOActiveRequests ngo={ngo} />
          </div>
          <div className="card">
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="var(--red-400)" /> Manual Patient Requests
            </h4>
            {patientRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <Shield size={32} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
                <p style={{ fontSize: '0.88rem' }}>No patient requests yet.</p>
                <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Requests submitted via the Patient Portal will appear here.</p>
              </div>
            ) : (
              patientRequests.map((req, i) => {
                const avail = inventory[req.bloodGroup] || 0;
                const volsAvail = volunteers.filter(v => v.bloodGroup === req.bloodGroup && v.available);
                const timeDiff = Math.round((Date.now() - new Date(req.createdAt)) / 60000);
                const timeStr = timeDiff < 1 ? 'just now' : timeDiff < 60 ? `${timeDiff} min ago` : `${Math.round(timeDiff / 60)} hr ago`;
                return (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < patientRequests.length - 1 ? '1px solid var(--dark-border)' : 'none', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '2px' }}>{req.fullName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{req.hospital} · {req.city} · {timeStr}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-red">{req.bloodGroup}</span>
                      <span className={`badge ${req.urgency?.includes('Critical') ? 'badge-red' : req.urgency?.includes('Urgent') ? 'badge-orange' : 'badge-blue'}`}>
                        {req.urgency?.split(' ')[0] || 'Pending'}
                      </span>
                      {avail > 0 ? <span className="badge badge-green">{avail} units</span> : <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>No stock</span>}
                      {volsAvail.length > 0 && <span className="badge badge-purple"><UserCheck size={10} /> {volsAvail.length} vol.</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════
// NGO REGISTER FORM
// ══════════════════════════════
function NGORegisterForm({ onSubmit, cities }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', pincode: '', address: '', regNumber: '', contactPerson: '', password: '', confirmPassword: '' });
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const { getPincodeCoords } = useApp();

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handlePincode = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 6);
    set('pincode', v);
    if (v.length === 6) {
      const info = getPincodeCoords(v);
      setPincodeInfo(info);
      if (info?.city) set('city', info.city);
    } else setPincodeInfo(null);
  };

  const isStep1Valid = form.name && form.email && form.phone && form.city;
  const isStep2Valid = form.address && form.contactPerson && form.pincode.length === 6 && form.password.length >= 6 && form.password === form.confirmPassword;

  const handleSubmit = async () => {
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button className={`tab ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Organization</button>
        <button className={`tab ${step === 2 ? 'active' : ''}`} onClick={() => step >= 2 && setStep(2)} disabled={!isStep1Valid}>2. Location & Contact</button>
      </div>

      {step === 1 && (
        <div className="fade-in-up">
          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <div className="input-group"><span className="input-icon"><Building2 size={16} /></span>
              <input id="ngo-name" className="form-input" placeholder="e.g. LifeSavers Blood Bank" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="input-group"><span className="input-icon"><Mail size={16} /></span>
                <input id="ngo-email" className="form-input" type="email" placeholder="info@ngo.org" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <div className="input-group"><span className="input-icon"><Phone size={16} /></span>
                <input id="ngo-phone" className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <div className="input-group"><span className="input-icon"><MapPin size={16} /></span>
              <select id="ngo-city" className="form-select" style={{ paddingLeft: '42px' }} value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select city</option>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">NGO Registration Number</label>
            <input id="ngo-reg" className="form-input" placeholder="e.g. NGO/MH/2023/04521" value={form.regNumber} onChange={e => set('regNumber', e.target.value)} />
          </div>
          <button id="ngo-step1-next" className="btn btn-primary" style={{ width: '100%' }} disabled={!isStep1Valid} onClick={() => setStep(2)}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in-up">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Hash size={12} /> Pincode * <span style={{ fontSize: '0.72rem', color: 'var(--red-400)' }}>key for distance matching</span>
            </label>
            <div className="input-group"><span className="input-icon"><Navigation size={16} /></span>
              <input id="ngo-pincode" className="form-input" placeholder="6-digit pincode" maxLength={6} value={form.pincode} onChange={e => handlePincode(e.target.value)} />
            </div>
            {pincodeInfo && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={11} /> {pincodeInfo.area}, {pincodeInfo.city}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Full Address *</label>
            <div className="input-group"><span className="input-icon"><MapPin size={16} /></span>
              <input id="ngo-address" className="form-input" placeholder="Street address of blood center" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Primary Contact Person *</label>
            <div className="input-group"><span className="input-icon"><Users size={16} /></span>
              <input id="ngo-contact-person" className="form-input" placeholder="Coordinator / Manager name" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Set Password *</label>
            <div className="input-group"><span className="input-icon">🔒</span>
              <input id="ngo-password" className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <div className="input-group"><span className="input-icon">🔒</span>
              <input id="ngo-confirm-password" className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>
          {error && <div className="alert" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.83rem', marginBottom: '12px' }}><AlertCircle size={14} /> {error}</div>}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button id="ngo-register-submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!isStep2Valid || loading} onClick={handleSubmit}>
              {loading ? <span className="spinner" /> : <><Shield size={16} /> Register NGO</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════
// MAIN NGO PORTAL
// ══════════════════════════════
export default function NgoPortal() {
  const { user, registerNgo, loginNgo, updateNgoInventory, cities, ngos, logout } = useApp();
  const [mode, setMode] = useState('register');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState('');

  const ngoUser = user?.type === 'ngo' ? user.data : null;
  const currentNgo = ngoUser ? ngos.find(n => n.id === ngoUser.id) || ngoUser : null;

  const handleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      await loginNgo(loginName, loginPassword);
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally { setLoginLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', paddingTop: '90px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }} className="fade-in-up">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
            <Building2 size={12} /> NGO Portal
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '8px' }}>
            {currentNgo ? 'NGO Dashboard' : <><span style={{ color: 'var(--red-400)' }}>NGO</span> Registration</>}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {currentNgo ? 'Manage inventory, volunteers, and patient requests' : 'Register your blood center and manage volunteers'}
          </p>
        </div>

        {currentNgo ? (
          <div className="fade-in-up">
            <NGODashboard
              ngo={currentNgo}
              onUpdateInventory={(id, inv) => {
                const delta = {};
                for (const [bg, val] of Object.entries(inv)) {
                  delta[bg] = val - (currentNgo.inventory[bg] || 0);
                }
                updateNgoInventory(id, delta);
              }}
            />
          </div>
        ) : (
          <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="tabs">
              <button id="ngo-tab-register" className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register NGO</button>
              <button id="ngo-tab-login" className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Existing NGO Login</button>
            </div>

            {mode === 'register' && <NGORegisterForm onSubmit={registerNgo} cities={cities} />}

            {mode === 'login' && (
              <div className="fade-in-up">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Enter your registered NGO name and password
                </p>
                <div className="form-group">
                  <label className="form-label">NGO Name *</label>
                  <div className="input-group"><span className="input-icon"><Building2 size={16} /></span>
                    <input id="ngo-login-name" className="form-input" placeholder="Your registered NGO name" value={loginName} onChange={e => { setLoginName(e.target.value); setLoginError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="input-group"><span className="input-icon">🔒</span>
                    <input id="ngo-login-password" className="form-input" type="password" placeholder="Your password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                </div>
                {loginError && <div className="alert" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.83rem', marginBottom: '12px' }}><AlertCircle size={14} /> {loginError}</div>}
                <button id="ngo-login-btn" className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin} disabled={!loginName || !loginPassword || loginLoading}>
                  {loginLoading ? <span className="spinner" /> : <><Shield size={16} /> Login to Dashboard</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
