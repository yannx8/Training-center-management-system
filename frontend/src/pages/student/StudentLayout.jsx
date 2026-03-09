// frontend/src/pages/student/StudentLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const NAV = [
    { to: '/student',                   label: 'Dashboard',          icon: 'dashboard',    end: true  },
    { to: '/student/timetable',         label: 'Timetable',          icon: 'timetable',    end: false },
    { to: '/student/cert-timetable',    label: 'Cert Sessions',      icon: 'history',      end: false },
    { to: '/student/cert-availability', label: 'Cert Availability',  icon: 'availability', end: false },
    { to: '/student/grades',            label: 'Grades',             icon: 'grades',       end: false },
    { to: '/student/complaints',        label: 'Complaints',         icon: 'complaint',    end: false },
    { to: '/student/announcements',     label: 'Announcements',      icon: 'announcement', end: false },
];

export default function StudentLayout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
            <Sidebar title="TCMS — Student" items={NAV} />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}