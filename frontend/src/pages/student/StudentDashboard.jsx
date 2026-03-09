// frontend/src/pages/student/StudentDashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';
import '../../styles/Dashboard.css';

const CARDS = [
    { to: '/student/timetable',         icon: 'timetable',    title: 'Academic Timetable',       desc: 'View your academic program class schedule' },
    { to: '/student/cert-timetable',    icon: 'history',      title: 'Certification Sessions',   desc: 'All scheduled certification sessions from first to last' },
    { to: '/student/cert-availability', icon: 'availability', title: 'Certification Availability', desc: 'Submit your available time slots for certification scheduling' },
    { to: '/student/grades',            icon: 'grades',       title: 'Grades & Progress',        desc: 'View your course grades and academic performance' },
    { to: '/student/complaints',        icon: 'complaint',    title: 'Grade Complaints',         desc: 'Submit and track mark complaints to your trainer' },
    { to: '/student/announcements',     icon: 'announcement', title: 'Announcements',            desc: 'Read department and institution announcements' },
];

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div>
            <h1 className="page-title">Welcome, {user?.fullName}</h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Student Portal</p>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {CARDS.map(c => (
                    <div
                        key={c.to}
                        className="stat-card"
                        onClick={() => navigate(c.to)}
                        style={{ cursor: 'pointer', padding: '1.25rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, background: '#dbeafe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name={c.icon} size={18} color="#1d4ed8" />
                            </div>
                            <div className="stat-card-title" style={{ margin: 0, fontSize: '0.9rem' }}>{c.title}</div>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{c.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}