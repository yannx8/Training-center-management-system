// FILE: /frontend/src/pages/student/StudentDashboard.jsx
import { useFetch } from '../../hooks/useFetch';
import { getProfile } from '../../api/studentApi';
import '../../styles/Dashboard.css';

export default function StudentDashboard() {
  const { data: profile, loading } = useFetch(getProfile);
  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Student Profile</h1>
      {!profile ? <div className="empty-state"><div className="empty-icon">👤</div><h3>Profile not found</h3></div> : (
        <div className="table-card" style={{ maxWidth: 500 }}>
          <div className="profile-row"><span className="profile-label">Full Name</span><span>{profile.full_name}</span></div>
          <div className="profile-row"><span className="profile-label">Matricule</span><span>{profile.matricule}</span></div>
          <div className="profile-row"><span className="profile-label">Program</span><span>{profile.program_name}</span></div>
          <div className="profile-row"><span className="profile-label">Email</span><span>{profile.email}</span></div>
          <div className="profile-row"><span className="profile-label">Phone</span><span>{profile.phone}</span></div>
          <div className="profile-row"><span className="profile-label">Date of Birth</span><span>{profile.date_of_birth?.split('T')[0]}</span></div>
        </div>
      )}
    </div>
  );
}