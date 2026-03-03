// FILE: /frontend/src/pages/secretary/secretaryLayout.jsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import '../../styles/Sidebar.css';

export default function SecretaryLayout() {
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/secretary', label: 'Dashboard', icon: '📊' },
    { path: '/secretary/students', label: 'Students', icon: '👨‍🎓' },
    { path: '/secretary/parents', label: 'Parents', icon: '👨‍👩‍👧' },
  ];

  return (
    <div className="layout">
      <Header user={user} onLogout={logout} />
      <div className="layout-body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/secretary'}
                className={({ isActive }) => 
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}