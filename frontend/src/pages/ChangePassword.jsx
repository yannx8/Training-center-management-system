// FILE: /frontend/src/pages/ChangePassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePasswordApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirm) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await changePasswordApi(newPassword);
      navigate(`/${user.roleName}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Set New Password</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Your default password is your phone number. Please set a new password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="login-field">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}