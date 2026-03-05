import { useState, useEffect, Fragment } from 'react';
import { getTimetable, getTrainerWeeks } from '../../api/trainerApi';
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

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function TrainerTimetable() {
    const [weeks, setWeeks] = useState([]);
    const [weeksLoading, setWeeksLoading] = useState(true);
    const [selectedWeekId, setSelectedWeekId] = useState('');
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getTrainerWeeks()
            .then(res => {
                const w = res.data.data || [];
                setWeeks(w);
                if (w.length) setSelectedWeekId(String(w[0].id));
            })
            .catch(() => {})
            .finally(() => setWeeksLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedWeekId) { setTimetable([]); return; }
        let cancelled = false;
        setLoading(true);
        getTimetable({ weekId: selectedWeekId })
            .then(res => { if (!cancelled) setTimetable(res.data.data || []); })
            .catch(() => { if (!cancelled) setTimetable([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [selectedWeekId]);

    const currentWeek = weeks.find(w => String(w.id) === selectedWeekId);

    function sessionAt(day, slotStart) {
        return timetable.find(s => {
            // time_start from DB may be 'HH:MM:SS' or 'HH:MM' — normalise to HH:MM
            const t = (s.time_start || '').substring(0, 5);
            return s.day_of_week === day && t === slotStart;
        });
    }

    return (
        <div>
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">My Weekly Timetable</h1>
                    {currentWeek && (
                        <p className="trainer-sub">
                            From: <strong>{formatDate(currentWeek.start_date)}</strong>
                            &nbsp;To: <strong>{formatDate(currentWeek.end_date)}</strong>
                        </p>
                    )}
                </div>
            </div>

            {weeksLoading ? (
                <div className="trainer-msg">Loading weeks…</div>
            ) : !weeks.length ? (
                <div className="trainer-card">
                    <p className="trainer-msg">
                        No published timetables available yet. Wait for your HOD to generate and publish one.
                    </p>
                </div>
            ) : (
                <div className="trainer-card">
                    <div className="trainer-row" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a2e' }}>
                            Select Week:
                        </label>
                        <select
                            className="trainer-select"
                            value={selectedWeekId}
                            onChange={e => setSelectedWeekId(e.target.value)}
                        >
                            {weeks.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.label} — {formatDate(w.start_date)} → {formatDate(w.end_date)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="trainer-msg">Loading timetable…</div>
                    ) : (
                        <div className="trainer-timetable-grid">
                            {/* Header row */}
                            <div className="trainer-timetable-header" style={{ fontSize: '0.68rem' }}>Time</div>
                            {DAYS.map(day => (
                                <div key={day} className="trainer-timetable-header">{day}</div>
                            ))}

                            {/* Time slot rows */}
                            {TIME_SLOTS.map(slot => (
                                <Fragment key={slot.start}>
                                    <div className="trainer-timetable-time">{slot.label}</div>
                                    {DAYS.map(day => {
                                        const session = sessionAt(day, slot.start);
                                        return (
                                            <div
                                                key={`${day}-${slot.start}`}
                                                className={`trainer-timetable-cell ${session ? 'scheduled' : 'free'}`}
                                            >
                                                {session ? (
                                                    <>
                                                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1a1a2e' }}>
                                                            {session.course_name}
                                                        </div>
                                                        {session.room_name && (
                                                            <div style={{
                                                                fontSize: '0.65rem',
                                                                color: '#3b5be8',
                                                                marginTop: 2,
                                                                fontWeight: 600,
                                                            }}>
                                                                📍 {session.room_name}
                                                            </div>
                                                        )}
                                                        {session.course_code && (
                                                            <div style={{ fontSize: '0.6rem', color: '#888', marginTop: 1 }}>
                                                                {session.course_code}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.72rem' }}>
                                                        Free
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}