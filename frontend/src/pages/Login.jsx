import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, selectRoleApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'role'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleCredentials(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { userId, roles} = res.data.data;
      setUserId(userId);
      setRoles(roles);
      if (roles.length === 1) {
        // Only one role — skip selection screen
        await finishLogin(userId, roles[0].role_id, roles[0].role_name);
      } else {
        setSelectedRole(roles[0].role_id);
        setStep('role');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleSelect(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await selectRoleApi(userId, selectedRole);
      const { token, user } = res.data.data;
      login(user, token);
      navigate(`/${user.roleName}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Role selection failed');
    } finally {
      setLoading(false);
    }
  }

  async function finishLogin(uid, roleId, roleName) {
    const res = await selectRoleApi(uid, roleId);
    const { token, user } = res.data.data;
    login(user, token);
    navigate(`/${roleName}`);
  }

  if (step === 'role') {
    return (
      <div className="login-page">
        <div className="role-card">
          <h3 className="role-title">Connect As</h3>
          <form onSubmit={handleRoleSelect}>
            {roles.map(r => (
              <label key={r.role_id} className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={r.role_id}
                  checked={selectedRole == r.role_id}
                  onChange={() => setSelectedRole(r.role_id)}
                />
                <span>{r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1)}</span>
              </label>
            ))}
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Login here</h2>
        <form onSubmit={handleCredentials}>
          <div className="login-field">
            <label>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@center.com" required
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••" required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}