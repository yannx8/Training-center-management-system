// frontend/src/pages/student/StudentCertAvailability.jsx
import { useState, useEffect } from 'react';
import {
    getCertAvailabilityWeeks, getCertAvailability,
    submitCertAvailability, deleteCertAvailability,
} from '../../api/studentApi';
import { Icon } from '../../components/Icons';
import '../../styles/Student.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentCertAvailability() {
    const [certWeeks, setCertWeeks] = useState([]);
    const [selectedCertWeek, setSelectedCertWeek] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [form, setForm] = useState({ dayOfWeek: 'Monday', timeStart: '08:00', timeEnd: '10:00' });

    useEffect(() => {
        getCertAvailabilityWeeks()
            .then(r => {
                const weeks = r.data.data || [];
                setCertWeeks(weeks);
                if (weeks.length > 0) setSelectedCertWeek(weeks[0]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedCertWeek) {
            getCertAvailability({ weekId: selectedCertWeek.week_id })
                .then(r => setAvailability(r.data.data || []));
        }
    }, [selectedCertWeek]);

    const flash = (text, isErr = false) => {
        setMsg({ text, isErr });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.timeStart >= form.timeEnd) {
            flash('End time must be after start time', true);
            return;
        }
        try {
            await submitCertAvailability({
                academicWeekId: selectedCertWeek.week_id,
                dayOfWeek: form.dayOfWeek,
                timeStart: form.timeStart,
                timeEnd: form.timeEnd,
            });
            flash('Availability submitted successfully');
            getCertAvailability({ weekId: selectedCertWeek.week_id })
                .then(r => setAvailability(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to submit', true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCertAvailability(id);
            setAvailability(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to remove', true);
        }
    };

    if (loading) return <div className="student-loading">Loading...</div>;

    return (
        <div className="student-page">
            <div className="student-page-head">
                <div>
                    <h1 className="student-title">Certification Availability</h1>
                    <p className="student-sub">
                        Submit your available time slots for the latest published scheduling week.
                        Your trainer will use these to generate the session timetable.
                    </p>
                </div>
            </div>

            {msg && (
                <div className={`student-notice ${msg.isErr ? 'student-notice--err' : 'student-notice--ok'}`}>
                    {msg.text}
                </div>
            )}

            {certWeeks.length === 0 ? (
                <div className="student-card">
                    <div className="student-empty">
                        <Icon name="availability" size={40} color="#94a3b8" />
                        <p style={{ fontWeight: 600, color: '#475569', margin: '0.5rem 0 0.25rem' }}>
                            No availability window open
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            A week will appear here once your certification trainer publishes a scheduling week.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Cert selector (if enrolled in multiple) */}
                    {certWeeks.length > 1 && (
                        <div className="student-card" style={{ marginBottom: '1.25rem' }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Your Certifications
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {certWeeks.map(cw => (
                                    <button
                                        key={cw.certification_id}
                                        onClick={() => setSelectedCertWeek(cw)}
                                        className={selectedCertWeek?.certification_id === cw.certification_id ? 'student-btn-active' : 'student-btn-outline'}
                                    >
                                        {cw.certification_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedCertWeek && (
                        <>
                            {/* Week info banner */}
                            <div className="student-info-banner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Icon name="calendar" size={16} color="#1e40af" />
                                    <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>
                                        {selectedCertWeek.certification_name}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.85rem' }}>
                                    <strong>{selectedCertWeek.week_label}</strong>
                                    {' — '}
                                    {new Date(selectedCertWeek.start_date).toLocaleDateString()} to{' '}
                                    {new Date(selectedCertWeek.end_date).toLocaleDateString()}
                                </p>
                                <p style={{ margin: '4px 0 0', color: '#3b82f6', fontSize: '0.78rem' }}>
                                    Latest published week — this is the only week open for availability submission
                                </p>
                            </div>

                            {/* Submission form */}
                            <div className="student-card" style={{ marginBottom: '1.25rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="availability" size={16} color="#3b5be8" />
                                    Add Available Time Slot
                                </h3>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div>
                                            <label className="student-label">Day</label>
                                            <select value={form.dayOfWeek}
                                                onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                                                className="student-input">
                                                {DAYS.map(d => <option key={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="student-label">From</label>
                                            <input type="time" value={form.timeStart}
                                                onChange={e => setForm(f => ({ ...f, timeStart: e.target.value }))}
                                                className="student-input" required />
                                        </div>
                                        <div>
                                            <label className="student-label">To</label>
                                            <input type="time" value={form.timeEnd}
                                                onChange={e => setForm(f => ({ ...f, timeEnd: e.target.value }))}
                                                className="student-input" required />
                                        </div>
                                    </div>
                                    <button type="submit" className="student-btn-primary">
                                        Add Slot
                                    </button>
                                </form>
                            </div>

                            {/* Submitted slots */}
                            <div className="student-card">
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="schedule" size={16} color="#3b5be8" />
                                    Submitted Slots
                                    <span style={{ fontWeight: 400, fontSize: '0.82rem', color: '#94a3b8' }}>({availability.length})</span>
                                </h3>
                                {availability.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No slots submitted yet for this week.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {DAYS.map(day => {
                                            const daySlots = availability.filter(s => s.day_of_week === day);
                                            if (!daySlots.length) return null;
                                            return (
                                                <div key={day} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                                    <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.82rem', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                                                        {day}
                                                    </div>
                                                    <div>
                                                        {daySlots.map(s => (
                                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                                                <span style={{ fontSize: '0.88rem', color: '#334155' }}>
                                                                    {s.time_start?.slice(0, 5)} – {s.time_end?.slice(0, 5)}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDelete(s.id)}
                                                                    style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}