// FILE: /frontend/src/pages/hod/HodLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Hod.css';

const NAV = [
  { to: '/hod',               label: '⊞ Dashboard',            end: true },
  { to: '/hod/availability',  label: '📋 Trainer Availability', end: false },
  { to: '/hod/timetable',     label: '📅 Timetable',           end: false },
  { to: '/hod/announcements', label: '📢 Announcements',       end: false },
];

export default function HodLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="hod-shell">
      <aside className="hod-sidebar">
        <div className="hod-brand">VTC Manager</div>
        <nav className="hod-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `hod-link${isActive ? ' hod-link-active' : ''}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hod-footer">
          <div className="hod-footer-name">{user?.fullName}</div>
          <div className="hod-footer-role">HOD</div>
          <button className="hod-footer-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="hod-main">
        <Outlet />
      </main>
    </div>
  );
}
