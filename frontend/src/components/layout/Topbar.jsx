import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { LogOut, User, ChevronDown, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function TopBar({ roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const profilePath = `/${role}/profile`;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login');
  }

  // Role color text variant for badge
  const roleBadgeClass = roleColor
    .replace('bg-', 'text-')
    .replace('-600', '-700');
  const roleBadgeBg = roleColor
    .replace('-600', '-50');

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-end px-6 gap-3 z-30">

      {/* ── Language toggle pill ─────────────────────────── */}
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
        <button
          onClick={() => i18n.changeLanguage('en')}
          title="Switch to English"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
            currentLang === 'en'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('fr')}
          title="Passer en français"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
            currentLang === 'fr'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          FR
        </button>
      </div>

      {/* ── Thin separator ──────────────────────────────── */}
      <div className="w-px h-5 bg-gray-200" />

      {/* ── Profile button + dropdown ────────────────────── */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150"
        >
          {/* Avatar */}
          <div className={`w-7 h-7 rounded-full ${roleColor} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ring-2 ring-white`}>
            {initials}
          </div>
          {/* Name + role – hidden on very small screens */}
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight max-w-[110px] truncate">
              {user?.fullName?.split(' ')[0] || 'User'}
            </p>
            <p className="text-[10px] text-gray-400 capitalize leading-none mt-0.5">{roleLabel}</p>
          </div>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* ── Dropdown ──────────────────────────────────── */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">

            {/* User info header */}
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${roleColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user?.fullName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeBg} ${roleBadgeClass} capitalize border border-current border-opacity-20`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <NavLink
                to={profilePath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-primary-600" />
                </div>
                <span>{t('nav.profile', 'My Profile')}</span>
              </NavLink>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100 py-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <LogOut size={14} className="text-red-500" />
                </div>
                <span>{t('nav.signOut', 'Sign out')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
