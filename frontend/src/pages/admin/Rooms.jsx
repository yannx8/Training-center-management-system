// FILE: src/pages/admin/Rooms.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", building:"", capacity:30, roomType:"Classroom", status:"available" };

export default function Rooms() {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() { adminApi.getRooms().then(r=>{ setRooms(r.data); setLoading(false); }); }
  useEffect(load, []);

  // FIX: Auto-fill code from name when code is empty
  function handleNameChange(name) {
    setForm(f => ({ ...f, name, code: f.code || name.replace(/\s+/g, "-").toUpperCase() }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, code: form.code || form.name.replace(/\s+/g, "-").toUpperCase() };
      if (editing) await adminApi.updateRoom(editing.id, payload);
      else         await adminApi.createRoom(payload);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  const cols = [
    { key:"name",    label:"Room" },
    { key:"code",    label:"Code" },
    { key:"building",label:"Building", render: r => r.building||"—" },
    { key:"capacity",label:"Capacity" },
    { key:"roomType",label:"Type" },
    { key:"status",  label:"Status", render: r => <Badge value={r.status} /> },
    { key:"actions", label:"", render: r => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:r.name,code:r.code,building:r.building||"",capacity:r.capacity,roomType:r.roomType,status:r.status}); setEditing(r); setModal(true); }}><Pencil size={14}/></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(r.id)}><Trash2 size={14}/></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Rooms" subtitle="Classrooms and labs">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}><Plus size={16}/> Add Room</button>
      </SectionHeader>
      <Table columns={cols} data={rooms} />
      <Modal open={modal} onClose={() => setModal(false)} title={editing?"Edit Room":"Add Room"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div>
            <label className="label">Room Name</label>
            <input className="input" value={form.name}
              onChange={e => editing ? setForm(f=>({...f,name:e.target.value})) : handleNameChange(e.target.value)} />
          </div>
          <div>
            <label className="label">Code (auto-filled from name, editable)</label>
            <input className="input" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="Leave blank to auto-generate" />
          </div>
          <div><label className="label">Building</label><input className="input" value={form.building} onChange={e=>setForm(f=>({...f,building:e.target.value}))} /></div>
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:+e.target.value}))} /></div>
          <div><label className="label">Type</label><select className="select" value={form.roomType} onChange={e=>setForm(f=>({...f,roomType:e.target.value}))}>
            {["Classroom","Lab","Lecture Hall","Auditorium"].map(t=><option key={t}>{t}</option>)}
          </select></div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
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
