import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS = {
  Monday:"bg-blue-50 border-blue-200",
  Tuesday:"bg-green-50 border-green-200",
  Wednesday:"bg-amber-50 border-amber-200",
  Thursday:"bg-purple-50 border-purple-200",
  Friday:"bg-pink-50 border-pink-200",
  Saturday:"bg-gray-50 border-gray-200",
};
const SLOT_COLORS = {
  Monday:"bg-blue-100 border-blue-300 text-blue-900",
  Tuesday:"bg-green-100 border-green-300 text-green-900",
  Wednesday:"bg-amber-100 border-amber-300 text-amber-900",
  Thursday:"bg-purple-100 border-purple-300 text-purple-900",
  Friday:"bg-pink-100 border-pink-300 text-pink-900",
  Saturday:"bg-gray-100 border-gray-300 text-gray-900",
};

export default function StudentTimetable() {
  const [slots, setSlots]     = useState([]);
  const [weeks, setWeeks]     = useState([]);
  const [weekId, setWeekId]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    // Load available published weeks for filtering
    studentApi.getPublishedWeeks()
      .then(r => { setWeeks(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
    // Load all slots initially
    studentApi.getTimetable()
      .then(r => setSlots(r.data))
      .catch(() => setError("Failed to load timetable"));
  }, []);

  useEffect(() => {
    if (weekId) {
      studentApi.getTimetable({ weekId })
        .then(r => setSlots(r.data))
        .catch(() => setError("Failed to load timetable"));
    }
  }, [weekId]);

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter(s => s.dayOfWeek === d).sort((a,b) => a.timeStart.localeCompare(b.timeStart));
    return acc;
  }, {});

  const hasAny = slots.length > 0;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Timetable</h1>
          <p className="page-subtitle">Your scheduled class sessions</p>
        </div>
        {weeks.length > 0 && (
          <div>
            <label className="label">Filter by Week</label>
            <select className="select w-56" value={weekId} onChange={e => setWeekId(e.target.value)}>
              <option value="">All published weeks</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {error && <div className="card p-4 text-red-600 bg-red-50 text-sm">{error}</div>}

      {!hasAny && !error && (
        <div className="card p-12 text-center">
          <CalendarDays size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No timetable published yet</p>
          <p className="text-sm text-gray-400 mt-1">Your timetable will appear here once your HOD generates and publishes it.</p>
        </div>
      )}

      {hasAny && (
        <>
          {/* Week label */}
          {slots[0]?.timetable?.academicWeek?.label && (
            <div className="card p-3 px-5 bg-primary-50 border border-primary-200">
              <p className="text-sm font-medium text-primary-700">
                Week: {slots[0].timetable.academicWeek.label}
                {" · "}{new Date(slots[0].timetable.academicWeek.startDate).toLocaleDateString()} – {new Date(slots[0].timetable.academicWeek.endDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Calendar grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => (
              <div key={day} className={`rounded-xl border p-4 ${DAY_COLORS[day]}`}>
                <h3 className="font-bold text-sm mb-3 text-gray-700">{day}</h3>
                {byDay[day].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No class</p>
                ) : (
                  <div className="space-y-2">
                    {byDay[day].map(s => (
                      <div key={s.id} className={`rounded-lg border px-3 py-2 text-xs ${SLOT_COLORS[day]}`}>
                        <p className="font-bold">{s.course?.name}</p>
                        <p className="opacity-70 mt-0.5">{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</p>
                        <p className="opacity-70">{s.trainer?.user?.fullName || "—"}</p>
                        <p className="opacity-70">{s.room?.name || "No room"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* List view for mobile */}
          <div className="card overflow-hidden md:hidden">
            <table className="table">
              <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Trainer</th><th>Room</th></tr></thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.dayOfWeek}</td>
                    <td className="font-mono text-xs whitespace-nowrap">{s.timeStart?.slice(0,5)}–{s.timeEnd?.slice(0,5)}</td>
                    <td>{s.course?.name}</td>
                    <td>{s.trainer?.user?.fullName || "—"}</td>
                    <td>{s.room?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
