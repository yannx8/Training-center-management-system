import { useEffect, useState } from "react";
import { Plus, Send, Eye, Trash2, Lock, Unlock } from "lucide-react";
import { hodApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, ConfirmModal, Badge, ErrorAlert } from "../../components/ui";

const EMPTY = { weekNumber:1, label:"", startDate:"", endDate:"", academicYearId:"" };

export default function HodWeeks() {
  const [weeks, setWeeks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    hodApi.getWeeks().then(r=>{ setWeeks(r.data); setLoading(false); }).catch(()=>setError("Failed to load"));
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try { await hodApi.createWeek(form); setModal(false); load(); }
    catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  async function publish(id) {
    try { await hodApi.publishWeek(id); load(); }
    catch(e) { alert(e.response?.data?.message||"Failed to publish"); }
  }

  async function unpublish(id) {
    try { await hodApi.unpublishWeek(id); load(); }
    catch(e) { alert(e.response?.data?.message||"Failed"); }
  }

  const cols = [
    { key:"weekNumber", label:"Week #" },
    { key:"label", label:"Label" },
    { key:"startDate", label:"Start", render: w => new Date(w.startDate).toLocaleDateString() },
    { key:"endDate", label:"End", render: w => new Date(w.endDate).toLocaleDateString() },
    { key:"status", label:"Status", render: w => <Badge value={w.status} /> },
    { key:"actions", label:"Actions", render: w => (
      <div className="flex gap-1">
        {w.status === "draft" ? (
          <button className="btn-primary btn-sm" onClick={() => publish(w.id)} title="Publish — trainers will see this week">
            <Send size={13} /> Publish
          </button>
        ) : (
          <button className="btn-secondary btn-sm" onClick={() => unpublish(w.id)}>
            <Unlock size={13} /> Unpublish
          </button>
        )}
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(w.id)}>
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Academic Weeks" subtitle="Create weeks and publish them so trainers can submit availability">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}><Plus size={16} /> Create Week</button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      <div className="card p-4 bg-blue-50 border border-blue-200 text-sm text-blue-700">
        <strong>Workflow:</strong> Create week → Publish it → Trainers submit availability → Generate timetable → Publish timetable
      </div>

      <Table columns={cols} data={weeks} emptyMsg="No academic weeks created yet." />

      <Modal open={modal} onClose={() => setModal(false)} title="Create Academic Week"
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Creating…":"Create"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Week Number</label><input type="number" min={1} className="input" value={form.weekNumber} onChange={e=>setForm(p=>({...p,weekNumber:+e.target.value}))} /></div>
          <div><label className="label">Label</label><input className="input" placeholder="e.g. Week 1 — Sept 2025" value={form.label} onChange={e=>setForm(p=>({...p,label:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} /></div>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await hodApi.deleteWeek(deleteId); setDeleteId(null); load(); }}
        title="Delete Week" message="All availability and timetable data for this week will be removed." />
    </div>
  );
}
