// FILE: /frontend/src/pages/hod/HodLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const hodNav = [
  { to: '/hod', label: 'Dashboard', icon: '⊞' },
  { to: '/hod/timetable', label: 'Timetable', icon: '📅' },
  { to: '/hod/availability', label: 'Trainer Availability', icon: '🕐' },
];

export default function HodLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar title="HOD Portal" items={hodNav} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
}