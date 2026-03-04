import { useState, useEffect } from 'react';
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
        if (!selectedWeekId) {
            setTimetable([]);
            return;
        }
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
        return timetable.find(s => s.day_of_week === day && s.time_start === slotStart);
    }

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

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
                    <p className="trainer-msg">No published timetables available for you yet.</p>
                </div>
            ) : (
                <div className="trainer-card">
                    <div className="trainer-row" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a2e' }}>Select Week:</label>
                        <select
                            className="trainer-select"
                            value={selectedWeekId}
                            onChange={e => setSelectedWeekId(e.target.value)}
                        >
                            {weeks.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.label} — From: {formatDate(w.start_date)} To: {formatDate(w.end_date)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentWeek && (
                        <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem', fontWeight: 500 }}>
                            {currentWeek.label} · From: {formatDate(currentWeek.start_date)} To: {formatDate(currentWeek.end_date)}
                        </p>
                    )}

                    {loading ? (
                        <div className="trainer-msg">Loading timetable…</div>
                    ) : (
                        <div className="trainer-timetable-grid">
                            <div className="trainer-timetable-header" style={{ fontSize: '0.68rem' }}>Time</div>
                            {DAYS.map(day => (
                                <div key={day} className="trainer-timetable-header">{day}</div>
                            ))}
                            {TIME_SLOTS.map(slot => (
                                <React.Fragment key={slot.start}>
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
                                                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{session.course_name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 2 }}>{session.room_name}</div>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '0.72rem' }}>Free</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}