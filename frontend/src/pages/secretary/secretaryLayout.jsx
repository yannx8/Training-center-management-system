import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { LayoutDashboard, Users, UserPlus } from "lucide-react";
const NAV = [
  { to: "/secretary",          label: "Dashboard",        icon: <LayoutDashboard size={18} /> },
  { to: "/secretary/students", label: "All Students",     icon: <Users size={18} /> },
  { to: "/secretary/register", label: "Register Student", icon: <UserPlus size={18} /> },
];
export default function SecretaryLayout() {
  return (
    <div className="flex h-full">
      <Sidebar navItems={NAV} roleLabel="Secretary" roleColor="bg-cyan-600" />
      <main className="flex-1 overflow-y-auto bg-gray-50"><div className="max-w-7xl mx-auto px-6 py-6"><Outlet /></div></main>
    </div>
  );
}
