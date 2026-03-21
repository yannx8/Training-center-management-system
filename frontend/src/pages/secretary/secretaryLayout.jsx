import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { LayoutDashboard, Users, UserPlus } from 'lucide-react';

const NAV = [
  { to: '/secretary',          label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
  { to: '/secretary/students', label: 'Students',  icon: <Users size={18}/> },
  { to: '/secretary/register', label: 'Register',  icon: <UserPlus size={18}/> },
];

export default function SecretaryLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={NAV} roleLabel="Secretary" roleColor="bg-cyan-600" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar roleLabel="Secretary" roleColor="bg-cyan-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
