// FILE: src/pages/trainer/TrainerLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { LayoutDashboard, BookOpen, Award, ClipboardList, Table2, BarChart2, MessageCircle, Megaphone } from "lucide-react";
import { trainerApi } from "../../api";

export default function TrainerLayout() {
  const [hasCerts, setHasCerts] = useState(false);
  useEffect(() => {
    trainerApi.getCertifications()
      .then(r => setHasCerts(r.data?.length > 0))
      .catch(() => {});
  }, []);

  const NAV = [
    { to:"/trainer",              label:"Dashboard",       icon:<LayoutDashboard size={18}/> },
    { to:"/trainer/courses",      label:"My Courses",      icon:<BookOpen size={18}/> },
    ...(hasCerts ? [
      { to:"/trainer/certifications", label:"Certifications", icon:<Award size={18}/> },
    ] : []),
    { to:"/trainer/availability", label:"Availability",    icon:<ClipboardList size={18}/> },
    { to:"/trainer/timetable",    label:"My Timetable",    icon:<Table2 size={18}/> },
    { to:"/trainer/grades",       label:"Grades",          icon:<BarChart2 size={18}/> },
    { to:"/trainer/complaints",   label:"Complaints",      icon:<MessageCircle size={18}/> },
    { to:"/trainer/announcements",label:"Announcements",   icon:<Megaphone size={18}/> },
  ];

  return (
    <div className="flex h-full">
      <Sidebar navItems={NAV} roleLabel="Trainer" roleColor="bg-amber-600" />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div>
      </main>
    </div>
  );
}
