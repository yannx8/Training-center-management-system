import { useState, useEffect } from 'react';
import { Save, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Camera, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

// Role-based visual config
const ROLE_CONFIG = {
  admin:     { gradient: 'from-violet-600 to-purple-700',  ring: 'ring-violet-400', badge: 'bg-violet-100 text-violet-800',  label: 'Administrator' },
  hod:       { gradient: 'from-teal-500 to-teal-700',      ring: 'ring-teal-400',   badge: 'bg-teal-100 text-teal-800',      label: 'Head of Department' },
  trainer:   { gradient: 'from-amber-500 to-orange-600',   ring: 'ring-amber-400',  badge: 'bg-amber-100 text-amber-800',    label: 'Trainer' },
  student:   { gradient: 'from-blue-500 to-blue-700',      ring: 'ring-blue-400',   badge: 'bg-blue-100 text-blue-800',      label: 'Student' },
  parent:    { gradient: 'from-pink-500 to-rose-600',      ring: 'ring-pink-400',   badge: 'bg-pink-100 text-pink-800',      label: 'Parent' },
  secretary: { gradient: 'from-cyan-500 to-cyan-700',      ring: 'ring-cyan-400',   badge: 'bg-cyan-100 text-cyan-800',      label: 'Secretary' },
};

function passwordStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: 'Weak',   width: '25%',  bar: 'bg-red-400',    text: 'text-red-500' };
  if (score <= 2) return { label: 'Fair',   width: '50%',  bar: 'bg-amber-400',  text: 'text-amber-600' };
  if (score <= 3) return { label: 'Good',   width: '75%',  bar: 'bg-blue-400',   text: 'text-blue-600' };
  return              { label: 'Strong', width: '100%', bar: 'bg-green-500',  text: 'text-green-600' };
}

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const [tab, setTab]         = useState('info');
  const [profile, setProfile] = useState({ fullName: '', phone: '', dateOfBirth: '' });
  const [pwForm, setPwForm]   = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [studentInfo, setStudentInfo] = useState(null);

  const [pMsg,    setPMsg]    = useState(null); // { type: 'ok'|'err', text }
  const [pwMsg,   setPwMsg]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [pwSaving,setPwSaving]= useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const strength = passwordStrength(pwForm.newPassword);

  const initials = profile.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.data;
      setProfile({
        fullName:    u.fullName || '',
        phone:       u.phone || '',
        dateOfBirth: u.studentInfo?.dateOfBirth ? u.studentInfo.dateOfBirth.split('T')[0] : '',
      });
      if (u.studentInfo) setStudentInfo(u.studentInfo);
    }).catch(() => {});
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setPMsg(null);
    try {
      const payload = { fullName: profile.fullName, phone: profile.phone };
      if (role === 'student') payload.dateOfBirth = profile.dateOfBirth;
      await api.put('/auth/profile', payload);
      if (setUser) setUser(u => ({ ...u, fullName: profile.fullName }));
      setPMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (e) {
      setPMsg({ type: 'err', text: e.response?.data?.message || 'Failed to update profile.' });
    } finally { setSaving(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwMsg({ type: 'err', text: 'New passwords do not match.' });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ type: 'err', text: 'Password must be at least 6 characters.' });
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      setPwMsg({ type: 'err', text: e.response?.data?.message || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${cfg.gradient} rounded-2xl overflow-hidden`}>
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-4 right-24 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative px-8 py-8 flex items-center gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-4 ring-white/20`}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight truncate">{profile.fullName || '—'}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/70 text-sm">
              <Mail size={13} />
              <span className="truncate">{user?.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-1.5 mt-0.5 text-white/60 text-xs">
                <Phone size={12} />
                <span>{profile.phone}</span>
              </div>
            )}
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full text-white capitalize">
                {cfg.label}
              </span>
              {studentInfo?.matricule && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full text-white">
                  {studentInfo.matricule}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white/15 rounded-full text-white/80">
                  <Calendar size={10} /> Since {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setTab('info')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-all duration-150 ${
            tab === 'info' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera size={14} /> Personal Info
        </button>
        <button
          onClick={() => setTab('security')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-all duration-150 ${
            tab === 'security' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield size={14} /> Security
        </button>
      </div>

      {/* ── Personal Info tab ───────────────────────────────── */}
      {tab === 'info' && (
        <form onSubmit={saveProfile} className="space-y-5">
          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <input
                  className="input pr-9"
                  placeholder="Your full name"
                  value={profile.fullName}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="input pl-8"
                  placeholder="+237 6xx xxx xxx"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Student-only fields */}
          {role === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="input pl-8"
                    value={profile.dateOfBirth}
                    onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Matricule</label>
                <input
                  readOnly
                  value={studentInfo?.matricule || '—'}
                  className="input bg-gray-50 text-gray-400 cursor-not-allowed select-none"
                  title="Matricule cannot be changed"
                />
                <p className="text-xs text-gray-400 mt-1">Assigned automatically, cannot be changed.</p>
              </div>
            </div>
          )}

          {/* Email (read-only info) */}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                readOnly
                value={user?.email || ''}
                className="input pl-8 bg-gray-50 text-gray-400 cursor-not-allowed"
                title="Contact your administrator to change your email"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Contact your administrator to change your email address.</p>
          </div>

          {/* Feedback message */}
          {pMsg && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${
              pMsg.type === 'ok'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {pMsg.type === 'ok' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
              {pMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">Changes apply immediately after saving.</p>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Security tab ────────────────────────────────────── */}
      {tab === 'security' && (
        <form onSubmit={savePassword} className="space-y-5">

          {/* Info card */}
          <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-100 rounded-xl">
            <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Password requirements</p>
              <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                <li>At least 6 characters long</li>
                <li>Must differ from your current password</li>
                <li>Mix of letters, numbers and symbols is recommended</li>
              </ul>
            </div>
          </div>

          {/* Current password */}
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type={showOld ? 'text' : 'password'}
                className="input pl-8 pr-10"
                placeholder="Enter your current password"
                value={pwForm.oldPassword}
                onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showOld ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {/* New + confirm side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input pl-8 pr-10"
                  placeholder="New password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.bar}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className={`text-xs font-medium ${strength.text}`}>{strength.label} password</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className={`input ${
                  pwForm.confirm
                    ? pwForm.newPassword === pwForm.confirm
                      ? 'border-green-300 focus:ring-green-400'
                      : 'border-red-300 focus:ring-red-400'
                    : ''
                }`}
                placeholder="Confirm password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required
              />
              {pwForm.confirm && (
                <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${
                  pwForm.newPassword === pwForm.confirm ? 'text-green-600' : 'text-red-500'
                }`}>
                  {pwForm.newPassword === pwForm.confirm
                    ? <><CheckCircle size={11}/> Passwords match</>
                    : <><AlertCircle size={11}/> Passwords don't match</>
                  }
                </p>
              )}
            </div>
          </div>

          {/* Feedback */}
          {pwMsg && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${
              pwMsg.type === 'ok'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {pwMsg.type === 'ok' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
              {pwMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">You will remain logged in after changing your password.</p>
            <button type="submit" className="btn-primary" disabled={pwSaving || pwForm.newPassword !== pwForm.confirm}>
              <Lock size={14} /> {pwSaving ? 'Updating…' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
