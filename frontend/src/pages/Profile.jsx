import { useState, useEffect } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const [profile, setProfile] = useState({ fullName: '', phone: '', dateOfBirth: '' });
  const [pwForm, setPwForm]   = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pMsg, setPMsg]       = useState({ type: '', text: '' });
  const [pwMsg, setPwMsg]     = useState({ type: '', text: '' });
  const [saving, setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

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
    setPMsg({ type: '', text: '' });
    try {
      const payload = { fullName: profile.fullName, phone: profile.phone };
      if (role === 'student') payload.dateOfBirth = profile.dateOfBirth;
      await api.put('/auth/profile', payload);
      if (setUser) setUser(u => ({ ...u, fullName: profile.fullName }));
      setPMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (e) {
      setPMsg({ type: 'err', text: e.response?.data?.message || 'Failed to update profile.' });
    } finally { setSaving(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      setPwMsg({ type: 'err', text: e.response?.data?.message || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  }

  const initials = profile.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and password</p>
      </div>

      {/* Avatar block */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile.fullName}</p>
          <p className="text-sm text-gray-500 capitalize">{role} account</p>
          {studentInfo?.matricule && (
            <p className="text-xs text-gray-400 mt-0.5">Matricule: {studentInfo.matricule} <span className="text-gray-300">(cannot be changed)</span></p>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><User size={15}/> Personal Information</h2>
        </div>
        <form onSubmit={saveProfile} className="p-5 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} required/>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}/>
          </div>
          {role === 'student' && (
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={profile.dateOfBirth} onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))}/>
            </div>
          )}

          {pMsg.text && (
            <div className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 ${pMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {pMsg.type === 'ok' && <CheckCircle size={14}/>} {pMsg.text}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={14}/> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Lock size={15}/> Change Password</h2>
        </div>
        <form onSubmit={savePassword} className="p-5 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.oldPassword} onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} required/>
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required/>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required/>
          </div>

          {pwMsg.text && (
            <div className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 ${pwMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.type === 'ok' && <CheckCircle size={14}/>} {pwMsg.text}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={pwSaving}>
            <Lock size={14}/> {pwSaving ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
