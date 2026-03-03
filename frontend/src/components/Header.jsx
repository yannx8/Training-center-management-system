// src/components/Header.jsx
import React from 'react';
import { useAuth } from '../App';

function Header({ title, subtitle }) {
  const { user } = useAuth();

  return React.createElement('header', { className: 'page-header-main' },
    React.createElement('div', { className: 'header-content' },
      React.createElement('div', { className: 'header-title' },
        React.createElement('h1', null, title),
        subtitle && React.createElement('p', { className: 'header-subtitle' }, subtitle)
      ),
      React.createElement('div', { className: 'header-user' },
        React.createElement('span', { className: 'header-user-name' }, 
          user?.full_name || 'Admin User'
        ),
        React.createElement('span', { className: 'header-user-role' }, 
          `(${user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Administrator'})`
        )
      )
    )
  );
}

export default Header;