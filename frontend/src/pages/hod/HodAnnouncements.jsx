import { useEffect, useState } from "react";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { hodApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

export default function HodAnnouncements() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ title:"", body:"", targetRole:"all" });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() { hodApi.getAnnouncements().then(r=>{ setItems(r.data); setLoading(false); }); }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try { await hodApi.createAnnouncement(form); setModal(false); load(); }
    catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  const TARGET_LABELS = { all:"Everyone", trainer:"Trainers only", student:"Students only", parent:"Parents only" };

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Announcements" subtitle="Publish messages to your department stakeholders">
        <button className="btn-primary" onClick={() => { setForm({title:"",body:"",targetRole:"all"}); setModal(true); }}>
          <Plus size={16} /> New Announcement
        </button>
      </SectionHeader>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="card p-10 text-center text-gray-400"><Megaphone size={32} className="mx-auto mb-3 opacity-30" /><p>No announcements yet.</p></div>
        )}
        {items.map(a => (
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <Badge value={a.targetRole || "all"} label={TARGET_LABELS[a.targetRole] || a.targetRole} />
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">By {a.creator?.fullName} · {new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <button className="btn-ghost btn-icon text-red-500 hover:bg-red-50 flex-shrink-0" onClick={() => setDeleteId(a.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Announcement"
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Publishing…":"Publish"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} /></div>
          <div><label className="label">Message</label><textarea rows={5} className="input" value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} /></div>
          <div>
            <label className="label">Targeted Audience</label>
            <select className="select" value={form.targetRole} onChange={e=>setForm(p=>({...p,targetRole:e.target.value}))}>
              <option value="all">Everyone</option>
              <option value="trainer">Trainers only</option>
              <option value="student">Students only</option>
              <option value="parent">Parents only</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await hodApi.deleteAnnouncement(deleteId); setDeleteId(null); load(); }}
        title="Delete Announcement" message="Remove this announcement?" />
    </div>
  );
}
