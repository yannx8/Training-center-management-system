import { useState, useEffect } from 'react';
import { Save, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Phone, Calendar, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';

// We use different colors and gradients depending on the user's role 
// to make the app feel personalized to their specific view.
const ROLE_CONFIG = {
  admin: { gradient: 'from-violet-600 to-purple-700', ring: 'ring-violet-400', btnClass: 'bg-violet-600 hover:bg-violet-700', accent: 'text-violet-600', accentBg: 'bg-violet-50', accentBorder: 'border-violet-200' },
  hod: { gradient: 'from-teal-500 to-teal-700', ring: 'ring-teal-400', btnClass: 'bg-teal-600 hover:bg-teal-700', accent: 'text-teal-600', accentBg: 'bg-teal-50', accentBorder: 'border-teal-200' },
  trainer: { gradient: 'from-amber-500 to-orange-600', ring: 'ring-amber-400', btnClass: 'bg-amber-600 hover:bg-amber-700', accent: 'text-amber-600', accentBg: 'bg-amber-50', accentBorder: 'border-amber-200' },
  student: { gradient: 'from-blue-500 to-blue-700', ring: 'ring-blue-400', btnClass: 'bg-blue-600 hover:bg-blue-700', accent: 'text-blue-600', accentBg: 'bg-blue-50', accentBorder: 'border-blue-200' },
  parent: { gradient: 'from-pink-500 to-rose-600', ring: 'ring-pink-400', btnClass: 'bg-pink-600 hover:bg-pink-700', accent: 'text-pink-600', accentBg: 'bg-pink-50', accentBorder: 'border-pink-200' },
  secretary: { gradient: 'from-cyan-500 to-cyan-700', ring: 'ring-cyan-400', btnClass: 'bg-cyan-600 hover:bg-cyan-700', accent: 'text-cyan-600', accentBg: 'bg-cyan-50', accentBorder: 'border-cyan-200' },
};

// A quick helper to give the user visual feedback on how secure their new password is.
function passwordStrength(pwd) {
  if (!pwd) return null;
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;

  if (s <= 1) return { label: 'Weak', width: '25%', bar: 'bg-red-400', text: 'text-red-500' };
  if (s <= 2) return { label: 'Fair', width: '50%', bar: 'bg-amber-400', text: 'text-amber-600' };
  if (s <= 3) return { label: 'Good', width: '75%', bar: 'bg-blue-400', text: 'text-blue-600' };
  return { label: 'Strong', width: '100%', bar: 'bg-green-500', text: 'text-green-600' };
}

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const { t } = useTranslation();
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const [tab, setTab] = useState('info');
  const [profile, setProfile] = useState({ fullName: '', phone: '', dateOfBirth: '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [studentInfo, setStudentInfo] = useState(null);
  const [pMsg, setPMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const strength = passwordStrength(pwForm.newPassword);
  const initials = profile.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Role label — translated
  const roleLabel = t(`roles.${role}`, role);

  // Strength label translated
  const strengthLabel = strength ? t(`profile.${strength.label.toLowerCase()}`, strength.label) : '';

  // When the page loads, we fetch the latest profile data from the server 
  // to make sure what's on screen matches our database.
  api.get('/auth/me').then(r => {
    const u = r.data.data;
    setProfile({
      fullName: u.fullName || '',
      phone: u.phone || '',
      dateOfBirth: u.studentInfo?.dateOfBirth ? u.studentInfo.dateOfBirth.split('T')[0] : '',
    });
    if (u.studentInfo) setStudentInfo(u.studentInfo);
  }).catch(() => { });

  // Saves the user's updated name or phone number back to the server.
  async function saveProfile(e) {
    e.preventDefault(); setSaving(true); setPMsg(null);
    try {
      const payload = { fullName: profile.fullName, phone: profile.phone };
      if (role === 'student') payload.dateOfBirth = profile.dateOfBirth;
      await api.put('/auth/profile', payload);

      // We also update the global auth context so their name updates in the sidebar instantly.
      if (setUser) setUser(u => ({ ...u, fullName: profile.fullName }));

      setPMsg({ type: 'ok', text: t('profile.profileUpdated', 'Profile updated.') });
    } catch (e) {
      setPMsg({ type: 'err', text: e.response?.data?.message || 'Failed to update profile.' });
    } finally { setSaving(false); }
  }

  async function savePassword(e) {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwMsg({ type: 'err', text: t('profile.passwordMismatch', 'Passwords do not match.') });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ type: 'err', text: t('profile.passwordTooShort', 'Password must be at least 6 characters.') });
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'ok', text: t('profile.passwordUpdated', 'Password changed successfully.') });
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      setPwMsg({ type: 'err', text: e.response?.data?.message || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  }

  const TABS = [
    { id: 'info', label: t('profile.personalInfo', 'Personal Info'), icon: <User size={15} /> },
    { id: 'password', label: t('profile.changePassword', 'Change Password'), icon: <Lock size={15} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Hero card ── */}
      <div className={`rounded-2xl bg-gradient-to-br ${cfg.gradient} p-5 text-white shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.fullName || user?.fullName || '—'}</h1>
            <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                <Shield size={11} /> {roleLabel}
              </span>
              {studentInfo?.matricule && (
                <span className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  {studentInfo.matricule}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*  Tabs  */}
      <div className={`flex rounded-xl border overflow-hidden ${cfg.accentBorder}`}>
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-150 ${tab === item.id
              ? `${cfg.accentBg} ${cfg.accent} border-b-2 ${cfg.accentBorder}`
              : 'text-gray-500 hover:text-gray-700 bg-white'
              }`}
          >
            {item.icon}
            <span className="hidden xs:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/*  Personal Info Tab  */}
      {tab === 'info' && (
        <div className="card p-5">
          <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${cfg.accent}`}>
            <User size={18} /> {t('profile.personalInfo', 'Personal Information')}
          </h2>

          {pMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${pMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {pMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {pMsg.text}
            </div>
          )}

          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="label">{t('profile.fullName', 'Full Name')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} required />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9 bg-gray-50 cursor-not-allowed" value={user?.email || ''} readOnly />
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('profile.emailReadonly', 'Email cannot be changed.')}</p>
            </div>

            <div>
              <label className="label">{t('profile.phone', 'Phone Number')}</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            {role === 'student' && (
              <div>
                <label className="label">{t('profile.dateOfBirth', 'Date of Birth')}</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" className="input pl-9 bg-gray-50 cursor-not-allowed" value={profile.dateOfBirth} readOnly />
                </div>
                <p className="text-xs text-gray-400 mt-1">{t('profile.dobReadonly', 'Date of birth cannot be changed.')}</p>
              </div>
            )}

            {studentInfo && (
              <div className={`rounded-xl p-4 ${cfg.accentBg} border ${cfg.accentBorder}`}>
                <p className={`text-xs font-semibold mb-2 ${cfg.accent}`}>{t('profile.academicInfo', 'Academic Info')}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {studentInfo.matricule && (
                    <div>
                      <p className="text-gray-400 text-xs">{t('profile.matricule', 'Matricule')}</p>
                      <p className="font-semibold text-gray-700">{studentInfo.matricule} <span className="text-xs text-gray-400">{t('profile.matriculeHint', '(cannot be changed)')}</span></p>
                    </div>
                  )}
                  {studentInfo.program?.name && (
                    <div>
                      <p className="text-gray-400 text-xs">{t('profile.program', 'Program')}</p>
                      <p className="font-semibold text-gray-700">{studentInfo.program.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${cfg.btnClass} disabled:opacity-50`}>
              <Save size={16} />
              {saving ? t('profile.saving', 'Saving…') : t('profile.saveChanges', 'Save Changes')}
            </button>
          </form>
        </div>
      )}

      {/*  Change Password Tab  */}
      {tab === 'password' && (
        <div className="card p-5">
          <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${cfg.accent}`}>
            <Lock size={18} /> {t('profile.changePassword', 'Change Password')}
          </h2>

          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${pwMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {pwMsg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="label">{t('profile.currentPassword', 'Current Password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showOld ? 'text' : 'password'} className="input pl-9 pr-10"
                  value={pwForm.oldPassword} onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} required />
                <button type="button" onClick={() => setShowOld(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">{t('profile.newPassword', 'New Password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showNew ? 'text' : 'password'} className="input pl-9 pr-10"
                  value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
                <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.bar}`} style={{ width: strength.width }} />
                  </div>
                  <p className={`text-xs mt-1 font-medium ${strength.text}`}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">{t('profile.confirmPassword', 'Confirm New Password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" className="input pl-9" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              {pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
                <p className="text-xs text-red-500 mt-1">{t('profile.passwordsNoMatch', 'Passwords do not match.')}</p>
              )}
            </div>

            <button type="submit" disabled={pwSaving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${cfg.btnClass} disabled:opacity-50`}>
              <Lock size={16} />
              {pwSaving ? t('profile.updatingPassword', 'Updating…') : t('profile.updatePassword', 'Change Password')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}