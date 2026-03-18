// FILE: src/pages/hod/HodAvailability.jsx
import { useEffect, useState } from "react";
import { hodApi } from "../../api";
import { PageLoader, ErrorAlert, Badge } from "../../components/ui";
import Table from "../../components/ui/Table";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function HodAvailability() {
  const [weeks, setWeeks]     = useState([]);
  const [weekId, setWeekId]   = useState("");
  const [avail, setAvail]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [locked, setLocked]   = useState(false);

  useEffect(() => {
    hodApi.getWeeks().then(r => { setWeeks(r.data.filter(w=>w.status==="published")); setLoading(false); })
      .catch(() => setError("Failed to load weeks"));
  }, []);

  useEffect(() => {
    if (!weekId) return;
    hodApi.getAvailability({ weekId }).then(r => setAvail(r.data));
    hodApi.getLockStatus(weekId).then(r => setLocked(r.data.isLocked));
  }, [weekId]);

  async function toggleLock() {
    if (locked) await hodApi.unlockAvailability({ weekId });
    else        await hodApi.lockAvailability({ weekId });
    hodApi.getLockStatus(weekId).then(r => setLocked(r.data.isLocked));
  }

  const cols = [
    { key:"trainerName", label:"Trainer" },
    { key:"dayOfWeek", label:"Day" },
    { key:"timeStart", label:"From", render: a => a.timeStart?.slice(0,5) },
    { key:"timeEnd", label:"To", render: a => a.timeEnd?.slice(0,5) },
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainer Availability</h1>
          <p className="page-subtitle">View what trainers submitted for each published week</p>
        </div>
      </div>
      {error && <ErrorAlert message={error} />}

      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Select Published Week</label>
          <select className="select w-64" value={weekId} onChange={e => setWeekId(e.target.value)}>
            <option value="">— Choose a week —</option>
            {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>
        {weekId && (
          <button className={`btn-sm ${locked ? "btn-secondary" : "btn-primary"}`} onClick={toggleLock}>
            {locked ? "🔒 Unlock Availability" : "🔓 Lock Availability"}
          </button>
        )}
        {weekId && locked && <span className="badge-red">Locked — trainers cannot modify</span>}
      </div>

      {weekId && <Table columns={cols} data={avail} emptyMsg="No availability submitted for this week yet." />}
    </div>
  );
}
