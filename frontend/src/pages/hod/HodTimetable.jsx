// FILE: src/pages/hod/HodTimetable.jsx
import { useEffect, useState } from "react";
import { Zap, Send } from "lucide-react";
import { hodApi } from "../../api";
import { PageLoader, ErrorAlert, Badge } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function HodTimetable() {
  const [weeks, setWeeks]         = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState("");
  const [msg, setMsg]             = useState("");

  function load() {
    Promise.all([hodApi.getWeeks(), hodApi.getTimetables()])
      .then(([w, t]) => { setWeeks(w.data); setTimetables(t.data); setLoading(false); });
  }
  useEffect(load, []);

  async function generate() {
    if (!selectedWeek) return alert("Select a published week first");
    setGenerating(true); setMsg(""); setError("");
    try {
      const r = await hodApi.generateTimetable({ weekId: selectedWeek });
      setMsg(`✅ Generated: ${r.data.scheduled} sessions scheduled (${r.data.skipped} skipped)`);
      load();
    } catch(e) { setError(e.response?.data?.message || "Generation failed"); }
    finally { setGenerating(false); }
  }

  async function publish(id) {
    await hodApi.publishTimetable(id);
    load();
  }

  const publishedWeeks = weeks.filter(w => w.status === "published");
  const activeTimetable = timetables.find(t => t.academicWeekId === +selectedWeek);

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable Generator</h1>
          <p className="page-subtitle">Generate academic timetables from trainer availabilities</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Published Week</label>
            <select className="select w-64" value={selectedWeek} onChange={e=>setSelectedWeek(e.target.value)}>
              <option value="">— Select week —</option>
              {publishedWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={generate} disabled={generating||!selectedWeek}>
            <Zap size={16} /> {generating ? "Generating…" : "Generate Timetable"}
          </button>
        </div>
        {msg && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{msg}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      </div>

      {/* Timetables list */}
      <div className="space-y-4">
        {timetables.map(tt => (
          <div key={tt.id} className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{tt.label}</p>
                <p className="text-xs text-gray-400">{tt.academicWeek?.label} · Generated {new Date(tt.generatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 items-center">
                <Badge value={tt.status} />
                {tt.status === "draft" && (
                  <button className="btn-primary btn-sm" onClick={() => publish(tt.id)}>
                    <Send size={13} /> Publish
                  </button>
                )}
              </div>
            </div>

            {/* Slot grid */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>
                  <th>Day</th><th>Time</th><th>Course</th><th>Trainer</th><th>Room</th>
                </tr></thead>
                <tbody>
                  {tt.slots?.map(s => (
                    <tr key={s.id}>
                      <td>{s.dayOfWeek}</td>
                      <td className="whitespace-nowrap">{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</td>
                      <td>{s.course?.name || "—"}</td>
                      <td>{s.trainer?.user?.fullName || "—"}</td>
                      <td>{s.room?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
