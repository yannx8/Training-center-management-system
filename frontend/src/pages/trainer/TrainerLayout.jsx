// frontend/src/pages/trainer/TrainerLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const NAV = [
    { to: '/trainer',               label: 'Dashboard',       icon: 'dashboard',     end: true  },
    { to: '/trainer/courses',       label: 'Courses',         icon: 'courses',       end: false },
    { to: '/trainer/certifications',label: 'Certifications',  icon: 'certification', end: false },
    { to: '/trainer/cert-weeks',    label: 'Cert Scheduling', icon: 'weeks',         end: false },
    { to: '/trainer/timetable',     label: 'Timetable',       icon: 'timetable',     end: false },
    { to: '/trainer/availability',  label: 'Availability',    icon: 'availability',  end: false },
    { to: '/trainer/complaints',    label: 'Complaints',      icon: 'complaint',     end: false },
    { to: '/trainer/announcements', label: 'Announcements',   icon: 'announcement',  end: false },
];

export default function TrainerLayout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar title="TCMS — Trainer" items={NAV} />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}