// frontend/src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icons';
import '../styles/Sidebar.css';

export default function Sidebar({ title, items }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">{title}</div>
      <nav className="sidebar-nav">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">
              <Icon name={item.icon} size={17} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-name">{user?.fullName}</div>
            <div className="sidebar-role">{user?.roleName}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <Icon name="logout" size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}