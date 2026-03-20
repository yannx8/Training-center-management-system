import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle } from "lucide-react";
import { trainerApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, Badge } from "../../components/ui";

export default function TrainerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [modal, setModal]           = useState(null);
  const [response, setResponse]     = useState("");
  const [saving, setSaving]         = useState(false);

  function load() {
    trainerApi.getComplaints()
      .then(r => { setComplaints(r.data); setLoading(false); })
      .catch(() => setError("Failed to load complaints"));
  }
  useEffect(load, []);

  async function handleRespond() {
    setSaving(true);
    try {
      await trainerApi.respondComplaint(modal.id, { trainerResponse: response, status: "reviewed" });
      setModal(null);
      load();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  }

  const pending  = complaints.filter(c => c.status === "pending");
  const reviewed = complaints.filter(c => c.status === "reviewed");

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const ComplaintCard = ({ c }) => (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{c.subject}</p>
            <Badge value={c.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            From: <span className="font-medium">{c.student?.user?.fullName || "Unknown"}</span>
            {" "}({c.student?.matricule}) · {c.course?.name || c.certification?.name || "General"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleString()}</p>
        </div>
        {c.status === "pending" && (
          <button className="btn-primary btn-sm flex-shrink-0"
            onClick={() => { setModal(c); setResponse(""); }}>
            Respond
          </button>
        )}
      </div>
      {c.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">{c.description}</p>
      )}
      {c.trainerResponse && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><CheckCircle size={12} /> Your response</p>
          <p className="text-sm text-green-800">{c.trainerResponse}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader title="Mark Complaints" subtitle={`${pending.length} pending · ${reviewed.length} reviewed`} />

      {complaints.length === 0 && (
        <div className="card p-12 text-center">
          <MessageCircle size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No complaints submitted yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending ({pending.length})</h2>
          {pending.map(c => <ComplaintCard key={c.id} c={c} />)}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Reviewed ({reviewed.length})</h2>
          {reviewed.map(c => <ComplaintCard key={c.id} c={c} />)}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title="Respond to Complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleRespond} disabled={saving || !response.trim()}>
              {saving ? "Sending…" : "Send Response"}
            </button>
          </>
        }>
        {modal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
              <p className="font-semibold text-sm text-gray-800">{modal.subject}</p>
              <p className="text-xs text-gray-500">From {modal.student?.user?.fullName} · {modal.course?.name || modal.certification?.name}</p>
              {modal.description && <p className="text-sm text-gray-600 pt-1">{modal.description}</p>}
            </div>
            <div>
              <label className="label">Your Response *</label>
              <textarea rows={4} className="input" placeholder="Explain your grading decision…"
                value={response} onChange={e => setResponse(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
