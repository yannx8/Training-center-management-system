// FILE: src/pages/student/StudentCertAvailability.jsx
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

export default function StudentCertAvailability() {
  const [enrollments, setEnrollments] = useState([]);
  const [weeks, setWeeks]             = useState([]);
  const [certId, setCertId]           = useState("");
  const [weekId, setWeekId]           = useState("");
  const [slots, setSlots]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [msg, setMsg]                 = useState("");

  useEffect(() => {
    Promise.all([studentApi.getCertEnrollments(), studentApi.getPublishedWeeks()])
      .then(([e, w]) => { setEnrollments(e.data); setWeeks(w.data); setLoading(false); })
      .catch(() => setError("Failed to load data"));
  }, []);

  useEffect(() => {
    if (!weekId || !certId) return;
    studentApi.getCertAvailability({ weekId, certificationId: certId })
      .then(r => setSlots(r.data.map(a => ({ dayOfWeek: a.dayOfWeek, timeStart: a.timeStart.slice(0,5) }))));
  }, [weekId, certId]);

  function toggleSlot(day, time) {
    const exists = slots.find(s => s.dayOfWeek === day && s.timeStart === time);
    if (exists) setSlots(s => s.filter(x => !(x.dayOfWeek === day && x.timeStart === time)));
    else        setSlots(s => [...s, { dayOfWeek: day, timeStart: time, timeEnd: TIME_SLOTS[TIME_SLOTS.indexOf(time)+1]||"19:00" }]);
  }

  async function handleSave() {
    if (!weekId || !certId) return;
    setSaving(true); setMsg(""); setError("");
    try {
      await studentApi.submitCertAvailability({ weekId, certificationId: certId, slots });
      setMsg("Availability saved!");
    } catch(e) { setError(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Certification Availability</h1>
        <p className="page-subtitle">Submit your available slots for certification scheduling</p>
      </div>
      {error && <ErrorAlert message={error} />}

      {enrollments.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">You are not enrolled in any certifications.</div>
      ) : (
        <>
          <div className="card p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">Certification</label>
              <select className="select w-64" value={certId} onChange={e=>setCertId(e.target.value)}>
                <option value="">— Select certification —</option>
                {enrollments.map(e => <option key={e.certificationId} value={e.certificationId}>{e.certification?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Week</label>
              <select className="select w-64" value={weekId} onChange={e=>setWeekId(e.target.value)}>
                <option value="">— Select week —</option>
                {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
            {weekId && certId && (
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={15} /> {saving ? "Saving…" : "Save Availability"}
              </button>
            )}
          </div>

          {msg && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{msg}</p>}

          {weekId && certId && (
            <div className="card overflow-x-auto">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm text-gray-500"><strong>{slots.length}</strong> slot{slots.length!==1?"s":""} selected.</p>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-semibold w-20">Time</th>
                  {DAYS.map(d => <th key={d} className="px-3 py-2 text-center text-xs text-gray-500 font-semibold">{d}</th>)}
                </tr></thead>
                <tbody>
                  {TIME_SLOTS.slice(0,-1).map(time => (
                    <tr key={time} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">{time}</td>
                      {DAYS.map(day => {
                        const sel = slots.some(s => s.dayOfWeek===day && s.timeStart===time);
                        return (
                          <td key={day} className="px-1 py-1 text-center">
                            <button onClick={()=>toggleSlot(day,time)}
                              className={`w-full h-8 rounded text-xs font-medium transition-colors ${sel?"bg-blue-500 text-white":"bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                              {sel?"✓":""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
