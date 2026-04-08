import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/Topbar';
import { LayoutDashboard, Users, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SecretaryLayout() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/secretary',          label: t('nav.dashboard','Dashboard'), icon: <LayoutDashboard size={18}/> },
    { to: '/secretary/students', label: t('nav.students', 'Students'),  icon: <Users size={18}/> },
    { to: '/secretary/register', label: t('nav.register', 'Register'),  icon: <UserPlus size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 theme-secretary">
      <Sidebar navItems={NAV} roleLabel={t('roles.secretary','Secretary')} roleColor="bg-primary-600" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.secretary','Secretary')} roleColor="bg-primary-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}