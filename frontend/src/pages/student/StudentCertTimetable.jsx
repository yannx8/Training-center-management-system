// FILE: src/pages/student/StudentCertTimetable.jsx
import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function StudentCertTimetable() {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    studentApi.getCertTimetable()
      .then(r => { setSlots(r.data); setLoading(false); })
      .catch(() => setError("Failed to load certification timetable"));
  }, []);

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter(s => s.dayOfWeek === d).sort((a,b) => a.timeStart.localeCompare(b.timeStart));
    return acc;
  }, {});

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Certification Timetable</h1>
        <p className="page-subtitle">Your scheduled certification sessions</p>
      </div>

      {slots.length === 0 && (
        <div className="card p-12 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No certification sessions scheduled</p>
          <p className="text-sm text-gray-400 mt-1">Submit your availability in the Cert Availability tab so the HOD can generate your schedule.</p>
        </div>
      )}

      {slots.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => (
              <div key={day} className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <h3 className="font-bold text-sm mb-3 text-violet-800">{day}</h3>
                {byDay[day].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No session</p>
                ) : (
                  <div className="space-y-2">
                    {byDay[day].map(s => (
                      <div key={s.id} className="rounded-lg border border-violet-300 bg-violet-100 px-3 py-2 text-xs text-violet-900">
                        <p className="font-bold">{s.certification?.name}</p>
                        <p className="opacity-70 mt-0.5">{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</p>
                        <p className="opacity-70">{s.trainer?.user?.fullName || "—"}</p>
                        <p className="opacity-70">{s.room?.name || "No room assigned"}</p>
                        <p className="opacity-60 text-[10px] mt-1">{s.academicWeek?.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead><tr><th>Day</th><th>Time</th><th>Certification</th><th>Trainer</th><th>Room</th><th>Week</th></tr></thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.dayOfWeek}</td>
                    <td className="font-mono text-xs whitespace-nowrap">{s.timeStart?.slice(0,5)}–{s.timeEnd?.slice(0,5)}</td>
                    <td>{s.certification?.name}</td>
                    <td>{s.trainer?.user?.fullName || "—"}</td>
                    <td>{s.room?.name || "—"}</td>
                    <td className="text-gray-400">{s.academicWeek?.label || "—"}</td>
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
