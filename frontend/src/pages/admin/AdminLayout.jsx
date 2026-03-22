// ════════════════════════════════════════════════════════════════
//  AdminLayout.jsx
// ════════════════════════════════════════════════════════════════
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/Topbar';
import { LayoutDashboard, Users, Building2, BookOpen, Award, DoorOpen, CalendarRange, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminLayout() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/admin',                label: t('nav.dashboard',    'Dashboard'),      icon: <LayoutDashboard size={18}/> },
    { to: '/admin/users',          label: t('nav.users',        'Users'),           icon: <Users size={18}/> },
    { to: '/admin/departments',    label: t('nav.departments',  'Departments'),     icon: <Building2 size={18}/> },
    { to: '/admin/programs',       label: t('nav.programs',     'Programs'),        icon: <BookOpen size={18}/> },
    { to: '/admin/certifications', label: t('nav.certifications','Certifications'), icon: <Award size={18}/> },
    { to: '/admin/rooms',          label: t('nav.rooms',        'Rooms'),           icon: <DoorOpen size={18}/> },
    { to: '/admin/academic-years', label: t('nav.academicYears','Academic Years'),  icon: <CalendarRange size={18}/> },
    { to: '/admin/complaints',     label: t('nav.complaints',   'Complaints'),      icon: <MessageCircle size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={NAV} roleLabel={t('roles.admin','Administrator')} roleColor="bg-violet-700" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.admin','Administrator')} roleColor="bg-violet-700" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
export default AdminLayout;