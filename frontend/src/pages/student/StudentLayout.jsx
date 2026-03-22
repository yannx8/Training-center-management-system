import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/Topbar';
import { LayoutDashboard, Table2, Award, CalendarCheck, BarChart2, MessageCircle, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StudentLayout() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/student',                   label: 'Dashboard',        icon: <LayoutDashboard size={18}/> },
    { to: '/student/timetable',         label: 'Timetable',        icon: <Table2 size={18}/> },
    { to: '/student/cert-timetable',    label: 'Cert Timetable',   icon: <Award size={18}/> },
    { to: '/student/cert-availability', label: 'Cert Availability',icon: <CalendarCheck size={18}/> },
    { to: '/student/grades',            label: 'My Grades',        icon: <BarChart2 size={18}/> },
    { to: '/student/complaints',        label: 'Complaints',       icon: <MessageCircle size={18}/> },
    { to: '/student/announcements',     label: 'Announcements',    icon: <Megaphone size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={NAV} roleLabel={t('roles.student','Student')} roleColor="bg-blue-600" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.student','Student')} roleColor="bg-blue-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
