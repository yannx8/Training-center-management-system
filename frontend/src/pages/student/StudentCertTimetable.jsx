// frontend/src/pages/student/StudentCertTimetable.jsx
// Dedicated page showing ALL scheduled certification sessions (history from first to last)
import { useState, useEffect } from 'react';
import { getCertTimetable, getCertTimetableWeeks } from '../../api/studentApi';
import { Icon } from '../../components/Icons';
import '../../styles/Student.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentCertTimetable() {
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        getCertTimetableWeeks()
            .then(r => {
                const w = r.data.data || [];
                setWeeks(w);
                if (w.length > 0) setSelectedWeek(w[0]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedWeek) {
            setSlotsLoading(true);
            getCertTimetable({ weekId: selectedWeek.id })
                .then(r => setSlots(r.data.data || []))
                .finally(() => setSlotsLoading(false));
        }
    }, [selectedWeek]);

    if (loading) return <div className="student-loading">Loading...</div>;

    return (
        <div className="student-page">
            <div className="student-page-head">
                <div>
                    <h1 className="student-title">Certification Sessions</h1>
                    <p className="student-sub">
                        All scheduled certification class sessions — from the first week to the latest.
                    </p>
                </div>
            </div>

            {weeks.length === 0 ? (
                <div className="student-card">
                    <div className="student-empty">
                        <Icon name="timetable" size={40} color="#94a3b8" />
                        <p style={{ fontWeight: 600, color: '#475569', margin: '0.5rem 0 0.25rem' }}>
                            No sessions scheduled yet
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            Scheduled sessions will appear here once your trainer generates the timetable.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Week navigation */}
                    <div className="student-card" style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Scheduled Weeks ({weeks.length} total)
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {weeks.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => setSelectedWeek(w)}
                                    className={selectedWeek?.id === w.id ? 'student-btn-active' : 'student-btn-outline'}
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>{w.week_label || w.label}</div>
                                        {w.certification_name && (
                                            <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{w.certification_name}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected week sessions */}
                    {selectedWeek && (
                        <div className="student-card">
                            <div style={{ marginBottom: '1rem' }}>
                                <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="schedule" size={16} color="#3b5be8" />
                                    {selectedWeek.week_label || selectedWeek.label}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                                    {new Date(selectedWeek.start_date).toLocaleDateString()} – {new Date(selectedWeek.end_date).toLocaleDateString()}
                                    {selectedWeek.certification_name && ` · ${selectedWeek.certification_name}`}
                                </p>
                            </div>

                            {slotsLoading ? (
                                <div className="student-msg">Loading sessions...</div>
                            ) : slots.length === 0 ? (
                                <div className="student-empty">
                                    <Icon name="schedule" size={32} color="#cbd5e1" />
                                    <p>No sessions scheduled for this week.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Grid view */}
                                    <div className="timetable-grid-wrap">
                                        <table className="timetable-grid">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    {DAYS.map(d => <th key={d}>{d}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getTimeSlots(slots).map(time => (
                                                    <tr key={time}>
                                                        <td className="timetable-time">{time}</td>
                                                        {DAYS.map(day => {
                                                            const s = slots.find(sl =>
                                                                sl.day_of_week === day &&
                                                                sl.time_start?.slice(0, 5) === time
                                                            );
                                                            return (
                                                                <td key={day} className={s ? 'timetable-cell timetable-cell--cert' : 'timetable-cell'}>
                                                                    {s && (
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e3a5f' }}>
                                                                                {s.certification_name}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                                                                                {s.time_start?.slice(0, 5)} – {s.time_end?.slice(0, 5)}
                                                                            </div>
                                                                            {s.room_name && (
                                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.room_name}</div>
                                                                            )}
                                                                            {s.trainer_name && (
                                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.trainer_name}</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary */}
                                    <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                                        {slots.length} session{slots.length !== 1 ? 's' : ''} in this week
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function getTimeSlots(slots) {
    const times = [...new Set(slots.map(s => s.time_start?.slice(0, 5)))];
    return times.sort();
}