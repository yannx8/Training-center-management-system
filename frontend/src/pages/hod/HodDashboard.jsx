import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getDashboard } from '../../api/hodApi';
import '../../styles/Hod.css';

export default function HodDashboard() {
  const { data, loading, error } = useFetch(getDashboard);
  const [openId, setOpenId] = useState(null);

  if (loading) return <p className="hod-msg">Loading...</p>;
  if (error)   return <p className="hod-msg hod-err">{error}</p>;

  const { department, programs = [] } = data || {};

  return (
    <div>
      <div className="hod-page-head">
        <div>
          <h1 className="hod-title">Dashboard</h1>
          <p className="hod-sub">Department: <strong>{department || '—'}</strong></p>
        </div>
      </div>

      {programs.length === 0 ? (
        <p className="hod-msg">No programs found for your department.</p>
      ) : (
        <div className="hod-card">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Code</th>
                <th>Status</th>
                <th>Courses</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {programs.map(prog => (
                <>
                  <tr key={prog.id}>
                    <td><strong>{prog.name}</strong></td>
                    <td>{prog.code}</td>
                    <td>{prog.status}</td>
                    <td>{prog.courses.length}</td>
                    <td>
                      <button
                        className="hod-btn-sm"
                        onClick={() => setOpenId(openId === prog.id ? null : prog.id)}
                      >
                        {openId === prog.id ? 'Hide' : 'View courses'}
                      </button>
                    </td>
                  </tr>
                  {openId === prog.id && (
                    <tr key={`${prog.id}-courses`}>
                      <td colSpan={5} className="hod-expand-cell">
                        {prog.courses.length === 0 ? (
                          <p className="hod-msg" style={{ margin: '0.5rem 0' }}>No courses in this program.</p>
                        ) : (
                          <table className="hod-table hod-inner">
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Code</th>
                                <th>Credits</th>
                                <th>Hrs/week</th>
                                <th>Trainer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prog.courses.map((c, i) => (
                                <tr key={c.id ?? i}>
                                  <td>{c.name}</td>
                                  <td>{c.code}</td>
                                  <td>{c.credits ?? '—'}</td>
                                  <td>{c.hours_per_week ?? '—'}</td>
                                  <td>{c.trainer_name || <span className="hod-dim">Unassigned</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}