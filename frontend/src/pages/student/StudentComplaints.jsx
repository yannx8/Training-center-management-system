import { useEffect, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { studentApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, Badge } from "../../components/ui";

const EMPTY = { subject: "", description: "", courseId: "", certificationId: "" };

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [grades, setGrades]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  function load() {
    Promise.all([studentApi.getComplaints(), studentApi.getGrades()])
      .then(([c, g]) => { setComplaints(c.data); setGrades(g.data); setLoading(false); })
      .catch(() => setError("Failed to load data"));
  }
  useEffect(load, []);

  async function handleSubmit() {
    if (!form.subject.trim()) return alert("Subject is required");
    setSaving(true);
    try {
      await studentApi.createComplaint({
        subject: form.subject,
        description: form.description,
        courseId: form.courseId || undefined,
        certificationId: form.certificationId || undefined,
      });
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e) { alert(e.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  }

  // Build subject options from grades (only graded subjects)
  const subjectOptions = grades.map(g => ({
    id: g.courseId ? `c-${g.courseId}` : `cert-${g.certificationId}`,
    name: g.course?.name || g.certification?.name || "Unknown",
    courseId: g.courseId,
    certificationId: g.certificationId,
  }));

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Grade Complaints" subtitle="Dispute a grade or request a review">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16} /> New Complaint
        </button>
      </SectionHeader>

      {complaints.length === 0 && (
        <div className="card p-12 text-center">
          <MessageCircle size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No complaints submitted yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900">{c.subject}</p>
                  <Badge value={c.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {c.course?.name || c.certification?.name || "General"} · {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
            {c.trainerResponse && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Trainer's response</p>
                <p className="text-sm text-blue-800">{c.trainerResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Grade Complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Submitting…" : "Submit"}</button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Subject (Course / Certification)</label>
            <select className="select" value={form.courseId || form.certificationId}
              onChange={e => {
                const opt = subjectOptions.find(s => s.id === e.target.value);
                setForm(f => ({ ...f, courseId: opt?.courseId || "", certificationId: opt?.certificationId || "" }));
              }}>
              <option value="">— Select a subject —</option>
              {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject / Title *</label>
            <input className="input" placeholder="Brief description of your complaint"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Details</label>
            <textarea rows={4} className="input"
              placeholder="Explain why you believe the grade is incorrect…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
