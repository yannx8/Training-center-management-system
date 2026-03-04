import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { getDashboard } from '../../api/adminApi';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import '../../styles/Dashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch(getDashboard);

  if (loading) return <div className="page-loading">Loading...</div>;

  const stats = data?.stats || {};
  const deptOverview = data?.departmentOverview || [];
  const pendingComplaints = data?.pendingComplaints || [];


  return (
    <div>
      <div className="page-topbar">
        <div className="topbar-user">
          <div className="topbar-avatar">{user?.fullName?.slice(0,2).toUpperCase()}</div>
          <div>
            <div className="topbar-name">{user?.fullName}</div>
            <div className="topbar-role">Administrator</div>
          </div>
        </div>
      </div>

      <h1 className="page-title">Dashboard Overview</h1>
      <p className="page-subtitle">Welcome back! Here's what's happening with your academic system.</p>

      <div className="stats-grid">
        <StatCard title="Total Users" value={stats.total_users} icon="👥" />
        <StatCard title="Departments" value={stats.total_departments} icon="🏢" />
        <StatCard title="Active Programs" value={stats.active_programs} icon="📚" />
        <StatCard title="Available Rooms" value={stats.available_rooms} icon="🚪"  />
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3 className="dash-card-title">⚠ Pending Complaints</h3>
          {pendingComplaints.length === 0
            ? <p className="empty-text">No pending complaints</p>
            : pendingComplaints.map(c => (
              <div key={c.id} className="complaint-item">
                <div>
                  <strong>{c.subject}</strong>
                  <div className="complaint-meta">Parent: {c.parent_name} | Student: {c.student_name}</div>
                </div>
                <Badge label={c.priority} type="status" />
              </div>
            ))
          }
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        <div className="dash-card">
          <h3 className="dash-card-title">Department Overview</h3>
          {deptOverview.length === 0
            ? <p className="empty-text">No departments</p>
            : deptOverview.map(d => (
              <div key={d.code} className="dept-row">
                <div>
                  <div className="dept-name">{d.name}</div>
                  <div className="dept-code">{d.code}</div>
                </div>
                <div className="dept-count">
                  <span>{d.student_count}</span>
                  <span className="dept-label">students</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}