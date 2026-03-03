// FILE: /frontend/src/pages/student/StudentTimetable.jsx
import { useState, useEffect } from 'react';
import { getTimetable, getStudentWeeks } from '../../api/studentApi';
import '../../styles/Student.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '8h–10h' },
    { start: '10:00', end: '12:00', label: '10h–12h' },
    { start: '13:00', end: '15:00', label: '13h–15h' },
    { start: '15:00', end: '17:00', label: '15h–17h' },
    { start: '17:00', end: '19:00', label: '17h–19h' },
    { start: '19:00', end: '21:00', label: '19h–21h' },
];

export default function StudentTimetable() {
    const [weeks, setWeeks] = useState([]);
    const [weeksLoading, setWeeksLoading] = useState(true);
    const [selectedWeekId, setSelectedWeekId] = useState('');
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getStudentWeeks()
            .then(res => {
                const w = res.data.data || [];
                setWeeks(w);
                if (w.length) setSelectedWeekId(String(w[0].id));
                setWeeksLoading(false);
            })
            .catch(() => setWeeksLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedWeekId) { setTimetable([]); return; }
        setLoading(true);
        getTimetable({ weekId: selectedWeekId })
            .then(res => setTimetable(res.data.data || []))
            .catch(() => setTimetable([]))
            .finally(() => setLoading(false));
    }, [selectedWeekId]);

    const currentWeek = weeks.find(w => String(w.id) === selectedWeekId);

    function sessionAt(day, slotStart) {
        return timetable.find(s => s.day_of_week === day && s.time_start === slotStart);
    }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div>
            <div className="student-page-head">
                <div>
                    <h1 className="student-title">My Weekly Timetable</h1>
                    {currentWeek && (
                        <p className="student-sub">
                            From: <strong>{formatDate(currentWeek.start_date)}</strong> &nbsp;·&nbsp; To: <strong>{formatDate(currentWeek.end_date)}</strong>
                        </p>
                    )}
                </div>
            </div>

            {weeksLoading ? (
                <div className="student-msg">Loading weeks…</div>
            ) : !weeks.length ? (
                <div className="student-card">
                    <p className="student-msg">No published timetables available yet for your program.</p>
                </div>
            ) : (
                <div className="student-card">
                    <div className="student-row" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>Select Week:</label>
                        <select
                            className="student-select"
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
                        <p style={{ fontSize: '0.82rem', color: '#7f8c8d', marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#2c3e50' }}>{currentWeek.label}</strong> · From: {formatDate(currentWeek.start_date)} To: {formatDate(currentWeek.end_date)}
                        </p>
                    )}

                    {loading ? (
                        <div className="student-msg">Loading timetable…</div>
                    ) : (
                        <div className="student-timetable-grid">
                            {/* Header */}
                            <div className="student-timetable-header" style={{ fontSize: '0.68rem' }}>Time</div>
                            {DAYS.map(day => (
                                <div key={day} className="student-timetable-header">{day}</div>
                            ))}
                            {/* Rows — all slots always shown */}
                            {TIME_SLOTS.map(slot => (
                                <>
                                    <div key={`t-${slot.start}`} className="student-timetable-time">{slot.label}</div>
                                    {DAYS.map(day => {
                                        const session = sessionAt(day, slot.start);
                                        return (
                                            <div
                                                key={`${day}-${slot.start}`}
                                                className={`student-timetable-cell ${session ? 'scheduled' : 'free'}`}
                                            >
                                                {session ? (
                                                    <>
                                                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{session.course_name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#7f8c8d', marginTop: 2 }}>{session.room_name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#95a5a6' }}>{session.trainer_name}</div>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#bdc3c7', fontStyle: 'italic', fontSize: '0.72rem' }}>Free</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}