// FILE: src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ navItems, roleLabel, roleColor }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${roleColor}`}>TC</div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">TCMS</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{roleLabel}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColor}`}>
            {user?.fullName?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
