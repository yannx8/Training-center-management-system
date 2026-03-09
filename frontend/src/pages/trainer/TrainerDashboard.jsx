// frontend/src/pages/trainer/TrainerDashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';
import '../../styles/Dashboard.css';

const CARDS = [
    { to: '/trainer/courses',        icon: 'courses',       title: 'Academic Courses',      desc: 'Manage course assignments and enter student grades' },
    { to: '/trainer/certifications', icon: 'certification', title: 'Certifications',         desc: 'View enrolled students and submit certification grades' },
    { to: '/trainer/cert-weeks',     icon: 'weeks',         title: 'Certification Scheduling', desc: 'Create weeks, publish for student availability, generate timetable' },
    { to: '/trainer/timetable',      icon: 'timetable',     title: 'My Timetable',           desc: 'View your complete schedule (academic + certification)' },
    { to: '/trainer/availability',   icon: 'availability',  title: 'Availability',           desc: 'Submit your available time slots for HOD-published weeks' },
    { to: '/trainer/complaints',     icon: 'complaint',     title: 'Grade Complaints',       desc: 'Review and respond to student mark complaints' },
];

export default function TrainerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div>
            <h1 className="page-title">Welcome, {user?.fullName}</h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem' }}>Trainer Dashboard</p>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {CARDS.map(c => (
                    <div
                        key={c.to}
                        className="stat-card"
                        onClick={() => navigate(c.to)}
                        style={{ cursor: 'pointer', padding: '1.25rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, background: '#e0e7ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name={c.icon} size={18} color="#3b5be8" />
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