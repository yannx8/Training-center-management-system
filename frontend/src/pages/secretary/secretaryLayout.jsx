// FILE: /frontend/src/pages/secretary/SecretaryLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Secretary.css';

export default function SecretaryLayout() {
  return (
    <div className="secretary-layout">
      <div className="secretary-header">
        <h1>Academic Secretary Portal</h1>
        <p>Student Registration & Management System</p>
      </div>
      <Outlet />
    </div>
  );
}