import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { parentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function ParentTimetable() {
  const [searchParams] = useSearchParams();
  const [children, setChildren]   = useState([]);
  const [childId, setChildId]     = useState(searchParams.get("childId") || "");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    parentApi.getChildren()
      .then(r => {
        setChildren(r.data);
        if (!childId && r.data.length > 0) setChildId(String(r.data[0].id));
        setLoading(false);
      })
      .catch(() => setError("Failed to load children"));
  }, []);

  useEffect(() => {
    if (!childId) return;
    parentApi.getChildTimetable(childId)
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load timetable"));
  }, [childId]);

  const slots = data?.slots || [];
  const child = data?.child || children.find(c => String(c.id) === String(childId));

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter(s => s.dayOfWeek === d).sort((a,b) => a.timeStart.localeCompare(b.timeStart));
    return acc;
  }, {});

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Child Timetable</h1>
          {child && <p className="page-subtitle">{child.user?.fullName} · {child.matricule}</p>}
        </div>
        {children.length > 1 && (
          <div>
            <label className="label">Select Child</label>
            <select className="select w-52" value={childId} onChange={e => setChildId(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.user?.fullName}</option>)}
            </select>
          </div>
        )}
      </div>

      {slots.length === 0 && (
        <div className="card p-12 text-center">
          <CalendarDays size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No timetable published for this student yet.</p>
        </div>
      )}

      {slots.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => (
              <div key={day} className="rounded-xl border border-pink-200 bg-pink-50 p-4">
                <h3 className="font-bold text-sm mb-3 text-pink-800">{day}</h3>
                {byDay[day].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No class</p>
                ) : (
                  <div className="space-y-2">
                    {byDay[day].map(s => (
                      <div key={s.id} className="rounded-lg border border-pink-300 bg-pink-100 px-3 py-2 text-xs text-pink-900">
                        <p className="font-bold">{s.course?.name}</p>
                        <p className="opacity-70 mt-0.5">{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</p>
                        <p className="opacity-70">{s.trainer?.user?.fullName || "—"}</p>
                        <p className="opacity-70">{s.room?.name || "—"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
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
