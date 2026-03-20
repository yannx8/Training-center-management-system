import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Edit3 } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert } from '../../components/ui';

const TABS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('All');
  const [modal, setModal]     = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus]   = useState('in_progress');
  const [saving, setSaving]   = useState(false);

  function load() {
    adminApi.getComplaints()
      .then(r => { setComplaints(r.data); setLoading(false); })
      .catch(() => setError('Failed to load complaints'));
  }
  useEffect(load, []);

  async function handleRespond() {
    setSaving(true);
    try {
      await adminApi.updateComplaint(modal.id, { status, adminResponse: response });
      setModal(null);
      load();
    } catch { alert('Failed to save response'); }
    finally { setSaving(false); }
  }

  const pending    = complaints.filter(c => c.status === 'pending');
  const inProgress = complaints.filter(c => c.status === 'in_progress');
  const resolved   = complaints.filter(c => c.status === 'resolved');

  const filtered = tab === 'All' ? complaints
    : tab === 'Pending'     ? pending
    : tab === 'In Progress' ? inProgress
    : resolved;

  // Try to get student name from complaint — parent complaints link a parent
  // The student name comes from the parent->student links if stored, otherwise from description
  function getStudentName(c) {
    // If complaint has student field populated, use it, otherwise use parent's name pattern
    return c.studentName || '—';
  }

  if (loading) return <PageLoader/>;
  if (error)   return <ErrorAlert message={error}/>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Parent Complaints</h1>
        <p className="page-subtitle">View and resolve parent complaints and concerns</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-amber-400">
          <div>
            <p className="text-sm text-amber-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{pending.length}</p>
          </div>
          <AlertTriangle size={28} className="text-amber-400"/>
        </div>
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-blue-400">
          <div>
            <p className="text-sm text-blue-600 font-medium">In Progress</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{inProgress.length}</p>
          </div>
          <Clock size={28} className="text-blue-400"/>
        </div>
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-green-400">
          <div>
            <p className="text-sm text-green-600 font-medium">Resolved</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{resolved.length}</p>
          </div>
          <CheckCircle size={28} className="text-green-400"/>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = t === 'All' ? complaints.length : t === 'Pending' ? pending.length : t === 'In Progress' ? inProgress.length : resolved.length;
          return (
            <button key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${tab === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-sm">No complaints in this category.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {c.parent?.user?.fullName || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {getStudentName(c)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{c.subject}</td>
                  <td className="px-5 py-3">
                    <PriorityBadge p={c.priority}/>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge s={c.status}/>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-gray-400 hover:text-primary-600 transition-colors"
                      onClick={() => { setModal(c); setResponse(c.adminResponse || ''); setStatus(c.status); }}>
                      <Edit3 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Respond modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title="Respond to Complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleRespond} disabled={saving}>{saving ? 'Saving…' : 'Save Response'}</button>
          </>
        }>
        {modal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-sm text-gray-800">{modal.subject}</p>
              <p className="text-xs text-gray-500">From: {modal.parent?.user?.fullName}</p>
              {modal.description && <p className="text-sm text-gray-600 pt-1">{modal.description}</p>}
            </div>
            <div>
              <label className="label">Update Status</label>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="label">Response Message</label>
              <textarea rows={4} className="input" placeholder="Write your response to the parent…"
                value={response} onChange={e => setResponse(e.target.value)}/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PriorityBadge({ p }) {
  const styles = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-0.5 rounded text-xs font-medium capitalize ${styles[p] || styles.low}`}>{p}</span>;
}

function StatusBadge({ s }) {
  if (s === 'pending')     return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle size={11}/> Pending</span>;
  if (s === 'in_progress') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><Clock size={11}/> In Progress</span>;
  if (s === 'resolved')    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle size={11}/> Resolved</span>;
  return <span className="badge-gray capitalize">{s}</span>;
}
