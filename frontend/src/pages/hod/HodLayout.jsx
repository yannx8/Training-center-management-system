import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/Topbar';
import { LayoutDashboard, CalendarDays, ClipboardList, Table2, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HodLayout() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/hod',                label: t('nav.dashboard',    'Dashboard'),   icon: <LayoutDashboard size={18}/> },
    { to: '/hod/weeks',          label: t('nav.weeks',        'Weeks'),        icon: <CalendarDays size={18}/> },
    { to: '/hod/availability',   label: t('nav.availability', 'Availability'), icon: <ClipboardList size={18}/> },
    { to: '/hod/timetables',     label: t('nav.timetables',   'Timetables'),   icon: <Table2 size={18}/> },
    { to: '/hod/announcements',  label: t('nav.announcements','Announcements'),icon: <Megaphone size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 theme-hod">
      <Sidebar navItems={NAV} roleLabel={t('roles.hod','Head of Department')} roleColor="bg-primary-600" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.hod','HOD')} roleColor="bg-primary-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}