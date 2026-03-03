// FILE: /frontend/src/pages/hod/HodDashboard.jsx
import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';

export default function HodDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="page-title">HOD Dashboard</h1>
      <p className="page-subtitle">Welcome, {user?.fullName}</p>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-title">Department</div><div className="stat-card-value">📚</div><div style={{ color: '#666' }}>Use the sidebar to manage timetable and availability</div></div>
      </div>
    </div>
  );
}