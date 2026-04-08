import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, ConfirmModal, Badge, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const ER = { name: '', code: '', building: '', capacity: 30, roomType: 'Classroom', status: 'available' };

export default function Rooms() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(ER);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() { adminApi.getRooms().then(r => { setRooms(r.data || []); setLoading(false); }); }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (!form.code) form.code = form.name.toUpperCase().replace(/\s+/g, '').slice(0, 10);
      if (editing) await adminApi.updateRoom(editing.id, form);
      else await adminApi.createRoom(form);
      setModal(false); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Failed')); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title={t('rooms.title', 'Classrooms')} subtitle={t('rooms.subtitle', 'Classrooms and labs')}>
        <button className="btn-primary" onClick={() => { setForm(ER); setEditing(null); setModal(true); }}><Plus size={16} /> {t('rooms.addRoom', 'Add Room')}</button>
      </SectionHeader>

      {rooms.length === 0 && <div className="card p-10 text-center text-gray-400">{t('rooms.noRooms', 'No rooms yet.')}</div>}

      <div className="space-y-2">
        {rooms.map(r => (
          <div key={r.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{r.name}</p>
              <p className="text-xs text-gray-400">{r.code} · {r.roomType} · {t('rooms.capacity', 'Capacity')}: {r.capacity}{r.building ? ` · ${r.building}` : ''}</p>
            </div>
            <Badge value={r.status} />
            <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: r.name, code: r.code, building: r.building || '', capacity: r.capacity, roomType: r.roomType, status: r.status }); setEditing(r); setModal(true); }}><Pencil size={14} /></button>
            <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(r.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('rooms.editRoom', 'Edit Room') : t('rooms.addRoom', 'Add Room')}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel', 'Cancel')}</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}</button></>}>
        <div className="space-y-4">
          <div><label className="label">{t('rooms.roomName', 'Room Name')}</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="label">{t('common.code', 'Code')} <span className="text-gray-400 text-xs">{t('rooms.codeHint', 'auto-filled, editable')}</span></label><input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('rooms.capacity', 'Capacity')}</label><input type="number" min={1} className="input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} /></div>
            <div><label className="label">{t('rooms.roomType', 'Type')}</label>
              <select className="select" value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>
                <option>Classroom</option><option>Lab</option><option>Amphitheater</option>
              </select>
            </div>
          </div>
          <div><label className="label">{t('rooms.building', 'Building')} <span className="text-gray-400 text-xs">(optional)</span></label><input className="input" value={form.building} onChange={e => setForm(p => ({ ...p, building: e.target.value }))} /></div>
          <div><label className="label">{t('common.status', 'Status')}</label>
            <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="available">Available</option><option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await adminApi.deleteRoom(deleteId); setDeleteId(null); load(); }}
        title={t('rooms.deleteRoom', 'Delete Room')} message={t('rooms.deleteConfirm', 'Remove this room permanently?')} />
    </div>
  );
}