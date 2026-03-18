// FILE: src/pages/hod/HodTimetable.jsx
import { useEffect, useState } from "react";
import { Zap, Send } from "lucide-react";
import { hodApi } from "../../api";
import { PageLoader, ErrorAlert, Badge } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function HodTimetable() {
  const [weeks, setWeeks]       = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedTT, setSelectedTT]     = useState(null); // timetable object
  const [selectedProg, setSelectedProg] = useState("");   // programId
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg]           = useState("");
  const [error, setError]       = useState("");

  function load() {
    Promise.all([hodApi.getWeeks(), hodApi.getTimetables()])
      .then(([w,t]) => { setWeeks(w.data); setTimetables(t.data); setLoading(false); });
  }
  useEffect(load, []);

  async function generate() {
    if (!selectedWeek) return alert("Select a published week first");
    setGenerating(true); setMsg(""); setError("");
    try {
      const r = await hodApi.generateTimetable({ weekId: selectedWeek });
      setMsg(`Generated: ${r.data.scheduled} sessions scheduled (${r.data.skipped} skipped)`);
      load();
    } catch(e) { setError(e.response?.data?.message || "Generation failed"); }
    finally { setGenerating(false); }
  }

  async function publish(id) { await hodApi.publishTimetable(id); load(); }

  const publishedWeeks = weeks.filter(w => w.status === "published");

  // When a timetable is selected, reset program selection
  function selectTimetable(tt) { setSelectedTT(tt); setSelectedProg(""); }

  const currentSlots = selectedTT && selectedProg
    ? selectedTT.programGroups?.find(g => String(g.program.id) === String(selectedProg))?.slots || []
    : [];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Timetable Generator</h1>
        <p className="page-subtitle">Generate academic timetables per program</p>
      </div>

      {/* Generation controls */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Published Week</label>
            <select className="select w-64" value={selectedWeek} onChange={e=>setSelectedWeek(e.target.value)}>
              <option value="">— Select week —</option>
              {publishedWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={generate} disabled={generating||!selectedWeek}>
            <Zap size={16}/> {generating ? "Generating…" : "Generate Timetable"}
          </button>
        </div>
        {msg   && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">✅ {msg}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      </div>

      {/* Timetables list */}
      {timetables.map(tt => (
        <div key={tt.id} className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{tt.label}</p>
              <p className="text-xs text-gray-400">{tt.academicWeek?.label} · {new Date(tt.generatedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-3 items-center">
              <Badge value={tt.status} />
              {tt.status === "draft" && <button className="btn-primary btn-sm" onClick={() => publish(tt.id)}><Send size={13}/> Publish</button>}
            </div>
          </div>

          {/* Program selector */}
          {tt.programGroups?.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2">
              {tt.programGroups.map(g => (
                <button key={g.program.id}
                  onClick={() => { selectTimetable(tt); setSelectedProg(String(g.program.id)); }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                    selectedTT?.id === tt.id && String(selectedProg) === String(g.program.id)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-400"
                  }`}>
                  {g.program.name} ({g.slots.length})
                </button>
              ))}
            </div>
          )}

          {/* Slots for selected program */}
          {selectedTT?.id === tt.id && selectedProg && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Trainer</th><th>Room</th><th>Level</th><th>Semester</th></tr></thead>
                <tbody>
                  {currentSlots.map(s => (
                    <tr key={s.id}>
                      <td>{s.dayOfWeek}</td>
                      <td className="whitespace-nowrap font-mono text-xs">{s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}</td>
                      <td>{s.course?.name || "—"}</td>
                      <td>{s.trainer?.user?.fullName || "—"}</td>
                      <td>{s.room?.name || "—"}</td>
                      <td>{s.course?.session?.academicLevel?.name || "—"}</td>
                      <td>{s.course?.session?.semester?.name || "—"}</td>
                    </tr>
                  ))}
                  {currentSlots.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-6">No slots for this program.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {timetables.length === 0 && <div className="card p-10 text-center text-gray-400">No timetables generated yet.</div>}
    </div>
  );
}
