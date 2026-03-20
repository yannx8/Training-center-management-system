import { useEffect, useState } from "react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const COLOR = { academic:"bg-blue-100 text-blue-800", certification:"bg-amber-100 text-amber-800" };

export default function TrainerTimetable() {
  const [slots, setSlots]   = useState({ academicSlots:[], certSlots:[] });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    trainerApi.getTimetable().then(r => { setSlots(r.data); setLoading(false); })
      .catch(() => setError("Failed to load timetable"));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const all = [
    ...slots.academicSlots.map(s => ({ ...s, type:"academic", subject: s.course?.name, week: s.timetable?.academicWeek?.label })),
    ...slots.certSlots.map(s => ({ ...s, type:"certification", subject: s.certification?.name, week: s.academicWeek?.label })),
  ];

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = all.filter(s => s.dayOfWeek === d).sort((a,b) => a.timeStart.localeCompare(b.timeStart));
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Timetable</h1>
        <p className="page-subtitle">All scheduled academic and certification sessions</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr>
            {DAYS.map(d => <th key={d}>{d}</th>)}
          </tr></thead>
          <tbody>
            <tr className="align-top">
              {DAYS.map(day => (
                <td key={day} className="p-2 min-w-[150px] align-top">
                  {byDay[day].length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">—</p>
                  ) : (
                    <div className="space-y-2">
                      {byDay[day].map((s,i) => (
                        <div key={i} className={`rounded-lg p-2 text-xs ${COLOR[s.type]}`}>
                          <p className="font-semibold">{s.subject}</p>
                          <p>{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</p>
                          <p className="opacity-70">{s.room?.name || "No room"}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${s.type==="academic"?"bg-blue-200":"bg-amber-200"}`}>{s.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {all.length === 0 && (
        <div className="card p-10 text-center text-gray-400">No sessions scheduled yet.</div>
      )}
    </div>
  );
}
