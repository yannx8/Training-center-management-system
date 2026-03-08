// FILE: /frontend/src/pages/student/StudentLayout.jsx
// Note: cert-availability tab is conditionally shown — we show it always and
// let the page itself display a message if the student has no cert enrollments.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Student.css';

const NAV = [
    { to: '/student',                      label: '⊞ Dashboard',               end: true },
    { to: '/student/timetable',             label: '📅 My Timetable',            end: false },
    { to: '/student/cert-timetable',        label: '🏆 Cert Timetable',         end: false },
    { to: '/student/cert-availability',     label: '🕐 Cert Availability',      end: false },
    { to: '/student/grades',                label: '📊 My Grades',              end: false },
    { to: '/student/complaints',            label: '💬 Grade Appeals',           end: false },
    { to: '/student/announcements',         label: '📢 Announcements',          end: false },
];

export default function StudentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div className="student-shell">
            <aside className="student-sidebar">
                <div className="student-brand">Student Portal</div>
                <nav className="student-nav">
                    {NAV.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `student-link${isActive ? ' student-link-active' : ''}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="student-footer">
                    <div className="student-footer-name">{user?.fullName || 'Student'}</div>
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
