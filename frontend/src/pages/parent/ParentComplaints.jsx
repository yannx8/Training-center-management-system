// FILE: src/pages/parent/ParentComplaints.jsx
import { useEffect, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { parentApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, Badge } from "../../components/ui";

const EMPTY = { subject: "", description: "", priority: "medium", studentId: "" };

export default function ParentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [children, setChildren]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  function load() {
    Promise.all([parentApi.getComplaints(), parentApi.getChildren()])
      .then(([c, ch]) => { setComplaints(c.data); setChildren(ch.data); setLoading(false); })
      .catch(() => setError("Failed to load data"));
  }
  useEffect(load, []);

  async function handleSubmit() {
    if (!form.subject.trim()) return alert("Subject is required");
    setSaving(true);
    try {
      await parentApi.createComplaint({
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        studentId: form.studentId || undefined,
      });
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e) { alert(e.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  }

  const pending  = complaints.filter(c => c.status === "pending");
  const resolved = complaints.filter(c => c.status === "resolved");
  const inProgress = complaints.filter(c => c.status === "in_progress");

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const ComplaintCard = ({ c }) => (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900">{c.subject}</p>
            <Badge value={c.status} />
            <Badge value={c.priority} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
      {c.adminResponse && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Administration response</p>
          <p className="text-sm text-blue-800">{c.adminResponse}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader title="Complaints" subtitle={`${pending.length} pending`}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16} /> New Complaint
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      {complaints.length === 0 && (
        <div className="card p-12 text-center">
          <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No complaints submitted yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending</h2>
          {pending.map(c => <ComplaintCard key={c.id} c={c} />)}
        </div>
      )}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">In Progress</h2>
          {inProgress.map(c => <ComplaintCard key={c.id} c={c} />)}
        </div>
      )}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Resolved</h2>
          {resolved.map(c => <ComplaintCard key={c.id} c={c} />)}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Complaint to Administration"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Submitting…" : "Submit"}</button>
          </>
        }>
        <div className="space-y-4">
          {children.length > 0 && (
            <div>
              <label className="label">Regarding Child (optional)</label>
              <select className="select" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                <option value="">— General complaint —</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.user?.fullName} ({c.matricule})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Subject *</label>
            <input className="input" placeholder="Brief title for your complaint"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Details</label>
            <textarea rows={4} className="input" placeholder="Describe your concern in detail…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
