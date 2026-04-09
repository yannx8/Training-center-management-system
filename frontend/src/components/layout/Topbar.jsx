import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { LogOut, User, ChevronDown, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { useTranslation } from 'react-i18next';

/*  Main TopBar  */
export default function TopBar({ roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const profilePath = `/${role}/profile`;

  // Role switching state
  const [roles, setRoles] = useState([]);

  // Fetch available roles
  useEffect(() => {
    if (!user?.id) return;
    authApi.getMe().then(res => {
      if (res.data?.roles) setRoles(res.data.roles);
    }).catch(err => console.error('Failed to fetch user roles', err));
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleLogout() { setOpen(false); logout(); navigate('/login'); }

  // Navigate to /select-role page when switching account
  function handleSwitchAccount() {
    setOpen(false);
    navigate('/select-role', {
      state: {
        userId: user?.id,
        roles,
        fullName: user?.fullName,
      }
    });
  }

  // Only show "Switch Account" button if the user has more than 1 role
  const showSwitchButton = roles.length > 1;

  return (
    <header className="h-14 flex-shrink-0 glass-panel flex items-center justify-end px-4 gap-2 z-30 lg:px-6">
      {/* Language toggle */}
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
        {['en', 'fr'].map(lang => (
          <button
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${currentLang === lang ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Profile dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--tb-accent)' }}
          >
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight max-w-[100px] truncate">
              {user?.fullName?.split(' ')[0] || 'User'}
            </p>
            <p className="text-[10px] text-gray-400 capitalize leading-none mt-0.5">{roleLabel}</p>
          </div>
          <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
            {/* User header */}
            <div className="px-4 py-4 border-b border-gray-100" style={{ background: 'var(--tb-accent-light, #f9fafb)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--tb-accent)' }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  <span
                    className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <NavLink
                to={profilePath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-100)' }}>
                  <User size={14} style={{ color: 'var(--primary-600)' }} />
                </div>
                <span>{t('nav.profile', 'My Profile')}</span>
              </NavLink>

              {/* Switch Account — redirects to role selection page */}
              {showSwitchButton && (
                <button
                  onClick={handleSwitchAccount}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <span>{t('auth.switchAccount', 'Switch Account')}</span>
                </button>
              )}
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
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