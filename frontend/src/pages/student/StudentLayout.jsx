import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Student.css';

const NAV = [
    { to: '/student',            label: 'Dashboard',    end: true  },
    { to: '/student/timetable',  label: 'My Timetable', end: false },
    { to: '/student/grades',     label: 'My Grades',    end: false },
    { to: '/student/complaints', label: 'Grade Appeals', end: false },
];

export default function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="student-shell">
            <aside className="student-sidebar">
                <div className="student-brand">Student Panel</div>
                <nav className="student-nav">
                    {NAV.map(n => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) => `student-link${isActive ? ' student-link-active' : ''}`}
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="student-footer">
                    <div className="student-footer-name">{user?.fullName}</div>
                    <div className="student-footer-role">STUDENT</div>
                    <button className="student-footer-logout" onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            <main className="student-main">
                <Outlet />
            </main>
        </div>
    );
}