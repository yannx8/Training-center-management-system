// FILE: src/pages/admin/Rooms.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", building:"", capacity:30, roomType:"Classroom", status:"available" };

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() { adminApi.getRooms().then(r=>{ setRooms(r.data); setLoading(false); }); }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateRoom(editing.id, form);
      else         await adminApi.createRoom(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  const cols = [
    { key:"name", label:"Room Name" },
    { key:"code", label:"Code" },
    { key:"building", label:"Building", render: r => r.building||"—" },
    { key:"capacity", label:"Capacity" },
    { key:"roomType", label:"Type" },
    { key:"status", label:"Status", render: r => <Badge value={r.status} /> },
    { key:"actions", label:"", render: r => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:r.name,code:r.code,building:r.building||"",capacity:r.capacity,roomType:r.roomType,status:r.status}); setEditing(r); setModal(true); }}><Pencil size={14} /></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(r.id)}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Rooms" subtitle="Manage classrooms and labs">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}><Plus size={16} /> Add Room</button>
      </SectionHeader>
      <Table columns={cols} data={rooms} />
      <Modal open={modal} onClose={() => setModal(false)} title={editing?"Edit Room":"Add Room"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          {[["Room Name","name"],["Code","code"],["Building","building"]].map(([l,k]) => (
            <div key={k}><label className="label">{l}</label><input className="input" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:+e.target.value}))} /></div>
          <div><label className="label">Type</label><select className="select" value={form.roomType} onChange={e=>setForm(p=>({...p,roomType:e.target.value}))}>
            {["Classroom","Lab","Lecture Hall","Auditorium"].map(t=><option key={t}>{t}</option>)}
          </select></div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
            {["available","occupied","maintenance"].map(s=><option key={s}>{s}</option>)}
          </select></div>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await adminApi.deleteRoom(deleteId); setDeleteId(null); load(); }}
        title="Delete Room" message="Remove this room permanently?" />
    </div>
  );
}
