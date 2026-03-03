// FILE: /frontend/src/pages/student/StudentGrades.jsx
import { useFetch } from '../../hooks/useFetch';
import { getGrades } from '../../api/studentApi';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function StudentGrades() {
  const { data, loading } = useFetch(getGrades);

  return (
    <div>
      <h1 className="page-title">My Grades</h1>
      {loading ? <div className="page-loading">Loading...</div> : !data?.length
        ? <div className="empty-state"><div className="empty-icon">📊</div><h3>No grades yet</h3></div>
        : (
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Course / Certification</th><th>Trainer</th><th>Grade</th><th>Letter</th><th>Academic Year</th></tr></thead>
              <tbody>
                {data.map(g => (
                  <tr key={g.id}>
                    <td>{g.course_name || g.certification_name}</td>
                    <td>{g.trainer_name}</td>
                    <td>{g.grade}</td>
                    <td><Badge label={g.grade_letter || '—'} /></td>
                    <td>{g.academic_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}