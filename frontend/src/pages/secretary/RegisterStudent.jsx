// FILE: src/pages/secretary/RegisterStudent.jsx
import { useEffect, useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { secretaryApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const EMPTY = {
  fullName:"", email:"", phone:"", dateOfBirth:"",
  programId:"", certificationId:"",
  enrollType: "program", // "program" | "certification"
  departmentId:"",
  parentFullName:"", parentEmail:"", parentPhone:"", parentRelationship:"Father",
  hasParent: false,
};

export default function RegisterStudent() {
  const [depts, setDepts]         = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    Promise.all([secretaryApi.getDepartments(), secretaryApi.getCertifications()])
      .then(([d, c]) => { setDepts(d.data); setCerts(c.data); setLoading(false); });
  }, []);

  // Load programs when department changes
  useEffect(() => {
    if (!form.departmentId) { setPrograms([]); return; }
    secretaryApi.getPrograms(form.departmentId ? { departmentId: form.departmentId } : {})
      .then(r => setPrograms(r.data));
  }, [form.departmentId]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const payload = {
        fullName: form.fullName, email: form.email, phone: form.phone, dateOfBirth: form.dateOfBirth,
        programId: form.enrollType === "program" ? form.programId || undefined : undefined,
        certificationId: form.enrollType === "certification" ? form.certificationId || undefined : undefined,
        ...(form.hasParent && form.parentEmail ? {
          parentFullName: form.parentFullName, parentEmail: form.parentEmail,
          parentPhone: form.parentPhone, parentRelationship: form.parentRelationship,
        } : {}),
      };
      const r = await secretaryApi.registerStudent(payload);
      setSuccess(`Student registered! Matricule: ${r.data.student.matricule}`);
      setForm(EMPTY); setPrograms([]);
    } catch(e) { setError(e.response?.data?.message || "Registration failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="page-title">Register Student</h1>
        <p className="page-subtitle">Create a new student account</p>
      </div>
      {error   && <ErrorAlert message={error} />}
      {success && (
        <div className="card p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <Check size={16} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Student info */}
        <div className="card p-6 space-y-4">
          <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Student Information</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" required value={form.fullName} onChange={e=>set("fullName",e.target.value)} /></div>
            <div><label className="label">Email *</label><input type="email" className="input" required value={form.email} onChange={e=>set("email",e.target.value)} /></div>
            <div><label className="label">Phone * (becomes password)</label><input className="input" required value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
            <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e=>set("dateOfBirth",e.target.value)} /></div>
          </div>
        </div>

        {/* Enrollment */}
        <div className="card p-6 space-y-4">
          <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Enrollment</p>

          {/* Toggle */}
          <div className="flex gap-4">
            {["program","certification"].map(t => (
              <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors ${form.enrollType===t?"border-primary-500 bg-primary-50 text-primary-700":"border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                <input type="radio" name="enrollType" value={t} checked={form.enrollType===t} onChange={()=>set("enrollType",t)} className="accent-primary-600" />
                {t === "program" ? "Academic Program" : "Certification"}
              </label>
            ))}
          </div>

          {form.enrollType === "program" && (
            <>
              <div>
                <label className="label">Department *</label>
                <select className="select" value={form.departmentId} onChange={e=>{set("departmentId",e.target.value); set("programId","");}}>
                  <option value="">— Select Department —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Program *</label>
                <select className="select" value={form.programId} onChange={e=>set("programId",e.target.value)} disabled={!form.departmentId}>
                  <option value="">— Select Program —</option>
                  {programs.map(p => {
                    const isFull = p.capacity && p._count?.enrollments >= p.capacity;
                    return <option key={p.id} value={p.id} disabled={isFull}>{p.name} {isFull ? "(FULL)" : p.capacity ? `(${p._count?.enrollments}/${p.capacity})` : ""}</option>;
                  })}
                </select>
                {!form.departmentId && <p className="text-xs text-gray-400 mt-1">Select a department first</p>}
              </div>
            </>
          )}

          {form.enrollType === "certification" && (
            <div>
              <label className="label">Certification *</label>
              <select className="select" value={form.certificationId} onChange={e=>set("certificationId",e.target.value)}>
                <option value="">— Select Certification —</option>
                {certs.map(c => {
                  const isFull = c.capacity && c._count?.enrollments >= c.capacity;
                  return <option key={c.id} value={c.id} disabled={isFull}>{c.name} {isFull ? "(FULL)" : c.capacity ? `(${c._count?.enrollments}/${c.capacity})` : ""}</option>;
                })}
              </select>
            </div>
          )}
        </div>

        {/* Parent — optional */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Parent / Guardian</p>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={form.hasParent} onChange={e=>set("hasParent",e.target.checked)} className="accent-primary-600" />
              This student has a parent/guardian
            </label>
          </div>

          {form.hasParent && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input className="input" value={form.parentFullName} onChange={e=>set("parentFullName",e.target.value)} /></div>
              <div><label className="label">Email *</label><input type="email" className="input" value={form.parentEmail} onChange={e=>set("parentEmail",e.target.value)} /></div>
              <div><label className="label">Phone (becomes password)</label><input className="input" value={form.parentPhone} onChange={e=>set("parentPhone",e.target.value)} /></div>
              <div>
                <label className="label">Relationship</label>
                <select className="select" value={form.parentRelationship} onChange={e=>set("parentRelationship",e.target.value)}>
                  {["Father","Mother","Guardian"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving}>
          <UserPlus size={16} /> {saving ? "Registering…" : "Register Student"}
        </button>
      </form>
    </div>
  );
}
