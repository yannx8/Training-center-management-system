import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ navItems = [], roleLabel = '', roleColor = 'bg-primary-600' }) {
  const { t } = useTranslation();

  function translateLabel(label) {
    const keyMap = {
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
    };
    const key = keyMap[label];
    return key ? t(key) : label;
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-9 h-9 ${roleColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <GraduationCap size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">TCMS</p>
          <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{translateLabel(item.label)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
