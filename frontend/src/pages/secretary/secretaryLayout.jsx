// FILE: /frontend/src/pages/secretary/secretaryLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Secretary.css';

const NAV = [
    { to: '/secretary', label: 'Student Management', end: true },
];

export default function SecretaryLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="secretary-shell">
            <aside className="secretary-sidebar">
                <div className="secretary-brand">VTC Manager</div>
                <nav className="secretary-nav">
                    {NAV.map(n => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) => `secretary-link${isActive ? ' secretary-link-active' : ''}`}
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="secretary-footer">
                    <div className="secretary-footer-name">{user?.fullName}</div>
                    <div className="secretary-footer-role">SECRETARY</div>
                    <button className="secretary-footer-logout" onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            <main className="secretary-main">
                <Outlet />
            </main>
        </div>
    );
}