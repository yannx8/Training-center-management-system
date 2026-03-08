// FILE: /frontend/src/pages/trainer/TrainerLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Trainer.css';

const NAV = [
    { to: '/trainer',               label: '⊞ Dashboard',        end: true },
    { to: '/trainer/courses',        label: '📚 My Courses',       end: false },
    { to: '/trainer/certifications', label: '🏆 Certifications',  end: false },
    { to: '/trainer/cert-scheduling',  label: '📋 Cert Scheduling', end: false },
    { to: '/trainer/timetable',      label: '📅 My Timetable',    end: false },
    { to: '/trainer/availability',   label: '🕐 Availability',    end: false },
    { to: '/trainer/complaints',     label: '💬 Mark Complaints', end: false },
    { to: '/trainer/announcements',  label: '📢 Announcements',   end: false },
];

export default function TrainerLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div className="trainer-shell">
            <aside className="trainer-sidebar">
                <div className="trainer-brand">VTC Manager</div>
                <nav className="trainer-nav">
                    {NAV.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `trainer-link${isActive ? ' trainer-link-active' : ''}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="trainer-footer">
                    <div className="trainer-footer-name">{user?.fullName || 'Trainer'}</div>
                    <div className="trainer-footer-role">TRAINER</div>
                    <button className="trainer-footer-logout" onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            <main className="trainer-main">
                <Outlet />
            </main>
        </div>
    );
}
