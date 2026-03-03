// FILE: /frontend/src/pages/hod/HodTimetable.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import {
  generateTimetable,
  getTimetables,
  getTimetableByProgram,
  getPrograms,
  publishTimetable,
} from '../../api/hodApi';
import '../../styles/Hod.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HodTimetable() {
  const { data: timetables, loading: ttLoad, refetch: reTT } = useFetch(getTimetables);
  const { data: programs,   loading: pgLoad }                 = useFetch(getPrograms);

  // generate form
  const [label,      setLabel]      = useState('');
  const [genMsg,     setGenMsg]     = useState('');
  const [genErr,     setGenErr]     = useState('');
  const [generating, setGenerating] = useState(false);

  // view selector
  const [selTT,   setSelTT]   = useState('');
  const [selProg, setSelProg] = useState('');
  const [slots,   setSlots]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setGenerating(true); setGenMsg(''); setGenErr('');
    try {
      const res = await generateTimetable({ label });
      setGenMsg(res.data.data.message);
      reTT();
    } catch (err) {
      setGenErr(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleView() {
    if (!selTT || !selProg) return;
    setLoading(true); setSlots(null);
    try {
      const res = await getTimetableByProgram(selTT, selProg);
      setSlots(res.data.data);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  }

  async function handlePublish(id) {
    await publishTimetable(id);
    reTT();
    setGenMsg('Timetable published successfully.');
  }

  // Build ordered day groups for the table
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = (slots || []).filter(s => s.day_of_week === d); });
  const daysWithSlots = DAYS.filter(d => byDay[d].length > 0);

  const currentTT = (timetables || []).find(t => String(t.id) === String(selTT));

  return (
    <div>
      <div className="hod-page-head">
        <div>
          <h1 className="hod-title">Timetable</h1>
          <p className="hod-sub">Generate and view program timetables</p>
        </div>
      </div>

      {/* ── Generate ── */}
      <div className="hod-card">
        <h3 className="hod-card-title">Generate new timetable</h3>
        <div className="hod-row">
          <input
            className="hod-input"
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          <button className="hod-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate timetable'}
          </button>
        </div>
        {genMsg && <p className="hod-ok">{genMsg}</p>}
        {genErr && <p className="hod-err-text">{genErr}</p>}
      </div>

      {/* ── View timetable ── */}
      <div className="hod-card">
        <h3 className="hod-card-title">View timetable by program</h3>
        <div className="hod-row">
          <select
            className="hod-select"
            value={selTT}
            onChange={e => { setSelTT(e.target.value); setSlots(null); }}
            disabled={ttLoad}
          >
            <option value="">-- Select timetable --</option>
            {(timetables || []).map(t => (
              <option key={t.id} value={t.id}>
                {t.label} · {t.status} · {new Date(t.generated_at).toLocaleDateString()}
              </option>
            ))}
          </select>

          <select
            className="hod-select"
            value={selProg}
            onChange={e => { setSelProg(e.target.value); setSlots(null); }}
            disabled={pgLoad}
          >
            <option value="">-- Select program --</option>
            {(programs || []).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            className="hod-btn hod-btn-outline"
            onClick={handleView}
            disabled={!selTT || !selProg || loading}
          >
            {loading ? 'Loading…' : 'View'}
          </button>

          {currentTT?.status === 'draft' && (
            <button className="hod-btn" onClick={() => handlePublish(currentTT.id)}>
              Publish
            </button>
          )}
        </div>

        {/* Timetable result table */}
        {slots !== null && (
          slots.length === 0 ? (
            <p className="hod-msg" style={{ marginTop: '1rem' }}>
              No sessions found for this program in the selected timetable.
            </p>
          ) : (
            <div className="hod-table-wrap">
              <table className="hod-table" style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Trainer</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {daysWithSlots.map(day =>
                    byDay[day].map((s, i) => (
                      <tr key={s.id ?? `${day}-${i}`}>
                        {i === 0 && (
                          <td rowSpan={byDay[day].length} className="hod-day-cell">
                            {day}
                          </td>
                        )}
                        <td style={{ whiteSpace: 'nowrap' }}>{s.time_start} – {s.time_end}</td>
                        <td>{s.course_name}</td>
                        <td>{s.course_code}</td>
                        <td>{s.trainer_name}</td>
                        <td>{s.room_name}{s.room_code ? ` (${s.room_code})` : ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── All timetables list ── */}
      {(timetables || []).length > 0 && (
        <div className="hod-card">
          <h3 className="hod-card-title">All timetables</h3>
          <table className="hod-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Status</th>
                <th>Generated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(timetables || []).map(t => (
                <tr key={t.id}>
                  <td>{t.label}</td>
                  <td>{t.status}</td>
                  <td>{new Date(t.generated_at).toLocaleString()}</td>
                  <td>
                    {t.status === 'draft' && (
                      <button className="hod-btn-sm" onClick={() => handlePublish(t.id)}>
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}