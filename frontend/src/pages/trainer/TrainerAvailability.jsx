import { useState, useEffect } from 'react';
import {
    getAvailability,
    submitAvailability,
    deleteAvailability,
    getActiveWeekForAvailability,
} from '../../api/trainerApi';
import '../../styles/Trainer.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00:00', end: '10:00:00', label: '8h–10h' },
    { start: '10:00:00', end: '12:00:00', label: '10h–12h' },
    { start: '13:00:00', end: '15:00:00', label: '13h–15h' },
    { start: '15:00:00', end: '17:00:00', label: '15h–17h' },
    { start: '17:00:00', end: '19:00:00', label: '17h–19h' },
    { start: '19:00:00', end: '21:00:00', label: '19h–21h' },
];

function cellKey(day, timeStart) {
    // Normalize time string to HH:MM:SS
    const t = timeStart.length === 5 ? timeStart + ':00' : timeStart;
    return `${day}|${t}`;
}

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function TrainerAvailability() {
    const [activeWeek, setActiveWeek] = useState(null);
    const [weekLoading, setWeekLoading] = useState(true);
    const [availability, setAvailability] = useState([]);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load latest HOD week
    useEffect(() => {
        getActiveWeekForAvailability()
            .then(res => {
                setActiveWeek(res.data.data);
                setWeekLoading(false);
            })
            .catch(() => setWeekLoading(false));
    }, []);

    // Load existing availability for the active week
    useEffect(() => {
        if (!activeWeek) return;
        getAvailability({ weekId: activeWeek.id })
            .then(res => {
                const avail = res.data.data || [];
                setAvailability(avail);
                const existing = new Set(avail.map(a => cellKey(a.day_of_week, a.time_start)));
                setSelectedCells(existing);
            })
            .catch(() => {});
    }, [activeWeek]);

    function handleCellToggle(day, slot) {
        if (!activeWeek) return;
        const key = cellKey(day, slot.start);
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    async function handleSubmit() {
        if (!activeWeek) {
            setError('No active week available. Wait for the HOD to register a week.');
            return;
        }
        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            const existingKeys = new Set(availability.map(a => cellKey(a.day_of_week, a.time_start)));

            // Remove deselected
            const toDelete = availability.filter(a => !selectedCells.has(cellKey(a.day_of_week, a.time_start)));
            for (const avail of toDelete) {
                await deleteAvailability(avail.id);
            }

            // Add newly selected
            for (const key of selectedCells) {
                if (existingKeys.has(key)) continue;
                const [day, timeStart] = key.split('|');
                const slot = TIME_SLOTS.find(s => (s.start.length === 5 ? s.start + ':00' : s.start) === timeStart);
                if (!slot) continue;
                await submitAvailability({
                    dayOfWeek: day,
                    timeStart: slot.start,
                    timeEnd: slot.end,
                    weekId: activeWeek.id,
                });
            }

            // Refresh
            const res = await getAvailability({ weekId: activeWeek.id });
            const avail = res.data.data || [];
            setAvailability(avail);
            setSelectedCells(new Set(avail.map(a => cellKey(a.day_of_week, a.time_start))));
            setMessage('Availability saved successfully!');
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save availability');
        } finally {
            setSubmitting(false);
        }
    }

    if (weekLoading) {
        return (
            <div>
                <div className="trainer-page-head">
                    <h1 className="trainer-title">Submit Availability</h1>
                </div>
                <div className="trainer-msg">Loading week info…</div>
            </div>
        );
    }

    return (
        <div>
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">Submit Availability</h1>
                    <p className="trainer-sub">Click cells to toggle your availability for the current week</p>
                </div>
                <button
                    className="trainer-btn"
                    onClick={handleSubmit}
                    disabled={submitting || !activeWeek}
                >
                    {submitting ? 'Saving…' : 'Submit Availability'}
                </button>
            </div>

            {error && (
                <div className="trainer-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                    {error}
                </div>
            )}
            {message && (
                <div className="trainer-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                    {message}
                </div>
            )}

            {!activeWeek ? (
                <div className="trainer-card">
                    <p className="trainer-msg">
                        No academic week registered yet. Please wait for the HOD to register a week before submitting availability.
                    </p>
                </div>
            ) : (
                <div className="trainer-card">
                    {/* Week info — non-editable */}
                    <div style={{
                        background: '#f0f4ff',
                        border: '1px solid #c7d7fa',
                        borderRadius: 4,
                        padding: '0.75rem 1rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        gap: '2rem',
                        alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b5be8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                                Current Week 
                            </div>
                            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{activeWeek.label}</div>
                        </div>
                        <div style={{ color: '#555', fontSize: '0.875rem' }}>
                            From: <strong>{formatDate(activeWeek.start_date)}</strong> &nbsp; To: <strong>{formatDate(activeWeek.end_date)}</strong>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '1rem' }}>
                        Select the time slots when you are available. Selected cells appear in dark navy.
                    </p>

                    {/* Availability Grid */}
                    <div className="trainer-avail-grid">
                        {/* Header row */}
                        <div className="trainer-avail-timecell trainer-avail-header" style={{ background: '#1a1a2e' }}>Time</div>
                        {DAYS.map(d => (
                            <div key={d} className="trainer-avail-header">{d}</div>
                        ))}

                        {/* Time slot rows */}
                        {TIME_SLOTS.map(slot => (
                            <>
                                <div key={`t-${slot.start}`} className="trainer-avail-timecell">
                                    {slot.label}
                                </div>
                                {DAYS.map(day => {
                                    const key = cellKey(day, slot.start);
                                    const isSelected = selectedCells.has(key);
                                    return (
                                        <div
                                            key={key}
                                            className={`trainer-avail-cell${isSelected ? ' selected' : ''}`}
                                            onClick={() => handleCellToggle(day, slot)}
                                            title={`${day} ${slot.label}`}
                                        />
                                    );
                                })}
                            </>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                            <div style={{ width: 18, height: 18, background: '#1a1a2e', borderRadius: 3 }}></div>
                            Available
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                            <div style={{ width: 18, height: 18, background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 3 }}></div>
                            Not available
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#555' }}>
                            {selectedCells.size} slot(s) selected
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}