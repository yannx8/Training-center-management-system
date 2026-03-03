// FILE: /frontend/src/pages/trainer/TrainerLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../styles/Trainer.css';

const trainerNav = [
    { to: '/trainer', label: 'Dashboard', icon: '⊞' },
    { to: '/trainer/courses', label: 'Academic Programs', icon: '📚' },
    { to: '/trainer/certifications', label: 'Certifications', icon: '🏆' },
    { to: '/trainer/timetable', label: 'My Timetable', icon: '📅' },
    { to: '/trainer/availability', label: 'Availability', icon: '🕐' },
    { to: '/trainer/complaints', label: 'Mark Complaints', icon: '💬' },
];

export default function TrainerLayout() {
    return (
        <div className="trainer-shell">
            <aside className="trainer-sidebar">
                <div className="trainer-brand">VTC Manager</div>
                <nav className="trainer-nav">
                    {trainerNav.map(item => (
                        <a
                            key={item.to}
                            href={item.to}
                            className={`trainer-link${window.location.pathname === item.to ? ' trainer-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>
                <div className="trainer-footer">
                    <div className="trainer-footer-name">Trainer</div>
                    <div className="trainer-footer-role">TRAINER</div>
                    <button className="trainer-footer-logout">Logout</button>
                </div>
            </aside>
            <main className="trainer-main">
                <Outlet />
            </main>
        </div>
    );
}