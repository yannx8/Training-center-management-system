// FILE: /frontend/src/pages/trainer/TrainerLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Trainer.css';

const NAV = [
    { to: '/trainer',              label: 'Dashboard',         end: true },
    { to: '/trainer/courses',      label: 'Academic Programs',  end: false },
    { to: '/trainer/certifications', label: 'Certifications',  end: false },
    { to: '/trainer/timetable',    label: 'My Timetable',      end: false },
    { to: '/trainer/availability', label: 'Availability',       end: false },
    { to: '/trainer/complaints',   label: 'Mark Complaints',    end: false },
];

export default function TrainerLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="trainer-shell">
            <aside className="trainer-sidebar">
                <div className="trainer-brand">TRainer Dashboard</div>
                <nav className="trainer-nav">
                    {NAV.map(n => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) => `trainer-link${isActive ? ' trainer-link-active' : ''}`}
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="trainer-footer">
                    <div className="trainer-footer-name">{user?.fullName}</div>
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