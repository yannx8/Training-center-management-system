// FILE: /frontend/src/pages/trainer/TrainerTimetable.jsx
import { useFetch } from '../../hooks/useFetch';
import { getTimetable } from '../../api/trainerApi';
import '../../styles/Page.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TrainerTimetable() {
  const { data, loading } = useFetch(getTimetable);
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = (data || []).filter(s => s.day_of_week === d); });

  return (
    <div>
      <h1 className="page-title">My Weekly Timetable</h1>
      {loading ? <div className="page-loading">Loading...</div> : !data?.length
        ? <div className="empty-state"><div className="empty-icon">📅</div><h3>No timetable published yet</h3></div>
        : (
          <div className="timetable-grid">
            {DAYS.map(day => (
              <div key={day} className="timetable-day">
                <div className="timetable-day-header">{day}</div>
                {byDay[day].length === 0
                  ? <div className="timetable-empty">Free</div>
                  : byDay[day].map(slot => (
                    <div key={slot.id} className="timetable-slot">
                      <div className="slot-time">{slot.time_start} - {slot.time_end}</div>
                      <div className="slot-subject">{slot.course_name || slot.certification_name}</div>
                      <div className="slot-room">{slot.room_name}</div>
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