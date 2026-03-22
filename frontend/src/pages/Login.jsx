import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(form);
      if (res.data.multipleRoles) {
        navigate('/select-role', { state: { userId: res.data.userId, roles: res.data.roles, fullName: res.data.fullName } });
      } else {
        login(res.data.token, res.data.role, res.data.user);
        navigate(`/${res.data.role}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed', 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      {/* Language switcher — top right */}
      <div className="absolute top-5 right-5 flex items-center bg-white/10 backdrop-blur rounded-full p-0.5 gap-0.5 z-10">
        <button
          onClick={() => i18n.changeLanguage('en')}
          title="Switch to English"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
            currentLang === 'en'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-white/70 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('fr')}
          title="Passer en français"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
            currentLang === 'fr'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-white/70 hover:text-white'
          }`}
        >
          FR
        </button>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TCMS</h1>
          <p className="text-primary-200 mt-1 text-sm">Training Center Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {t('auth.welcome', 'Welcome back')}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.signInToContinue', 'Sign in to your account to continue')}
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.emailAddress', 'Email Address')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder={t('auth.emailPlaceholder', 'your email here')}
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.password', 'Password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('auth.passwordHint', 'By default password is your phone number')}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? t('auth.signingIn', 'Signing in…') : t('auth.signIn', 'Sign in')}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          © {new Date().getFullYear()} TCMS · All rights reserved
        </p>
      </div>
    </div>
  );
}
