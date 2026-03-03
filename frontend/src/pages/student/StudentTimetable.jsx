// FILE: /frontend/src/pages/student/StudentTimetable.jsx
import { useFetch } from '../../hooks/useFetch';
import { getTimetable } from '../../api/studentApi';
import '../../styles/Page.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function StudentTimetable() {
  const { data, loading } = useFetch(getTimetable);
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = (data || []).filter(s => s.day_of_week === d); });

  return (
    <div>
      <h1 className="page-title">My Weekly Timetable</h1>
      {loading ? <div className="page-loading">Loading...</div> : !data?.length
        ? <div className="empty-state"><div className="empty-icon">📅</div><h3>No timetable available yet</h3></div>
        : (
          <div className="timetable-grid">
            {DAYS.map(day => (
              <div key={day} className="timetable-day">
                <div className="timetable-day-header">{day}</div>
                {byDay[day].length === 0 ? <div className="timetable-empty">Free</div>
                  : byDay[day].map((s, i) => (
                    <div key={i} className="timetable-slot">
                      <div className="slot-time">{s.time_start} - {s.time_end}</div>
                      <div className="slot-subject">{s.course_name || s.certification_name}</div>
                      <div className="slot-room">{s.room_name} — {s.trainer_name}</div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}