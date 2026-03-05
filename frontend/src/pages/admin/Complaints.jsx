import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getComplaints, updateComplaint } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

const TABS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function Complaints() {
  const { data, loading, refetch } = useFetch(getComplaints);
  const [activeTab, setActiveTab] = useState('All');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ status: '', adminResponse: '' });
  const [error, setError] = useState('');

  const filtered = (data || []).filter(c => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return c.status === 'pending';
    if (activeTab === 'In Progress') return c.status === 'in_progress';
    if (activeTab === 'Resolved') return c.status === 'resolved';
    return true;
  });

  function countFor(tab) {
    if (!data) return 0;
    if (tab === 'All') return data.length;
    if (tab === 'Pending') return data.filter(c => c.status === 'pending').length;
    if (tab === 'In Progress') return data.filter(c => c.status === 'in_progress').length;
    if (tab === 'Resolved') return data.filter(c => c.status === 'resolved').length;
    return 0;
  }

  function openEdit(c) {
    setEditItem(c);
    setForm({ status: c.status, adminResponse: c.admin_response || '' });
    setError('');
  }

  async function handleSubmit() {
    try {
      await updateComplaint(editItem.id, { status: form.status, adminResponse: form.adminResponse });
      setEditItem(null); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  const pending = data?.filter(c => c.status === 'pending').length || 0;
  const inProgress = data?.filter(c => c.status === 'in_progress').length || 0;
  const resolved = data?.filter(c => c.status === 'resolved').length || 0;

  const columns = [
    { key: 'created_at', label: 'Date', render: r => r.created_at?.split('T')[0] },
    { key: 'parent_name', label: 'Parent Name' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'priority', label: 'Priority', render: r => <Badge label={r.priority} /> },
    { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Parent Complaints</h1><p className="page-subtitle">View and resolve parent complaints and concerns</p></div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card pending-card"><div className="stat-card-title" style={{ color: '#d97706' }}>Pending</div><div className="stat-card-value">{pending}</div></div>
        <div className="stat-card inprogress-card"><div className="stat-card-title" style={{ color: '#2563eb' }}>In Progress</div><div className="stat-card-value">{inProgress}</div></div>
        <div className="stat-card resolved-card"><div className="stat-card-title" style={{ color: '#16a34a' }}>Resolved</div><div className="stat-card-value">{resolved}</div></div>
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab} ({countFor(tab)})
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card">
          <Table columns={columns} rows={filtered} emptyMessage="No complaints found." />
        </div>
      )}

      {editItem && (
        <Modal title="Update Complaint" onClose={() => setEditItem(null)}>
          <div className="form-field"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="form-field"><label>Admin Response</label>
            <textarea rows={4} value={form.adminResponse} onChange={e => setForm({...form, adminResponse: e.target.value})} placeholder="Write your response..." />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
            <button className="btn-confirm" onClick={handleSubmit}>Update</button>
          </div>
        </Modal>
      )}
    </div>
  );
}