// FILE: src/pages/admin/AcademicYears.jsx
import { useEffect, useState } from "react";
import { Plus, CalendarDays, CheckCircle, Circle } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, ErrorAlert, SectionHeader, Badge } from "../../components/ui";

const EMPTY = { name: "", startDate: "", endDate: "", isActive: false, programId: "", certificationId: "" };

export default function AcademicYears() {
  const [years, setYears]       = useState([]);
  const [programs, setPrograms] = useState([]);
  const [certs, setCerts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  function load() {
    Promise.all([adminApi.getAcademicYears(), adminApi.getPrograms(), adminApi.getCertifications()])
      .then(([y, p, c]) => {
        setYears(y.data);
        setPrograms(p.data);
        setCerts(c.data);
        setLoading(false);
      })
      .catch(() => setError("Failed to load academic years"));
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.createAcademicYear(form);
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (e) { alert(e.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  const cols = [
    { key: "name",      label: "Year",      render: y => <span className="font-semibold text-gray-900">{y.name}</span> },
    { key: "scope",     label: "Scope",     render: y => y.program?.name || y.certification?.name || <span className="text-gray-400">Global</span> },
    { key: "startDate", label: "Start",     render: y => new Date(y.startDate).toLocaleDateString() },
    { key: "endDate",   label: "End",       render: y => new Date(y.endDate).toLocaleDateString() },
    { key: "isActive",  label: "Status",    render: y => y.isActive
      ? <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle size={12} /> Active</span>
      : <span className="badge-gray flex items-center gap-1 w-fit"><Circle size={12} /> Inactive</span>
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Academic Years" subtitle={`${years.length} academic years configured`}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16} /> Add Academic Year
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: years.length, color: "text-primary-600" },
          { label: "Active", value: years.filter(y => y.isActive).length, color: "text-green-600" },
          { label: "For Programs", value: years.filter(y => y.programId).length, color: "text-blue-600" },
          { label: "For Certifications", value: years.filter(y => y.certificationId).length, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Table columns={cols} data={years} emptyMsg="No academic years yet. Create your first one." />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Academic Year"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Year Name *</label>
            <input className="input" placeholder="e.g. 2025-2026" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className="input" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Linked to Program (optional)</label>
            <select className="select" value={form.programId}
              onChange={e => setForm(f => ({ ...f, programId: e.target.value, certificationId: "" }))}>
              <option value="">— Not linked to a program —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Linked to Certification (optional)</label>
            <select className="select" value={form.certificationId}
              onChange={e => setForm(f => ({ ...f, certificationId: e.target.value, programId: "" }))}>
              <option value="">— Not linked to a certification —</option>
              {certs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="accent-primary-600 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Set as active academic year</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
