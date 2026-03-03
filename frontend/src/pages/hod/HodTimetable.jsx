// FILE: /frontend/src/pages/hod/HodTimetable.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getTimetable, generateTimetable, publishTimetable } from '../../api/hodApi';
import '../../styles/Page.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function HodTimetable() {
  const { data, loading, refetch } = useFetch(getTimetable);
  const [view, setView] = useState('academic'); // 'academic' | 'certification'
  const [genForm, setGenForm] = useState({ weekStart: '', academicYearId: '' });
  const [genMsg, setGenMsg] = useState('');
  const [generating, setGenerating] = useState(false);

  const slots = view === 'academic' ? (data?.academic || []) : (data?.certification || []);
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = slots.filter(s => s.day_of_week === d); });

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await generateTimetable(genForm);
      setGenMsg(res.data.data.message);
      refetch();
    } catch (err) { setGenMsg(err.response?.data?.message || 'Generation failed'); }
    finally { setGenerating(false); }
  }

  async function handlePublish() {
    if (!data?.timetable) return;
    await publishTimetable(data.timetable.id);
    refetch();
    setGenMsg('Timetable published!');
  }

  return (
    <div>
      <h1 className="page-title">Timetable Management</h1>
      <div className="table-card" style={{ marginBottom: '1.5rem' }}>
        <h3>Generate New Timetable</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-field"><label>Week Start Date *</label><input type="date" value={genForm.weekStart} onChange={e => setGenForm({...genForm, weekStart: e.target.value})} /></div>
          <div className="form-field"><label>Academic Year ID *</label><input type="number" value={genForm.academicYearId} onChange={e => setGenForm({...genForm, academicYearId: e.target.value})} placeholder="e.g. 1" /></div>
          <button type="submit" className="btn-primary" disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
          {data?.timetable && data.timetable.status === 'draft' && (
            <button type="button" className="btn-confirm" onClick={handlePublish}>Publish</button>
          )}
        </form>
        {genMsg && <div style={{ marginTop: '0.5rem', color: 'green' }}>{genMsg}</div>}
      </div>

      <div className="tabs">
        <button className={`tab${view === 'academic' ? ' active' : ''}`} onClick={() => setView('academic')}>Academic Programs</button>
        <button className={`tab${view === 'certification' ? ' active' : ''}`} onClick={() => setView('certification')}>Certifications</button>
      </div>

      {loading ? <div className="page-loading">Loading...</div> : slots.length === 0
        ? <div className="empty-state"><div className="empty-icon">📅</div><h3>No timetable generated yet</h3></div>
        : (
          <div className="timetable-grid">
            {DAYS.map(day => (
              <div key={day} className="timetable-day">
                <div className="timetable-day-header">{day}</div>
                {byDay[day].length === 0
                  ? <div className="timetable-empty">Free</div>
                  : byDay[day].map(s => (
                    <div key={s.id} className="timetable-slot">
                      <div className="slot-time">{s.time_start} - {s.time_end}</div>
                      <div className="slot-subject">{s.course_name || s.certification_name}</div>
                      <div className="slot-room">{s.room_name} — {s.trainer_name}</div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}