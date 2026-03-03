// FILE: /frontend/src/pages/student/StudentLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../styles/Student.css';

const studentNav = [
    { to: '/student', label: 'Dashboard', icon: '⊞' },
    { to: '/student/timetable', label: 'My Timetable', icon: '📅' },
    { to: '/student/grades', label: 'My Grades', icon: '📊' },
    { to: '/student/complaints', label: 'Grade Appeals', icon: '💬' },
];

export default function StudentLayout() {
    return (
        <div className="student-shell">
            <aside className="student-sidebar">
                <div className="student-brand">Student Portal</div>
                <nav className="student-nav">
                    {studentNav.map(item => (
                        <a
                            key={item.to}
                            href={item.to}
                            className={`student-link${window.location.pathname === item.to ? ' student-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>
                <div className="student-footer">
                    <div className="student-footer-name">Student</div>
                    <div className="student-footer-role">STUDENT</div>
                    <button className="student-footer-logout">Logout</button>
                </div>
            </aside>
            <main className="student-main">
                <Outlet />
            </main>
        </div>
    );
}