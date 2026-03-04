import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="page-title">Welcome, {user?.fullName}</h1>
      <p className="page-subtitle">Trainer Dashboard</p>
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/trainer/courses')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-title">Academic Programs</div>
          <div className="stat-card-value">📚</div>
          <div style={{ color: '#666', marginTop: '0.5rem' }}>View your academic course assignments</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/trainer/certifications')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-title">Certifications</div>
          <div className="stat-card-value">🏆</div>
          <div style={{ color: '#666', marginTop: '0.5rem' }}>View your certification assignments</div>
        </div>
      </div>
    </div>
  );
}