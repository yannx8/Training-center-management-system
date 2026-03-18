import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { LayoutDashboard, CalendarDays, ClipboardList, Table2, Megaphone } from 'lucide-react';

const NAV = [
  { to: '/hod',              label: 'Dashboard',       icon: <LayoutDashboard size={18} /> },
  { to: '/hod/weeks',        label: 'Academic Weeks',  icon: <CalendarDays size={18} /> },
  { to: '/hod/availability', label: 'Availability',    icon: <ClipboardList size={18} /> },
  { to: '/hod/timetables',   label: 'Timetables',      icon: <Table2 size={18} /> },
  { to: '/hod/announcements',label: 'Announcements',   icon: <Megaphone size={18} /> },
];

export default function HodLayout() {
  return (
    <div className="flex h-full">
      <Sidebar navItems={NAV} roleLabel="Head of Department" roleColor="bg-teal-600" />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div>
      </main>
    </div>
  );
}
