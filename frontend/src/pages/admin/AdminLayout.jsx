import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { LayoutDashboard, Users, Building2, BookMarked, Award, DoorOpen, CalendarDays, MessageSquare, User } from 'lucide-react';

const NAV = [
  { to: '/admin',              label: 'Dashboard',       icon: <LayoutDashboard size={18}/> },
  { to: '/admin/users',        label: 'User Management', icon: <Users size={18}/> },
  { to: '/admin/departments',  label: 'Departments',     icon: <Building2 size={18}/> },
  { to: '/admin/programs',     label: 'Programs',        icon: <BookMarked size={18}/> },
  { to: '/admin/certifications',label: 'Certifications', icon: <Award size={18}/> },
  { to: '/admin/rooms',        label: 'Rooms',           icon: <DoorOpen size={18}/> },
  { to: '/admin/academic-years',label: 'Academic Years', icon: <CalendarDays size={18}/> },
  { to: '/admin/complaints',   label: 'Complaints',      icon: <MessageSquare size={18}/> },
  { to: '/admin/profile',      label: 'Profile',         icon: <User size={18}/> },
];

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={NAV} roleLabel="Administrator" roleColor="bg-violet-600"/>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6"><Outlet/></div>
      </main>
    </div>
  );
}
