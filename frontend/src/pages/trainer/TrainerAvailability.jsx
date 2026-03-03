// FILE: /frontend/src/pages/trainer/TrainerAvailability.jsx
import { useState, useEffect } from 'react';
import { getAvailability, submitAvailability, deleteAvailability, getActiveWeekForAvailability } from '../../api/trainerApi';
import '../../styles/Trainer.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '8h–10h' },
    { start: '10:00', end: '12:00', label: '10h–12h' },
    { start: '13:00', end: '15:00', label: '13h–15h' },
    { start: '15:00', end: '17:00', label: '15h–17h' },
    { start: '17:00', end: '19:00', label: '17h–19h' },
    { start: '19:00', end: '21:00', label: '19h–21h' },
];

export default function TrainerAvailability() {
    const [activeWeek, setActiveWeek] = useState(null);
    const [weekLoading, setWeekLoading] = useState(true);
    const [availability, setAvailability] = useState([]);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load active week (latest HOD week)
    useEffect(() => {
        getActiveWeekForAvailability()
            .then(res => {
                setActiveWeek(res.data.data);
                setWeekLoading(false);
            })
            .catch(() => setWeekLoading(false));
    }, []);

    // Load existing availability for active week
    useEffect(() => {
        if (!activeWeek) return;
        getAvailability({ weekId: activeWeek.id })
            .then(res => {
                const avail = res.data.data || [];
                setAvailability(avail);
                // Pre-select existing slots
                const existing = new Set(avail.map(a => cellKey(a.day_of_week, a.time_start)));
                setSelectedCells(existing);
            })
            .catch(() => {});
    }, [activeWeek]);

    function cellKey(day, timeStart) {
        return `${day}|${timeStart}`;
    }

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
            setError('No active week available. Please wait for the HOD to register a week.');
            return;
        }
        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            // Find which cells are newly selected (not yet in DB)
            const existingKeys = new Set(availability.map(a => cellKey(a.day_of_week, a.time_start)));

            // Remove deselected slots
            const deselectedAvail = availability.filter(a => !selectedCells.has(cellKey(a.day_of_week, a.time_start)));
            for (const avail of deselectedAvail) {
                await deleteAvailability(avail.id);
            }

            // Add newly selected slots
            for (const key of selectedCells) {
                if (existingKeys.has(key)) continue;
                const [day, timeStart] = key.split('|');
                const slot = TIME_SLOTS.find(s => s.start === timeStart);
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
            setMessage('Availability saved successfully');
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save availability');
        } finally {
            setSubmitting(false);
        }
    }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    if (weekLoading) return <div className="trainer-msg">Loading week information…</div>;

    return (
        <div>
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">My Availability</h1>
                    <p className="trainer-sub">Click cells to toggle your available time slots</p>
                </div>
            </div>

            {/* Week info banner */}
            {activeWeek ? (
                <div className="trainer-card" style={{ marginBottom: '1rem', padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>Week: {activeWeek.label}</span>
                        <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#555' }}>
                            From: <strong>{formatDate(activeWeek.start_date)}</strong> &nbsp;·&nbsp; To: <strong>{formatDate(activeWeek.end_date)}</strong>
                        </span>
                    </div>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                        borderRadius: 999, background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a'
                    }}>
                        {activeWeek.status}
                    </span>
                </div>
            ) : (
                <div className="trainer-notice">
                    No active week has been registered by the HOD yet. You cannot submit availability until a week is created.
                </div>
            )}

            {message && <div className="trainer-ok" style={{ marginBottom: '0.75rem' }}>{message}</div>}
            {error && <div className="trainer-err" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</div>}

            {activeWeek && (
                <div className="trainer-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                        <h3 className="trainer-card-title" style={{ margin: 0 }}>
                            Select your availability — <span style={{ fontWeight: 400, color: '#555' }}>
                                From: {formatDate(activeWeek.start_date)} &nbsp;To: {formatDate(activeWeek.end_date)}
                            </span>
                        </h3>
                        <button className="trainer-btn" onClick={handleSubmit} disabled={submitting || !activeWeek}>
                            {submitting ? 'Saving…' : 'Submit Availability'}
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="trainer-timetable-grid">
                        {/* Header row */}
                        <div className="trainer-timetable-header" style={{ fontSize: '0.7rem' }}>Time</div>
                        {DAYS.map(day => (
                            <div key={day} className="trainer-timetable-header">{day}</div>
                        ))}

                        {/* Slot rows */}
                        {TIME_SLOTS.map(slot => (
                            <>
                                <div key={`time-${slot.start}`} className="trainer-timetable-time">{slot.label}</div>
                                {DAYS.map(day => {
                                    const key = cellKey(day, slot.start);
                                    const isSelected = selectedCells.has(key);
                                    return (
                                        <div
                                            key={key}
                                            className={`trainer-timetable-cell trainer-avail-cell ${isSelected ? 'trainer-avail-selected' : 'trainer-avail-empty'}`}
                                            onClick={() => handleCellToggle(day, slot)}
                                            title={`${day} ${slot.label}`}
                                        >
                                            {isSelected ? (
                                                <span style={{ fontSize: '1rem', color: '#2e7d32' }}>✓</span>
                                            ) : ''}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.75rem' }}>
                        Click a cell to toggle. Green = available. Submit when done.
                    </p>
                </div>
            )}
        </div>
    );
}