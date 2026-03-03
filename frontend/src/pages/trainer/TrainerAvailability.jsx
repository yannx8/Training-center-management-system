// FILE: /frontend/src/pages/trainer/TrainerAvailability.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getAvailability, submitAvailability, deleteAvailability } from '../../api/trainerApi';
import '../../styles/Page.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TrainerAvailability() {
  const { data, loading, refetch } = useFetch(getAvailability);
  const [form, setForm] = useState({ dayOfWeek: 'Monday', timeStart: '08:00', timeEnd: '10:00' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await submitAvailability(form);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  }

  async function handleDelete(id) {
    await deleteAvailability(id);
    refetch();
  }

  return (
    <div>
      <h1 className="page-title">My Availability</h1>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="table-card" style={{ maxWidth: 360 }}>
          <h3>Add Availability Slot</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-field"><label>Day</label>
              <select value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: e.target.value})}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Start Time</label><input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} /></div>
            <div className="form-field"><label>End Time</label><input type="time" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} /></div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn-primary">Add Slot</button>
          </form>
        </div>
        <div className="table-card" style={{ flex: 1 }}>
          <h3>My Submitted Slots</h3>
          {loading ? <div>Loading...</div> : !data?.length
            ? <div className="empty-state"><div className="empty-icon">🕐</div><h3>No availability submitted</h3></div>
            : (
              <table className="data-table">
                <thead><tr><th>Day</th><th>From</th><th>To</th><th></th></tr></thead>
                <tbody>
                  {data.map(slot => (
                    <tr key={slot.id}>
                      <td>{slot.day_of_week}</td>
                      <td>{slot.time_start}</td>
                      <td>{slot.time_end}</td>
                      <td><button className="btn-icon btn-icon-danger" onClick={() => handleDelete(slot.id)}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  );
}