import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/Topbar';
import { LayoutDashboard, Users, CalendarDays, BarChart2, MessageSquare, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ParentLayout() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/parent',               label: 'Dashboard',     icon: <LayoutDashboard size={18}/> },
    { to: '/parent/children',      label: 'My Children',   icon: <Users size={18}/> },
    { to: '/parent/timetable',     label: 'Timetable',     icon: <CalendarDays size={18}/> },
    { to: '/parent/grades',        label: 'Grades',        icon: <BarChart2 size={18}/> },
    { to: '/parent/complaints',    label: 'Complaints',    icon: <MessageSquare size={18}/> },
    { to: '/parent/announcements', label: 'Announcements', icon: <Megaphone size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={NAV} roleLabel={t('roles.parent','Parent')} roleColor="bg-pink-600" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.parent','Parent')} roleColor="bg-pink-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
