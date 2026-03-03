// FILE: /frontend/src/pages/trainer/TrainerLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const trainerNav = [
  { to: '/trainer', label: 'Dashboard', icon: '⊞' },
  { to: '/trainer/courses', label: 'Academic Programs', icon: '📚' },
  { to: '/trainer/certifications', label: 'Certifications', icon: '🏆' },
  { to: '/trainer/timetable', label: 'My Timetable', icon: '📅' },
  { to: '/trainer/availability', label: 'Availability', icon: '🕐' },
  { to: '/trainer/complaints', label: 'Mark Complaints', icon: '💬' },
];

export default function TrainerLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar title="Trainer Portal" items={trainerNav} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
}