// FILE: /frontend/src/pages/trainer/TrainerCertifications.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getCertifications, getCertificationStudents, submitGrades } from '../../api/trainerApi';
import '../../styles/Page.css';

function gradeToLetter(n) {
  if (n >= 90) return 'A+'; if (n >= 80) return 'A'; if (n >= 70) return 'B';
  if (n >= 60) return 'C'; if (n >= 50) return 'D'; return 'F';
}

export default function TrainerCertifications() {
  const { data: certs, loading } = useFetch(getCertifications);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradeInputs, setGradeInputs] = useState({});
  const [message, setMessage] = useState('');

  async function selectCert(cert) {
    setSelected(cert);
    const res = await getCertificationStudents(cert.id);
    const studs = res.data.data;
    setStudents(studs);
    const inputs = {};
    studs.forEach(s => { inputs[s.student_id] = s.grade || ''; });
    setGradeInputs(inputs);
  }

  async function handleSave() {
    try {
      const grades = Object.entries(gradeInputs).map(([studentId, grade]) => ({ studentId: parseInt(studentId), grade: parseFloat(grade) })).filter(g => !isNaN(g.grade));
      await submitGrades({ grades, type: 'certification', subjectId: selected.id });
      setMessage('Grades saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Failed to save'); }
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Certifications</h1>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="table-card" style={{ flex: 1 }}>
          {!certs?.length ? <div className="empty-state"><div className="empty-icon">🏆</div><h3>No certifications assigned</h3></div>
            : certs.map(c => (
              <div key={c.id} className={`course-item${selected?.id === c.id ? ' selected' : ''}`} onClick={() => selectCert(c)}>
                <strong>{c.name}</strong>
                <div className="course-meta">{c.code} — {c.duration_hours}h</div>
              </div>
            ))
          }
        </div>
        {selected && (
          <div className="table-card" style={{ flex: 2 }}>
            <div className="page-header"><h3>{selected.name}</h3>{message && <span style={{ color: 'green' }}>{message}</span>}</div>
            {students.length === 0
              ? <div className="empty-state"><div className="empty-icon">👤</div><h3>No students enrolled</h3></div>
              : (
                <>
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Matricule</th><th>Grade</th><th>Letter</th></tr></thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.student_id}>
                          <td>{s.full_name}</td><td>{s.matricule}</td>
                          <td><input type="number" min="0" max="100" value={gradeInputs[s.student_id] || ''} onChange={e => setGradeInputs({...gradeInputs, [s.student_id]: e.target.value})} style={{ width: 80 }} /></td>
                          <td>{gradeInputs[s.student_id] ? gradeToLetter(parseFloat(gradeInputs[s.student_id])) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '1rem' }}><button className="btn-primary" onClick={handleSave}>Save Grades</button></div>
                </>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}