// FILE: /frontend/src/pages/parent/ParentLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const parentNav = [
  { to: '/parent', label: 'My Children', icon: '👨‍👩‍👧' },
  { to: '/parent/complaints', label: 'Submit Complaint', icon: '💬' },
];

export default function ParentLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <Sidebar title="Parent Portal" items={parentNav} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
}