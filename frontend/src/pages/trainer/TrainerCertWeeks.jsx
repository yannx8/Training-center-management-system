// frontend/src/pages/trainer/TrainerCertWeeks.jsx
import { useState, useEffect } from 'react';
import {
    getCertifications, getCertWeeks, createCertWeek, publishCertWeek,
    generateCertTimetable, getCertTimetables, getCertTimetableSlots,
} from '../../api/trainerApi';
import { Icon } from '../../components/Icons';
import '../../styles/Trainer.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerCertWeeks() {
    const [certs, setCerts] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [generatedTimetables, setGeneratedTimetables] = useState([]);
    const [viewingSlots, setViewingSlots] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [form, setForm] = useState({ weekNumber: '', label: '', startDate: '', endDate: '' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        getCertifications().then(r => setCerts(r.data.data || []));
        getCertTimetables().then(r => setGeneratedTimetables(r.data.data || []));
    }, []);

    useEffect(() => {
        if (selectedCert) {
            setLoading(true);
            getCertWeeks(selectedCert.id)
                .then(r => setWeeks(r.data.data || []))
                .finally(() => setLoading(false));
        }
    }, [selectedCert]);

    const flash = (text, isErr = false) => {
        setMsg({ text, isErr });
        setTimeout(() => setMsg(null), 5000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createCertWeek({ certificationId: selectedCert.id, ...form });
            flash('Week created successfully');
            setShowForm(false);
            setForm({ weekNumber: '', label: '', startDate: '', endDate: '' });
            getCertWeeks(selectedCert.id).then(r => setWeeks(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to create week', true);
        }
    };

    const handlePublish = async (weekId) => {
        try {
            await publishCertWeek(weekId);
            flash('Week published — students can now submit availability');
            getCertWeeks(selectedCert.id).then(r => setWeeks(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to publish', true);
        }
    };

    const handleGenerate = async (weekId) => {
        try {
            setLoading(true);
            const r = await generateCertTimetable({ certificationId: selectedCert.id, weekId });
            flash(r.data.data.message);
            getCertTimetables().then(r => setGeneratedTimetables(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Timetable generation failed', true);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSlots = async (certId, weekId, label) => {
        const r = await getCertTimetableSlots(certId, weekId);
        setViewingSlots({ certId, weekId, label, slots: r.data.data || [] });
    };

    if (certs.length === 0) {
        return (
            <div>
                <div className="trainer-page-head">
                    <div>
                        <h1 className="trainer-title">Certification Scheduling</h1>
                        <p className="trainer-sub">No certifications assigned to you yet.</p>
                    </div>
                </div>
                <div className="trainer-card">
                    <div className="trainer-empty">
                        <Icon name="certification" size={40} color="#94a3b8" />
                        <p>You have no certification assignments</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">Certification Scheduling</h1>
                    <p className="trainer-sub">Create and publish weeks → students submit availability → generate timetable</p>
                </div>
            </div>

            {msg && (
                <div className={`trainer-notice ${msg.isErr ? 'trainer-notice--err' : 'trainer-notice--ok'}`}>
                    {msg.text}
                </div>
            )}

            {/* Cert selector */}
            <div className="trainer-card" style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Certifications
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {certs.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { setSelectedCert(c); setViewingSlots(null); }}
                            className={selectedCert?.id === c.id ? 'trainer-btn' : 'trainer-btn-outline'}
                        >
                            <Icon name="certification" size={15} />
                            <span style={{ marginLeft: 6 }}>{c.name} ({c.code})</span>
                        </button>
                    ))}
                </div>
            </div>

            {selectedCert && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Left: week management */}
                    <div>
                        <div className="trainer-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>
                                    Weeks — {selectedCert.name}
                                </h2>
                                <button className="trainer-btn" onClick={() => setShowForm(v => !v)} style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}>
                                    + New Week
                                </button>
                            </div>

                            {showForm && (
                                <form onSubmit={handleCreate} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Week Number</label>
                                            <input type="number" min="1" value={form.weekNumber}
                                                onChange={e => setForm(f => ({ ...f, weekNumber: e.target.value }))}
                                                className="trainer-input" required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Label</label>
                                            <input type="text" value={form.label} placeholder="e.g. Week 1"
                                                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                                className="trainer-input" required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Start Date</label>
                                            <input type="date" value={form.startDate}
                                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                                className="trainer-input" required />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>End Date</label>
                                            <input type="date" value={form.endDate}
                                                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                                className="trainer-input" required />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button type="submit" className="trainer-btn" style={{ fontSize: '0.82rem' }}>Create Week</button>
                                        <button type="button" className="trainer-btn-outline" onClick={() => setShowForm(false)} style={{ fontSize: '0.82rem' }}>Cancel</button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <div className="trainer-msg">Loading...</div>
                            ) : weeks.length === 0 ? (
                                <div className="trainer-empty">
                                    <Icon name="calendar" size={32} color="#cbd5e1" />
                                    <p>No weeks yet. Create one above.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {weeks.map(w => (
                                        <div key={w.id} className="trainer-week-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{w.label}</p>
                                                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                                        {new Date(w.start_date).toLocaleDateString()} – {new Date(w.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`trainer-badge ${w.status === 'published' ? 'trainer-badge--green' : 'trainer-badge--yellow'}`}>
                                                    {w.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                                {w.status === 'draft' && (
                                                    <button onClick={() => handlePublish(w.id)} className="trainer-btn trainer-btn--green" style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
                                                        <Icon name="checkCircle" size={13} />
                                                        <span style={{ marginLeft: 4 }}>Publish Week</span>
                                                    </button>
                                                )}
                                                {w.status === 'published' && (
                                                    <>
                                                        <button onClick={() => handleGenerate(w.id)} disabled={loading}
                                                            className="trainer-btn" style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
                                                            <Icon name="generate" size={13} />
                                                            <span style={{ marginLeft: 4 }}>{loading ? 'Generating...' : 'Generate Timetable'}</span>
                                                        </button>
                                                        <p style={{ fontSize: '0.75rem', color: '#16a34a', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Icon name="checkCircle" size={13} color="#16a34a" />
                                                            Students can submit availability
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: generated timetables */}
                    <div>
                        <div className="trainer-card">
                            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: '1rem' }}>
                                Generated Timetables
                            </h2>
                            {generatedTimetables.filter(t => t.certification_id === selectedCert.id).length === 0 ? (
                                <div className="trainer-empty">
                                    <Icon name="schedule" size={32} color="#cbd5e1" />
                                    <p>No timetables generated yet</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {generatedTimetables
                                        .filter(t => t.certification_id === selectedCert.id)
                                        .map(t => (
                                            <div key={`${t.certification_id}-${t.week_id}`} className="trainer-week-card">
                                                <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>{t.week_label}</p>
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                                    {new Date(t.start_date).toLocaleDateString()} – {new Date(t.end_date).toLocaleDateString()}
                                                </p>
                                                <p style={{ fontSize: '0.78rem', color: '#3b5be8', marginTop: 4, fontWeight: 600 }}>
                                                    {t.slot_count} session{t.slot_count !== '1' ? 's' : ''} scheduled
                                                </p>
                                                <button
                                                    onClick={() => handleViewSlots(t.certification_id, t.week_id, t.week_label)}
                                                    className="trainer-btn-outline"
                                                    style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}
                                                >
                                                    <Icon name="timetable" size={13} />
                                                    <span style={{ marginLeft: 4 }}>View Timetable</span>
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Slot detail modal */}
            {viewingSlots && (
                <div className="modal-overlay" onClick={() => setViewingSlots(null)}>
                    <div className="modal-card" style={{ maxWidth: 700, width: '100%' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Timetable — {viewingSlots.label}</h3>
                            <button className="modal-close" onClick={() => setViewingSlots(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {viewingSlots.slots.length === 0 ? (
                                <div className="trainer-empty">
                                    <Icon name="schedule" size={32} color="#cbd5e1" />
                                    <p>No sessions found for this week.</p>
                                </div>
                            ) : (
                                <div className="hod-table-wrap">
                                    <table className="hod-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left' }}>Day</th>
                                                <th style={{ textAlign: 'left' }}>Time</th>
                                                <th style={{ textAlign: 'left' }}>Room</th>
                                                <th style={{ textAlign: 'left' }}>Trainer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingSlots.slots.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontWeight: 600 }}>{s.day_of_week}</td>
                                                    <td>{s.time_start?.slice(0, 5)} – {s.time_end?.slice(0, 5)}</td>
                                                    <td style={{ color: '#64748b' }}>{s.room_name || '—'}</td>
                                                    <td style={{ color: '#64748b' }}>{s.trainer_name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}