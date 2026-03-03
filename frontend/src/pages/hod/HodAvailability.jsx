// FILE: /frontend/src/pages/hod/HodAvailability.jsx
import { useFetch } from '../../hooks/useFetch';
import { getAvailability, getLockStatus, lockAvailability, unlockAvailability } from '../../api/hodApi';
import '../../styles/Page.css';

export default function HodAvailability() {
  const { data: availability, loading, refetch } = useFetch(getAvailability);
  const { data: lockData, refetch: refetchLock } = useFetch(getLockStatus);

  async function toggleLock() {
    if (lockData?.isLocked) await unlockAvailability();
    else await lockAvailability();
    refetchLock();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Trainer Availability</h1><p className="page-subtitle">View all trainer availability submissions</p></div>
        <button className={lockData?.isLocked ? 'btn-confirm' : 'btn-cancel'} onClick={toggleLock}>
          {lockData?.isLocked ? '🔓 Unlock Submissions' : '🔒 Lock Submissions'}
        </button>
      </div>
      {lockData?.isLocked && <div style={{ padding: '12px', background: '#fef3c7', borderRadius: 8, marginBottom: '1rem', color: '#92400e' }}>Availability submissions are currently locked</div>}
      {loading ? <div className="page-loading">Loading...</div> : !availability?.length
        ? <div className="empty-state"><div className="empty-icon">🕐</div><h3>No availability submitted</h3></div>
        : (
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Trainer</th><th>Day</th><th>From</th><th>To</th></tr></thead>
              <tbody>
                {availability.map(a => (
                  <tr key={a.id}><td>{a.trainer_name}</td><td>{a.day_of_week}</td><td>{a.time_start}</td><td>{a.time_end}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}