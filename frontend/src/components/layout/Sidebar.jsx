import { NavLink } from 'react-router-dom';
import { LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ navItems = [], roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-9 h-9 ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <GraduationCap size={18} className="text-white"/>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">TCMS</p>
          <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={15}/> Sign out
        </button>
      </div>
    </aside>
  );
}
