// FILE: src/pages/student/StudentLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { LayoutDashboard, CalendarDays, Award, ClipboardList, BarChart2, MessageCircle, Megaphone } from "lucide-react";
import { studentApi } from "../../api";

export default function StudentLayout() {
  const [hasCerts, setHasCerts] = useState(false);
  useEffect(() => {
    studentApi.getCertEnrollments()
      .then(r => setHasCerts(r.data?.length > 0))
      .catch(() => {});
  }, []);

  const NAV = [
    { to:"/student",              label:"Dashboard",        icon:<LayoutDashboard size={18}/> },
    { to:"/student/timetable",    label:"My Timetable",     icon:<CalendarDays size={18}/> },
    // Cert tabs only if enrolled in at least one certification
    ...(hasCerts ? [
      { to:"/student/cert-timetable",    label:"Cert Timetable",    icon:<Award size={18}/> },
      { to:"/student/cert-availability", label:"Cert Availability",  icon:<ClipboardList size={18}/> },
    ] : []),
    { to:"/student/grades",       label:"My Grades",        icon:<BarChart2 size={18}/> },
    { to:"/student/complaints",   label:"Complaints",       icon:<MessageCircle size={18}/> },
    { to:"/student/announcements",label:"Announcements",    icon:<Megaphone size={18}/> },
  ];

  return (
    <div className="flex h-full">
      <Sidebar navItems={NAV} roleLabel="Student" roleColor="bg-blue-600" />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div>
      </main>
    </div>
  );
}
