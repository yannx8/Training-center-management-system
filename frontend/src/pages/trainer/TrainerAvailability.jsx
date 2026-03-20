import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert, Badge } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

export default function TrainerAvailability() {
  const [weeks, setWeeks]       = useState([]);
  const [weekId, setWeekId]     = useState("");
  const [slots, setSlots]       = useState([]); // [{dayOfWeek,timeStart,timeEnd}]
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    trainerApi.getPublishedWeeks()
      .then(r => { setWeeks(r.data); setLoading(false); })
      .catch(() => { setError("Failed to load published weeks"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!weekId) return;
    trainerApi.getAvailability({ weekId }).then(r => {
      setSlots(r.data.map(a => ({ dayOfWeek: a.dayOfWeek, timeStart: a.timeStart.slice(0,5), timeEnd: a.timeEnd.slice(0,5) })));
    });
  }, [weekId]);

  function toggleSlot(day, time) {
    const key = `${day}|${time}`;
    const end = TIME_SLOTS[TIME_SLOTS.indexOf(time) + 1] || "19:00";
    const exists = slots.find(s => s.dayOfWeek === day && s.timeStart === time);
    if (exists) setSlots(s => s.filter(x => !(x.dayOfWeek === day && x.timeStart === time)));
    else        setSlots(s => [...s, { dayOfWeek: day, timeStart: time, timeEnd: end }]);
  }

  function isSelected(day, time) {
    return slots.some(s => s.dayOfWeek === day && s.timeStart === time);
  }

  async function handleSave() {
    if (!weekId) return;
    setSaving(true); setMsg(""); setError("");
    try {
      await trainerApi.submitAvailability({ weekId, slots });
      setMsg("Availability saved successfully!");
    } catch(e) {
      setError(e.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Availability</h1>
          <p className="page-subtitle">Select the time slots you are available for teaching</p>
        </div>
      </div>

      {weeks.length === 0 && !error && (
        <div className="card p-8 text-center text-gray-400">
          <p className="font-medium">No published weeks available yet.</p>
          <p className="text-sm mt-1">Your HOD needs to publish an academic week before you can submit availability.</p>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {weeks.length > 0 && (
        <>
          <div className="card p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">Select Week</label>
              <select className="select w-72" value={weekId} onChange={e=>setWeekId(e.target.value)}>
                <option value="">— Choose a published week —</option>
                {weeks.map(w => (
                  <option key={w.id} value={w.id}>{w.label} ({w.department?.name || ""})</option>
                ))}
              </select>
            </div>
            {weekId && (
              <div className="flex gap-3">
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={15} /> {saving ? "Saving…" : "Save Availability"}
                </button>
                <button className="btn-secondary" onClick={() => setSlots([])}>
                  <Trash2 size={15} /> Clear All
                </button>
              </div>
            )}
          </div>

          {msg && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{msg}</p>}

          {weekId && (
            <div className="card overflow-x-auto">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">Click cells to toggle availability. <strong>{slots.length}</strong> slot{slots.length !== 1 ? "s" : ""} selected.</p>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-semibold w-20">Time</th>
                    {DAYS.map(d => <th key={d} className="px-3 py-2 text-center text-xs text-gray-500 font-semibold">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.slice(0,-1).map(time => (
                    <tr key={time} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">{time}</td>
                      {DAYS.map(day => (
                        <td key={day} className="px-1 py-1 text-center">
                          <button
                            onClick={() => toggleSlot(day, time)}
                            className={`w-full h-8 rounded text-xs font-medium transition-colors ${
                              isSelected(day, time)
                                ? "bg-primary-500 text-white"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}>
                            {isSelected(day, time) ? "✓" : ""}
                          </button>
                        </td>
                      ))}
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
