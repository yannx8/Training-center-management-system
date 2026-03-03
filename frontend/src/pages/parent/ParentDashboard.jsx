// FILE: /frontend/src/pages/parent/ParentDashboard.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getMyStudents, getStudentGrades, getStudentTimetable } from '../../api/parentApi';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function ParentDashboard() {
  const { data: students, loading } = useFetch(getMyStudents);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('grades'); // 'grades' | 'timetable'
  const [grades, setGrades] = useState([]);
  const [timetable, setTimetable] = useState([]);

  async function selectStudent(s) {
    setSelected(s);
    const [gRes, tRes] = await Promise.all([getStudentGrades(s.id), getStudentTimetable(s.id)]);
    setGrades(gRes.data.data);
    setTimetable(tRes.data.data);
  }

  const byDay = {};
  DAYS.forEach(d => { byDay[d] = timetable.filter(s => s.day_of_week === d); });

  return (
    <div>
      <h1 className="page-title">My Children</h1>
      {loading ? <div className="page-loading">Loading...</div> : !students?.length
        ? <div className="empty-state"><div className="empty-icon">👨‍👩‍👧</div><h3>No students linked to your account</h3></div>
        : (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="table-card" style={{ width: 260 }}>
              {students.map(s => (
                <div key={s.id} className={`course-item${selected?.id === s.id ? ' selected' : ''}`} onClick={() => selectStudent(s)}>
                  <strong>{s.full_name}</strong>
                  <div className="course-meta">{s.matricule} — {s.program_name}</div>
                </div>
              ))}
            </div>
            {selected && (
              <div style={{ flex: 1 }}>
                <div className="tabs">
                  <button className={`tab${view === 'grades' ? ' active' : ''}`} onClick={() => setView('grades')}>Grades</button>
                  <button className={`tab${view === 'timetable' ? ' active' : ''}`} onClick={() => setView('timetable')}>Timetable</button>
                </div>
                {view === 'grades' && (
                  <div className="table-card">
                    {!grades.length ? <div className="empty-state"><h3>No grades yet</h3></div>
                      : (
                        <table className="data-table">
                          <thead><tr><th>Subject</th><th>Grade</th><th>Letter</th><th>Year</th></tr></thead>
                          <tbody>
                            {grades.map(g => (
                              <tr key={g.id}><td>{g.course_name || g.certification_name}</td><td>{g.grade}</td><td><Badge label={g.grade_letter || '—'} /></td><td>{g.academic_year}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }
                  </div>
                )}
                {view === 'timetable' && (
                  <div className="timetable-grid">
                    {DAYS.map(day => (
                      <div key={day} className="timetable-day">
                        <div className="timetable-day-header">{day}</div>
                        {byDay[day].length === 0 ? <div className="timetable-empty">Free</div>
                          : byDay[day].map((s, i) => (
                            <div key={i} className="timetable-slot">
                              <div className="slot-time">{s.time_start} - {s.time_end}</div>
                              <div className="slot-subject">{s.course_name || s.certification_name}</div>
                              <div className="slot-room">{s.room_name}</div>
                            </div>
                          ))
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}