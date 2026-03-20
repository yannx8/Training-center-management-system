import { useEffect, useState } from 'react';
import { UserPlus, Users, Trash2, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { secretaryApi } from '../../api';
import { PageLoader } from '../../components/ui';

const EMPTY_PARENT = { firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' };
const STEP1 = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  enrollType: 'program',
  departmentId: '', programId: '', levelId: '',
  certificationId: '',
};

export default function RegisterStudent() {
  const [step, setStep]       = useState(1);
  const [depts, setDepts]     = useState([]);
  const [programs, setPrograms] = useState([]);
  const [certs, setCerts]     = useState([]);
  const [levels, setLevels]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm]       = useState(STEP1);
  const [parents, setParents] = useState([]);   // starts empty = no parent
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([secretaryApi.getDepartments(), secretaryApi.getCertifications()])
      .then(([d, c]) => { setDepts(d.data); setCerts(c.data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!form.departmentId) { setPrograms([]); setLevels([]); return; }
    secretaryApi.getPrograms({ departmentId: form.departmentId })
      .then(r => { setPrograms(r.data); setLevels([]); setF('programId', ''); setF('levelId', ''); });
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.programId) { setLevels([]); return; }
    const prog = programs.find(p => String(p.id) === String(form.programId));
    setLevels(prog?.levels || []);
    setF('levelId', '');
  }, [form.programId]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function goToStep2(e) {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() || !form.email.trim() || !form.phone.trim())
      return setError('First name, email, and phone are required.');
    if (form.enrollType === 'program' && !form.programId)
      return setError('Please select a program.');
    if (form.enrollType === 'program' && levels.length > 0 && !form.levelId)
      return setError('Please select a level for this program.');
    if (form.enrollType === 'certification' && !form.certificationId)
      return setError('Please select a certification.');
    setStep(2);
  }

  async function handleSubmit() {
    setError(''); setSaving(true);
    try {
      const validParents = parents.filter(p => p.email.trim());
      const payload = {
        fullName:        `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email:           form.email,
        phone:           form.phone,
        dateOfBirth:     form.dateOfBirth || undefined,
        programId:       form.enrollType === 'program' ? form.programId : undefined,
        levelId:         form.enrollType === 'program' ? form.levelId  : undefined,
        certificationId: form.enrollType === 'certification' ? form.certificationId : undefined,
        parents:         validParents.map(p => ({
          fullName:     `${p.firstName} ${p.lastName}`.trim() || 'Parent',
          email:        p.email,
          phone:        p.phone,
          relationship: p.relationship,
        })),
      };
      const r = await secretaryApi.registerStudent(payload);
      setSuccess(`Registered! Matricule: ${r.data.matricule}`);
      setForm(STEP1); setParents([]); setStep(1);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed.');
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader/>;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="page-title">Register Student</h1>
        <p className="page-subtitle">Create a new student account</p>
      </div>

      {success && (
        <div className="card p-4 bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle size={16}/> {success}
        </div>
      )}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Step bar */}
      <div className="card p-4 flex items-center gap-3">
        <StepDot n={1} active={step === 1} done={step > 1} label="Student Info"/>
        <div className="flex-1 h-px bg-gray-200">
          <div className={`h-full bg-primary-500 transition-all duration-300 ${step > 1 ? 'w-full' : 'w-0'}`}/>
        </div>
        <StepDot n={2} active={step === 2} done={false} label="Parent Info (optional)"/>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <form onSubmit={goToStep2} className="space-y-5">
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-600">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input className="input" placeholder="Enter first name" value={form.firstName} onChange={e => setF('firstName', e.target.value)} required/>
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" placeholder="Enter last name" value={form.lastName} onChange={e => setF('lastName', e.target.value)}/>
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="student@example.com" value={form.email} onChange={e => setF('email', e.target.value)} required/>
              </div>
              <div>
                <label className="label">Phone * <span className="text-gray-400 font-normal">(becomes initial password)</span></label>
                <input className="input" placeholder="e.g. 677000000" value={form.phone} onChange={e => setF('phone', e.target.value)} required/>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input" value={form.dateOfBirth} onChange={e => setF('dateOfBirth', e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-600">Enrollment</p>
            <div className="flex gap-3">
              {['program', 'certification'].map(t => (
                <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all ${form.enrollType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <input type="radio" name="enrollType" checked={form.enrollType === t} onChange={() => setF('enrollType', t)} className="sr-only"/>
                  {t === 'program' ? 'Academic Program' : 'Certification'}
                </label>
              ))}
            </div>

            {form.enrollType === 'program' && (
              <>
                <div>
                  <label className="label">Department *</label>
                  <select className="select" value={form.departmentId} onChange={e => { setF('departmentId', e.target.value); setF('programId', ''); }}>
                    <option value="">— Select department —</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Program *</label>
                  <select className="select" value={form.programId} onChange={e => setF('programId', e.target.value)} disabled={!form.departmentId}>
                    <option value="">— Select program —</option>
                    {programs.map(p => {
                      const full = p.capacity && (p._count?.enrollments || 0) >= p.capacity;
                      return <option key={p.id} value={p.id} disabled={full}>{p.name}{full ? ' (FULL)' : p.capacity ? ` · ${p._count?.enrollments}/${p.capacity} enrolled` : ''}</option>;
                    })}
                  </select>
                  {!form.departmentId && <p className="text-xs text-gray-400 mt-1">Select a department first</p>}
                </div>
                {levels.length > 0 && (
                  <div>
                    <label className="label">Level / Year *</label>
                    <select className="select" value={form.levelId} onChange={e => setF('levelId', e.target.value)}>
                      <option value="">— Select level —</option>
                      {levels.map(lv => <option key={lv.id} value={lv.id}>{lv.name}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            {form.enrollType === 'certification' && (
              <div>
                <label className="label">Certification *</label>
                <select className="select" value={form.certificationId} onChange={e => setF('certificationId', e.target.value)}>
                  <option value="">— Select certification —</option>
                  {certs.map(c => {
                    const full = c.capacity && (c._count?.enrollments || 0) >= c.capacity;
                    return <option key={c.id} value={c.id} disabled={full}>{c.name}{full ? ' (FULL)' : c.capacity ? ` · ${c._count?.enrollments}/${c.capacity} enrolled` : ''}</option>;
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-6">
              Next <ChevronRight size={14}/>
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            {/* Clear header stating parents are optional */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">Parent / Guardian Information</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  This is <strong>optional</strong>. You can register the student without a parent and add one later.
                </p>
              </div>
            </div>

            {parents.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center space-y-3">
                <p className="text-sm text-gray-400">No parents added. The student will have no linked guardian.</p>
                <button type="button" className="btn-secondary"
                  onClick={() => setParents([{ ...EMPTY_PARENT }])}>
                  <Users size={14}/> Add a Parent/Guardian
                </button>
              </div>
            )}

            {parents.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Parent/Guardian #{i + 1}</p>
                  <button type="button" className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setParents(ps => ps.filter((_, idx) => idx !== i))}>
                    <Trash2 size={14}/>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">First Name</label><input className="input" placeholder="First name" value={p.firstName} onChange={e => setParents(ps => ps.map((x,idx) => idx===i ? {...x,firstName:e.target.value} : x))}  /></div>
                  <div><label className="label">Last Name</label><input className="input" placeholder="Last name" value={p.lastName} onChange={e => setParents(ps => ps.map((x,idx) => idx===i ? {...x,lastName:e.target.value} : x))}  /></div>
                  <div><label className="label">Email *</label><input type="email" className="input" placeholder="parent@example.com" value={p.email} onChange={e => setParents(ps => ps.map((x,idx) => idx===i ? {...x,email:e.target.value} : x))} /></div>
                  <div><label className="label">Phone</label><input className="input" placeholder="e.g. 677000000" value={p.phone} onChange={e => setParents(ps => ps.map((x,idx) => idx===i ? {...x,phone:e.target.value} : x))} /></div>
                  <div className="col-span-2">
                    <label className="label">Relationship</label>
                    <select className="select" value={p.relationship} onChange={e => setParents(ps => ps.map((x,idx) => idx===i ? {...x,relationship:e.target.value} : x))}>
                      {['Father','Mother','Guardian'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {parents.length > 0 && (
              <button type="button"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setParents(ps => [...ps, { ...EMPTY_PARENT }])}>
                <Users size={14}/> Add another parent/guardian
              </button>
            )}
          </div>

          {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="flex items-center justify-between">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={14}/> Back
            </button>
            <button type="button" className="btn-success px-6" onClick={handleSubmit} disabled={saving}>
              <UserPlus size={14}/>
              {saving ? 'Registering…' : parents.length === 0 ? 'Register Without Parent' : 'Complete Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({ n, active, done, label }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {done ? <CheckCircle size={14}/> : n}
      </div>
      <span className={`text-sm font-medium whitespace-nowrap ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
