// FILE: /frontend/src/pages/trainer/TrainerCourses.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getCourses, getCourseStudents, submitGrades } from '../../api/trainerApi';
import { gradeToLetter } from '../../helpers/gpa';
import '../../styles/Page.css';

export default function TrainerCourses() {
  const { data: courses, loading } = useFetch(getCourses);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradeInputs, setGradeInputs] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function selectCourse(course) {
    setSelectedCourse(course);
    const res = await getCourseStudents(course.id);
    const studs = res.data.data;
    setStudents(studs);
    const inputs = {};
    studs.forEach(s => { inputs[s.student_id] = s.grade || ''; });
    setGradeInputs(inputs);
  }

  async function handleSaveGrades() {
    setSaving(true);
    try {
      const grades = Object.entries(gradeInputs).map(([studentId, grade]) => ({ studentId: parseInt(studentId), grade: parseFloat(grade) })).filter(g => !isNaN(g.grade));
      await submitGrades({ grades, type: 'course', subjectId: selectedCourse.id });
      setMessage('Grades saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Failed to save grades'); } finally { setSaving(false); }
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Academic Program Courses</h1>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="table-card" style={{ flex: 1 }}>
          {!courses?.length ? <div className="empty-state"><div className="empty-icon">📚</div><h3>No courses assigned</h3></div>
            : courses.map(c => (
              <div key={c.id} className={`course-item${selectedCourse?.id === c.id ? ' selected' : ''}`} onClick={() => selectCourse(c)}>
                <strong>{c.name}</strong>
                <div className="course-meta">{c.program_name} — {c.level_name}</div>
              </div>
            ))
          }
        </div>
        {selectedCourse && (
          <div className="table-card" style={{ flex: 2 }}>
            <div className="page-header">
              <h3>{selectedCourse.name}</h3>
              {message && <span style={{ color: 'green' }}>{message}</span>}
            </div>
            {students.length === 0
              ? <div className="empty-state"><div className="empty-icon">👤</div><h3>No students enrolled</h3></div>
              : (
                <>
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Matricule</th><th>Grade (/100)</th><th>Letter</th></tr></thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.student_id}>
                          <td>{s.full_name}</td>
                          <td>{s.matricule}</td>
                          <td><input type="number" min="0" max="100" value={gradeInputs[s.student_id] || ''} onChange={e => setGradeInputs({...gradeInputs, [s.student_id]: e.target.value})} style={{ width: 80 }} /></td>
                          <td>{gradeInputs[s.student_id] ? gradeToLetter(parseFloat(gradeInputs[s.student_id])) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn-primary" onClick={handleSaveGrades} disabled={saving}>{saving ? 'Saving...' : 'Save Grades'}</button>
                  </div>
                </>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}