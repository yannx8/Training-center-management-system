// frontend/src/pages/hod/HodLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const NAV = [
    { to: '/hod',               label: 'Dashboard',     icon: 'dashboard',    end: true  },
    { to: '/hod/availability',  label: 'Trainer Grid',  icon: 'availability', end: false },
    { to: '/hod/timetable',     label: 'Timetable',     icon: 'timetable',    end: false },
    { to: '/hod/announcements', label: 'Announcements', icon: 'announcement', end: false },
];

export default function HodLayout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar title="TCMS — HOD" items={NAV} />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}