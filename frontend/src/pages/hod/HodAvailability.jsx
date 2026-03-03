// FILE: /frontend/src/pages/hod/HodAvailability.jsx
import { useFetch } from '../../hooks/useFetch';
import { getAvailability, getLockStatus, lockAvailability, unlockAvailability } from '../../api/hodApi';
import '../../styles/Hod.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HodAvailability() {
  const { data: slots,    loading, error }        = useFetch(getAvailability);
  const { data: lockData, refetch: refetchLock }  = useFetch(getLockStatus);

  async function toggleLock() {
    if (lockData?.isLocked) await unlockAvailability();
    else                    await lockAvailability();
    refetchLock();
  }

  const list = slots || [];
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = list.filter(s => s.day_of_week === d); });
  const trainerCount = [...new Set(list.map(s => s.trainer_id))].length;

  return (
    <div>
      <div className="hod-page-head">
        <div>
          <h1 className="hod-title">Trainer Availability</h1>
          <p className="hod-sub">
            {loading ? '…' : `${trainerCount} trainer(s) · ${list.length} slot(s)`}
          </p>
        </div>
        <button
          className={lockData?.isLocked ? 'hod-btn hod-btn-danger' : 'hod-btn'}
          onClick={toggleLock}
        >
          {lockData?.isLocked ? 'Unlock submissions' : 'Lock submissions'}
        </button>
      </div>

      {lockData?.isLocked && (
        <div className="hod-notice">
          Submissions are locked — trainers cannot add or remove slots.
        </div>
      )}

      {loading ? (
        <p className="hod-msg">Loading...</p>
      ) : error ? (
        <p className="hod-msg hod-err">{error}</p>
      ) : list.length === 0 ? (
        <p className="hod-msg">No availability submitted yet by trainers in your department.</p>
      ) : (
        <div className="hod-avail-grid">
          {DAYS.map(day => (
            <div key={day} className="hod-avail-col">
              <div className="hod-avail-header">{day}</div>
              {byDay[day].length === 0 ? (
                <div className="hod-avail-none">—</div>
              ) : (
                byDay[day].map(s => (
                  <div key={s.id} className="hod-avail-slot">
                    <span className="hod-avail-trainer">{s.trainer_name}</span>
                    <span className="hod-avail-time">{s.time_start} – {s.time_end}</span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}