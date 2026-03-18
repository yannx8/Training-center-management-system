// FILE: src/pages/admin/Complaints.jsx
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, Badge, ErrorAlert } from "../../components/ui";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [modal, setModal]           = useState(null); // complaint object
  const [response, setResponse]     = useState("");
  const [status, setStatus]         = useState("in_progress");
  const [saving, setSaving]         = useState(false);

  function load() {
    adminApi.getComplaints()
      .then(r => { setComplaints(r.data); setLoading(false); })
      .catch(() => setError("Failed to load complaints"));
  }
  useEffect(load, []);

  async function handleRespond() {
    setSaving(true);
    try {
      await adminApi.updateComplaint(modal.id, { status, adminResponse: response });
      setModal(null); load();
    } catch(e) { alert(e.response?.data?.message || "Failed"); } finally { setSaving(false); }
  }

  const cols = [
    { key:"parent",  label:"From", render: c => c.parent?.user?.fullName || "Unknown" },
    { key:"subject", label:"Subject" },
    { key:"priority",label:"Priority", render: c => <Badge value={c.priority} /> },
    { key:"status",  label:"Status", render: c => <Badge value={c.status} /> },
    { key:"date",    label:"Date", render: c => new Date(c.createdAt).toLocaleDateString() },
    { key:"actions", label:"", render: c => (
      <button className="btn-primary btn-sm" onClick={() => { setModal(c); setResponse(c.adminResponse||""); setStatus(c.status); }}>
        Respond
      </button>
    )},
  ];

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const pending = complaints.filter(c => c.status === "pending").length;

  return (
    <div className="space-y-4">
      <SectionHeader title="Complaints" subtitle={`${pending} pending · ${complaints.length} total`} />
      <Table columns={cols} data={complaints} emptyMsg="No complaints submitted yet." />

      <Modal open={!!modal} onClose={() => setModal(null)} title="Respond to Complaint"
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={handleRespond} disabled={saving}>{saving?"Saving…":"Send Response"}</button></>}>
        {modal && (
          <div className="space-y-4">
            <div className="card p-4 bg-gray-50">
              <p className="font-semibold text-sm text-gray-700">{modal.subject}</p>
              <p className="text-sm text-gray-500 mt-1">{modal.description}</p>
              <p className="text-xs text-gray-400 mt-2">From: {modal.parent?.user?.fullName} · {new Date(modal.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="label">Update Status</label>
              <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="label">Response</label>
              <textarea rows={4} className="input" value={response} onChange={e=>setResponse(e.target.value)} placeholder="Type your response…" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
