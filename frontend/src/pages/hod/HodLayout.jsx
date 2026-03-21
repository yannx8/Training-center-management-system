import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { LayoutDashboard, CalendarRange, Users, Table2, Megaphone } from 'lucide-react';

const NAV = [
  { to: '/hod',               label: 'Dashboard',    icon: <LayoutDashboard size={18}/> },
  { to: '/hod/weeks',         label: 'Weeks',        icon: <CalendarRange size={18}/> },
  { to: '/hod/availability',  label: 'Availability', icon: <Users size={18}/> },
  { to: '/hod/timetables',    label: 'Timetables',   icon: <Table2 size={18}/> },
  { to: '/hod/announcements', label: 'Announcements',icon: <Megaphone size={18}/> },
];

export default function HodLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={NAV} roleLabel="Head of Department" roleColor="bg-teal-600" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar roleLabel="Head of Department" roleColor="bg-teal-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
