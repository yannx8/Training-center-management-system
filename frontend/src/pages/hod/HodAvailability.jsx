// FILE: src/pages/hod/HodAvailability.jsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, User, Lock, Unlock, ArrowLeft } from "lucide-react";
import { hodApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function HodAvailability() {
  const [weeks, setWeeks]           = useState([]);
  const [weekId, setWeekId]         = useState("");
  const [status, setStatus]         = useState(null); // { trainers, weekId }
  const [selected, setSelected]     = useState(null); // trainer object
  const [locked, setLocked]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    hodApi.getWeeks().then(r => { setWeeks(r.data.filter(w=>w.status==="published")); setLoading(false); })
      .catch(() => setError("Failed to load weeks"));
  }, []);

  useEffect(() => {
    if (!weekId) return;
    setSelected(null);
    hodApi.getTrainerAvailabilityStatus(weekId).then(r => setStatus(r.data));
    hodApi.getLockStatus(weekId).then(r => setLocked(r.data.isLocked));
  }, [weekId]);

  async function toggleLock() {
    if (locked) await hodApi.unlockAvailability({ weekId });
    else        await hodApi.lockAvailability({ weekId });
    hodApi.getLockStatus(weekId).then(r => setLocked(r.data.isLocked));
  }

  const submitted   = status?.trainers?.filter(t => t.submitted) || [];
  const notSubmitted= status?.trainers?.filter(t => !t.submitted) || [];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Trainer Availability</h1>
        <p className="page-subtitle">Monitor who has submitted availability for each published week</p>
      </div>
      {error && <ErrorAlert message={error} />}

      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Published Week</label>
          <select className="select w-64" value={weekId} onChange={e => setWeekId(e.target.value)}>
            <option value="">— Choose a week —</option>
            {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>
        {weekId && (
          <button className={locked ? "btn-secondary" : "btn-primary"} onClick={toggleLock}>
            {locked ? <><Unlock size={14}/> Unlock</> : <><Lock size={14}/> Lock Submissions</>}
          </button>
        )}
        {locked && <span className="badge-red">🔒 Locked — trainers cannot edit</span>}
      </div>

      {/* Trainer detail view */}
      {selected && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <button className="btn-ghost btn-sm btn-icon" onClick={() => setSelected(null)}><ArrowLeft size={16}/></button>
            <div>
              <p className="font-semibold text-gray-900">{selected.user?.fullName}</p>
              <p className="text-xs text-gray-400">{selected.slotCount} slot(s) submitted</p>
            </div>
          </div>
          <div className="p-5">
            {selected.slots?.length === 0 && <p className="text-sm text-gray-400">No availability submitted.</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DAYS.map(day => {
                const daySlots = selected.slots?.filter(s => s.dayOfWeek === day) || [];
                return (
                  <div key={day} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">{day}</p>
                    {daySlots.length === 0
                      ? <p className="text-xs text-gray-300 text-center py-2">—</p>
                      : daySlots.map((s,i) => (
                        <div key={i} className="text-xs bg-primary-100 text-primary-800 rounded px-2 py-1 mb-1">
                          {s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}
                        </div>
                      ))
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trainer list */}
      {status && !selected && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Submitted */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500"/> Submitted ({submitted.length})
            </h2>
            <p className="text-xs text-gray-400">These trainers have submitted their availability for the selected week.</p>
            {submitted.map(t => (
              <button key={t.id} className="w-full card p-4 flex items-center gap-3 hover:bg-primary-50 text-left transition-colors"
                onClick={() => setSelected(t)}>
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={15} className="text-green-700"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.user?.fullName}</p>
                  <p className="text-xs text-gray-400">{t.slotCount} slot(s) · Click to view</p>
                </div>
                <CheckCircle size={16} className="text-green-500 flex-shrink-0"/>
              </button>
            ))}
            {submitted.length === 0 && <p className="text-sm text-gray-400 italic">None yet.</p>}
          </div>

          {/* Not submitted */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <XCircle size={14} className="text-red-400"/> Not Submitted ({notSubmitted.length})
            </h2>
            <p className="text-xs text-gray-400">These trainers have NOT yet submitted availability. Consider reminding them.</p>
            {notSubmitted.map(t => (
              <div key={t.id} className="card p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={15} className="text-red-500"/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{t.user?.fullName}</p>
                  <p className="text-xs text-gray-400">{t.user?.email}</p>
                </div>
                <XCircle size={16} className="text-red-400 flex-shrink-0"/>
              </div>
            ))}
            {notSubmitted.length === 0 && <p className="text-sm text-green-600 font-medium">All trainers have submitted! ✓</p>}
          </div>
        </div>
      )}

      {!weekId && <div className="card p-8 text-center text-gray-400">Select a published week to see availability status.</div>}
    </div>
  );
}
