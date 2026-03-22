import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Maps English nav label to i18n key
const NAV_KEY_MAP = {
  'Dashboard':         'nav.dashboard',
  'User Management':   'nav.users',
  'Departments':       'nav.departments',
  'Programs':          'nav.programs',
  'Certifications':    'nav.certifications',
  'Rooms':             'nav.rooms',
  'Academic Years':    'nav.academicYears',
  'Complaints':        'nav.complaints',
  'Weeks':             'nav.weeks',
  'Availability':      'nav.availability',
  'Timetables':        'nav.timetables',
  'Announcements':     'nav.announcements',
  'My Courses':        'nav.courses',
  'Timetable':         'nav.timetable',
  'Grades':            'nav.grades',
  'Cert Timetable':    'nav.certTimetable',
  'Cert Availability': 'nav.certAvailability',
  'My Grades':         'nav.myGrades',
  'My Children':       'nav.children',
  'Students':          'nav.students',
  'Register':          'nav.register',
  'Grade Complaints':  'nav.gradeComplaints',
};

export default function Sidebar({ navItems = [], roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function label(l) {
    const key = NAV_KEY_MAP[l];
    return key ? t(key, l) : l;
  }

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-9 h-9 ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <GraduationCap size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">TCMS</p>
          <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
        </div>
        {/* Mobile close button */}
        <button
          className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? `bg-primary-50 text-primary-700 font-semibold`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="flex-shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
            <span className="truncate">{label(item.label)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col h-full bg-white border-r border-gray-100">
        <NavContent />
      </aside>

      {/* ── Mobile hamburger button ──────────────────────────────────── */}
      <button
        className={`lg:hidden fixed top-3 left-3 z-40 w-9 h-9 ${roleColor} rounded-xl flex items-center justify-center shadow-md`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* ── Mobile slide-over drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}
