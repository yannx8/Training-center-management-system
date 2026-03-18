// FILE: src/pages/SelectRole.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, BookOpen, Users, UserCheck, GraduationCap, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

const ROLE_CONFIG = {
  admin:     { label: 'Administrator', icon: Shield,      color: 'bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200', accent: 'bg-violet-600' },
  secretary: { label: 'Secretary',     icon: UserCheck,   color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200',         accent: 'bg-cyan-600' },
  hod:       { label: 'Head of Dept',  icon: BookOpen,    color: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200',         accent: 'bg-teal-600' },
  trainer:   { label: 'Trainer',       icon: Users,       color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200',     accent: 'bg-amber-600' },
  student:   { label: 'Student',       icon: GraduationCap, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',      accent: 'bg-blue-600' },
  parent:    { label: 'Parent',        icon: Heart,       color: 'bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200',         accent: 'bg-pink-600' },
};

export default function SelectRole() {
  const { state }         = useLocation();
  const navigate          = useNavigate();
  const { login }         = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState('');

  if (!state?.roles) { navigate('/login'); return null; }

  async function pick(role) {
    setLoading(role); setError('');
    try {
      const res = await authApi.selectRole({ userId: state.userId, role });
      login(res.data.token, res.data.role, res.data.user);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to select role');
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Hello, {state.fullName?.split(' ')[0]}!</h2>
          <p className="text-gray-500 text-sm mt-1">You have multiple roles. Which one are you accessing as today?</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="space-y-3">
          {state.roles.map(role => {
            const cfg = ROLE_CONFIG[role] || { label: role, icon: Shield, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' };
            const Icon = cfg.icon;
            const isLoading = loading === role;
            return (
              <button key={role} onClick={() => pick(role)} disabled={!!loading}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 font-medium transition-all ${cfg.color} disabled:opacity-50`}>
                <Icon size={22} />
                <span className="text-base">{cfg.label}</span>
                {isLoading && <Loader2 size={16} className="ml-auto animate-spin" />}
              </button>
            );
          })}
        </div>
        <button onClick={() => navigate('/login')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4">
          ← Back to login
        </button>
      </div>
    </div>
  );
}
