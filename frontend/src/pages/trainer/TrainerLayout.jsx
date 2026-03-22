// ── TrainerLayout.jsx ──────────────────────────────────────
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import TopBar  from '../../components/layout/TopBar';
import { LayoutDashboard, BookOpen, Award, ClipboardList, Table2, BarChart2, MessageCircle, Megaphone } from 'lucide-react';
import { trainerApi } from '../../api';
import { useTranslation } from 'react-i18next';

export default function TrainerLayout() {
  const { t } = useTranslation();
  const [hasCerts, setHasCerts] = useState(false);
  useEffect(() => { trainerApi.getCertifications().then(r => setHasCerts((r.data?.length||0)>0)).catch(()=>{}); }, []);
  const NAV = [
    { to: '/trainer',               label: 'Dashboard',     icon: <LayoutDashboard size={18}/> },
    { to: '/trainer/courses',       label: 'My Courses',    icon: <BookOpen size={18}/> },
    ...(hasCerts ? [{ to: '/trainer/certifications', label: 'Certifications', icon: <Award size={18}/> }] : []),
    { to: '/trainer/availability',  label: 'Availability',  icon: <ClipboardList size={18}/> },
    { to: '/trainer/timetable',     label: 'Timetable',     icon: <Table2 size={18}/> },
    { to: '/trainer/grades',        label: 'Grades',        icon: <BarChart2 size={18}/> },
    { to: '/trainer/complaints',    label: 'Complaints',    icon: <MessageCircle size={18}/> },
    { to: '/trainer/announcements', label: 'Announcements', icon: <Megaphone size={18}/> },
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={NAV} roleLabel={t('roles.trainer','Trainer')} roleColor="bg-amber-600" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar roleLabel={t('roles.trainer','Trainer')} roleColor="bg-amber-600" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 pt-16 lg:pt-4"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
