// FILE: /frontend/src/pages/student/StudentLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const studentNav = [
  { to: '/student', label: 'Dashboard', icon: '⊞' },
  { to: '/student/timetable', label: 'My Timetable', icon: '📅' },
  { to: '/student/grades', label: 'My Grades', icon: '📊' },
  { to: '/student/complaints', label: 'Grade Appeals', icon: '💬' },
];

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar title="Student Portal" items={studentNav} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
}