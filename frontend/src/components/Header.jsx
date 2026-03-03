// FILE: /frontend/src/components/Header.jsx
import { useAuth } from '../context/AuthContext';

// FIX: was importing useAuth from '../App' which doesn't export it — crashes entire app

function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="page-header-main">
      <div className="header-content">
        <div className="header-title">
          <h1>{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        <div className="header-user">
          <span className="header-user-name">
            {user?.fullName || 'User'}
          </span>
          <span className="header-user-role">
            ({user?.roleName
              ? user.roleName.charAt(0).toUpperCase() + user.roleName.slice(1)
              : 'Guest'})
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;