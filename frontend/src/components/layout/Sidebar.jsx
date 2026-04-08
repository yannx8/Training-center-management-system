import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NAV_KEY_MAP = {
  'Dashboard': 'nav.dashboard',
  'User Management': 'nav.users',
  'Departments': 'nav.departments',
  'Programs': 'nav.programs',
  'Certifications': 'nav.certifications',
  'Rooms': 'nav.rooms',
  'Academic Years': 'nav.academicYears',
  'Complaints': 'nav.complaints',
  'Weeks': 'nav.weeks',
  'Availability': 'nav.availability',
  'Timetables': 'nav.timetables',
  'Announcements': 'nav.announcements',
  'My Courses': 'nav.courses',
  'Timetable': 'nav.timetable',
  'Grades': 'nav.grades',
  'Cert Timetable': 'nav.certTimetable',
  'Cert Availability': 'nav.certAvailability',
  'My Grades': 'nav.myGrades',
  'My Children': 'nav.children',
  'Students': 'nav.students',
  'Register': 'nav.register',
  'Grade Complaints': 'nav.gradeComplaints',
};

export default function Sidebar({ navItems = [], roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function label(l) {
    const key = NAV_KEY_MAP[l];
    return key ? t(key, l) : l;
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div
        className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--sb-border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--sb-brand-bg)' }}
        >
          <GraduationCap size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">TCMS</p>
          <p className="text-xs truncate" style={{ color: 'var(--sb-text)' }}>{roleLabel}</p>
        </div>
        <button
          className="ml-auto lg:hidden"
          style={{ color: 'var(--sb-text)' }}
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            onClick={() => setMobileOpen(false)}
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive ? 'var(--sb-item-active)' : 'transparent',
                  color: isActive ? 'var(--sb-text-active)' : 'var(--sb-text)',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--sb-item-hover)';
                    e.currentTarget.style.color = 'var(--sb-text-active)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--sb-text)';
                  }
                }}
              >
                <span className="flex-shrink-0 w-5 flex items-center justify-center" style={{ opacity: isActive ? 1 : 0.75 }}>
                  {item.icon}
                </span>
                <span className="truncate">{label(item.label)}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--sb-text-active)', opacity: 0.7 }}
                  />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--sb-border)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--sb-text)' }}>
          {roleLabel}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-56 flex-shrink-0 flex-col h-full role-sidebar"
      >
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className={`lg:hidden fixed top-3 left-3 z-40 w-9 h-9 ${roleColor} rounded-xl flex items-center justify-center shadow-md`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 shadow-2xl z-50 flex flex-col role-sidebar">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}