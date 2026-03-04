// FILE: /frontend/src/pages/hod/HodAvailability.jsx
import { useState, useEffect } from 'react';
import { getAvailability, getLockStatus, lockAvailability, unlockAvailability, getAcademicWeeks } from '../../api/hodApi';
import '../../styles/Hod.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00', label: '8h–10h' },
    { start: '10:00', label: '10h–12h' },
    { start: '13:00', label: '13h–15h' },
    { start: '15:00', label: '15h–17h' },
    { start: '17:00', label: '17h–19h' },
    { start: '19:00', label: '19h–21h' },
];

function normalizeTime(t) {
    if (!t) return '';
    return t.substring(0, 5); // Take HH:MM portion
}

export default function HodAvailability() {
    const [weeks, setWeeks] = useState([]);
    const [selectedWeekId, setSelectedWeekId] = useState('');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [locking, setLocking] = useState(false);

    useEffect(() => {
        getAcademicWeeks()
            .then(res => {
                const w = res.data.data || [];
                setWeeks(w);
                if (w.length) setSelectedWeekId(String(w[0].id));
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedWeekId) { setSlots([]); return; }
        loadAvailability(selectedWeekId);
        loadLockStatus(selectedWeekId);
    }, [selectedWeekId]);

    async function loadAvailability(weekId) {
        setLoading(true);
        try {
            const res = await getAvailability({ weekId });
            setSlots(res.data.data || []);
        } catch {} finally { setLoading(false); }
    }

    async function loadLockStatus(weekId) {
        try {
            const res = await getLockStatus({ weekId });
            setIsLocked(res.data.data?.isLocked || false);
        } catch {}
    }

    async function toggleLock() {
        if (!selectedWeekId) return;
        setLocking(true);
        try {
            if (isLocked) {
                await unlockAvailability(selectedWeekId);
                setIsLocked(false);
            } else {
                await lockAvailability(selectedWeekId);
                setIsLocked(true);
            }
        } catch {} finally { setLocking(false); }
    }

    const trainerCount = [...new Set(slots.map(s => s.trainer_id))].length;

    // Build grid: trainer → day → timeslot lookup
    function slotsAt(day, timeStart) {
        return slots.filter(s =>
            s.day_of_week === day && normalizeTime(s.time_start) === normalizeTime(timeStart)
        );
    }

    const currentWeek = weeks.find(w => String(w.id) === selectedWeekId);

    return (
        <div>
            <div className="hod-page-head">
                <div>
                    <h1 className="hod-title">Trainer Availability</h1>
                    <p className="hod-sub">
                        {loading ? '…' : `${trainerCount} trainer(s) · ${slots.length} slot(s)`}
                    </p>
                </div>
                <div className="hod-row" style={{ gap: '0.75rem' }}>
                    <select
                        className="hod-select"
                        value={selectedWeekId}
                        onChange={e => setSelectedWeekId(e.target.value)}
                        style={{ minWidth: 220 }}
                    >
                        <option value="">— Select Week —</option>
                        {weeks.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.label} ({new Date(w.start_date).toLocaleDateString('en-GB')} – {new Date(w.end_date).toLocaleDateString('en-GB')})
                            </option>
                        ))}
                    </select>
                    {selectedWeekId && (
                        <button
                            className={isLocked ? 'hod-btn hod-btn-danger' : 'hod-btn'}
                            onClick={toggleLock}
                            disabled={locking}
                        >
                            {isLocked ? '🔒 Unlock Submissions' : '🔓 Lock Submissions'}
                        </button>
                    )}
                </div>
            </div>

            {isLocked && selectedWeekId && (
                <div className="hod-notice">
                    Submissions are locked for this week — trainers cannot add or remove slots.
                </div>
            )}

            {!selectedWeekId ? (
                <p className="hod-msg">Select a week to view trainer availability.</p>
            ) : loading ? (
                <p className="hod-msg">Loading…</p>
            ) : !slots.length ? (
                <p className="hod-msg">No availability submitted yet by trainers for this week.</p>
            ) : (
                <div className="hod-card">
                    {currentWeek && (
                        <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '1rem' }}>
                            <strong>{currentWeek.label}</strong> — {new Date(currentWeek.start_date).toLocaleDateString('en-GB')} to {new Date(currentWeek.end_date).toLocaleDateString('en-GB')}
                        </p>
                    )}

                    {/* Availability grid: days × time slots, cells list trainers */}
                    <div className="hod-tt-grid">
                        <div className="hod-tt-timecell hod-tt-header"></div>
                        {DAYS.map(d => <div key={d} className="hod-tt-header">{d}</div>)}

                        {TIME_SLOTS.map(slot => (
                            <>
                                <div key={`t-${slot.start}`} className="hod-tt-timecell">{slot.label}</div>
                                {DAYS.map(day => {
                                    const trainersHere = slotsAt(day, slot.start);
                                    return (
                                        <div key={`${day}-${slot.start}`} className={`hod-tt-cell ${trainersHere.length ? 'hod-tt-cell-filled' : 'hod-tt-cell-empty'}`}>
                                            {trainersHere.map(s => (
                                                <div key={s.id} style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1a1a2e', marginBottom: 1 }}>
                                                    {s.trainer_name}
                                                </div>
                                            ))}
                                            {!trainersHere.length && <span style={{ color: '#ccc', fontSize: '0.68rem', fontStyle: 'italic' }}>—</span>}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}