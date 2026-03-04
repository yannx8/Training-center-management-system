import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: '⊞' },
  { to: '/admin/users', label: 'User Management', icon: '👤' },
  { to: '/admin/departments', label: 'Departments', icon: '🏢' },
  { to: '/admin/programs', label: 'Programs', icon: '📚' },
  { to: '/admin/academic-years', label: 'Academic Years', icon: '🗓' },
  { to: '/admin/rooms', label: 'Rooms', icon: '🚪' },
  { to: '/admin/complaints', label: 'Complaints', icon: '💬' },
];

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar title="Administrator panel" items={adminNav} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}