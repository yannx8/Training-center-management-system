// FILE: /frontend/src/pages/trainer/TrainerAvailability.jsx
import { useState, useEffect, Fragment } from 'react';
import { getAvailability, submitAvailability, deleteAvailability, getPublishedWeeks } from '../../api/trainerApi';
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

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function TrainerAvailability() {
    const [weeks, setWeeks] = useState([]);
    const [weeksLoading, setWeeksLoading] = useState(true);
    const [selectedWeekId, setSelectedWeekId] = useState('');
    const [availability, setAvailability] = useState([]);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load published weeks from HOD
    useEffect(() => {
        getPublishedWeeks()
            .then(res => {
                const w = res.data.data || [];
                setWeeks(w);
                if (w.length) setSelectedWeekId(String(w[0].id));
            })
            .catch(() => {})
            .finally(() => setWeeksLoading(false));
    }, []);

    // Load existing availability when week changes
    useEffect(() => {
        if (!selectedWeekId) { setAvailability([]); setSelectedCells(new Set()); return; }
        getAvailability({ weekId: selectedWeekId })
            .then(res => {
                const avail = res.data.data || [];
                setAvailability(avail);
                const existing = new Set(avail.map(a => cellKey(a.day_of_week, a.time_start)));
                setSelectedCells(existing);
            })
            .catch(() => {});
    }, [selectedWeekId]);

    const cellKey = (day, t) => `${day}|${String(t).substring(0, 5)}`;

    function handleCellToggle(day, slot) {
        if (!selectedWeekId) return;
        const key = cellKey(day, slot.start);
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }

    async function handleSubmit() {
        if (!selectedWeekId) { setError('Please select a week first.'); return; }
        setSubmitting(true); setError(''); setMessage('');
        try {
            const existingKeys = new Set(availability.map(a => cellKey(a.day_of_week, a.time_start)));

            // Delete deselected
            const toDelete = availability.filter(a => !selectedCells.has(cellKey(a.day_of_week, a.time_start)));
            for (const a of toDelete) await deleteAvailability(a.id);

            // Add new selections
            const toAdd = [...selectedCells].filter(k => !existingKeys.has(k));
            for (const key of toAdd) {
                const [day, timeStart] = key.split('|');
                const slot = TIME_SLOTS.find(s => s.start === timeStart);
                if (!slot) continue;
                await submitAvailability({ dayOfWeek: day, timeStart: slot.start, timeEnd: slot.end, weekId: selectedWeekId });
            }

            // Refresh
            const res = await getAvailability({ weekId: selectedWeekId });
            const avail = res.data.data || [];
            setAvailability(avail);
            setSelectedCells(new Set(avail.map(a => cellKey(a.day_of_week, a.time_start))));
            setMessage('✓ Availability saved successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save availability.');
        } finally {
            setSubmitting(false);
        }
    }

    const currentWeek = weeks.find(w => String(w.id) === selectedWeekId);

    return (
        <div>
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">My Availability</h1>
                    <p className="trainer-sub">Click cells to mark when you are available for scheduling.</p>
                </div>
            </div>

            {weeksLoading ? (
                <div className="trainer-msg">Loading published weeks…</div>
            ) : !weeks.length ? (
                <div className="trainer-card">
                    <p className="trainer-msg">
                        No published weeks available yet. Your HOD needs to create and publish an academic week first.
                    </p>
                </div>
            ) : (
                <div className="trainer-card">
                    {/* Week selector */}
                    <div className="trainer-row" style={{ marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e', alignSelf: 'center' }}>Week:</label>
                        <select
                            className="trainer-select"
                            value={selectedWeekId}
                            onChange={e => setSelectedWeekId(e.target.value)}
                            style={{ flex: 1, maxWidth: 400 }}
                        >
                            {weeks.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.label} — {fmt(w.start_date)} → {fmt(w.end_date)}
                                </option>
                            ))}
                        </select>
                        {currentWeek && (
                            <span style={{ fontSize: '0.8rem', color: '#666', alignSelf: 'center' }}>
                                Status: <strong style={{ color: '#16a34a' }}>Published</strong>
                            </span>
                        )}
                    </div>

                    {/* Grid */}
                    <div className="trainer-timetable-grid" style={{ marginBottom: '1rem' }}>
                        <div className="trainer-timetable-header" style={{ fontSize: '0.68rem' }}>Time</div>
                        {DAYS.map(d => <div key={d} className="trainer-timetable-header">{d}</div>)}

                        {TIME_SLOTS.map(slot => (
                            <Fragment key={slot.start}>
                                <div className="trainer-timetable-time">{slot.label}</div>
                                {DAYS.map(day => {
                                    const key = cellKey(day, slot.start);
                                    const selected = selectedCells.has(key);
                                    return (
                                        <div
                                            key={`${day}-${slot.start}`}
                                            onClick={() => handleCellToggle(day, slot)}
                                            className={`trainer-timetable-cell ${selected ? 'scheduled' : 'free'}`}
                                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                                        >
                                            {selected
                                                ? <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a1a2e' }}>✓ Available</span>
                                                : <span style={{ color: '#bbb', fontSize: '0.7rem' }}>Click</span>
                                            }
                                        </div>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </div>

                    {error && <div className="trainer-error">{error}</div>}
                    {message && <div className="trainer-success">{message}</div>}

                    <div style={{ textAlign: 'right' }}>
                        <button className="trainer-btn-primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving…' : '💾 Save Availability'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
