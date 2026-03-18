import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { LayoutDashboard, Users, CalendarDays, BarChart2, MessageCircle, Megaphone } from "lucide-react";
const NAV = [
  { to: "/parent",              label: "Dashboard",    icon: <LayoutDashboard size={18} /> },
  { to: "/parent/children",     label: "My Children",  icon: <Users size={18} /> },
  { to: "/parent/timetable",    label: "Timetable",    icon: <CalendarDays size={18} /> },
  { to: "/parent/grades",       label: "Grades",       icon: <BarChart2 size={18} /> },
  { to: "/parent/complaints",   label: "Complaints",   icon: <MessageCircle size={18} /> },
  { to: "/parent/announcements",label: "Announcements",icon: <Megaphone size={18} /> },
];
export default function ParentLayout() {
  return (
    <div className="flex h-full">
      <Sidebar navItems={NAV} roleLabel="Parent" roleColor="bg-pink-600" />
      <main className="flex-1 overflow-y-auto bg-gray-50"><div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div></main>
    </div>
  );
}
