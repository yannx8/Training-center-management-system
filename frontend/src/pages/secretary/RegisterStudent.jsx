import { useEffect, useState } from 'react';
import { UserPlus, Users, Trash2, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { secretaryApi } from '../../api';
import { PageLoader } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY_PARENT = { firstName:'', lastName:'', email:'', phone:'', relationship:'Father' };
const STEP1 = { firstName:'', lastName:'', email:'', phone:'', dateOfBirth:'', enrollType:'program', departmentId:'', programId:'', levelId:'', certificationId:'' };

function StepDot({ n, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
        done   ? 'bg-primary-600 border-primary-600 text-white' :
        active ? 'border-primary-600 text-primary-600 bg-white' :
                 'border-gray-300 text-gray-400 bg-white'
      }`}>
        {done ? <CheckCircle size={14}/> : n}
      </div>
      <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
    </div>
  );
}

export default function RegisterStudent() {
  const { t } = useTranslation();
  const [step, setStep]       = useState(1);
  const [depts, setDepts]     = useState([]);
  const [programs, setPrograms] = useState([]);
  const [certs, setCerts]     = useState([]);
  const [levels, setLevels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(STEP1);
  const [parents, setParents] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([secretaryApi.getDepartments(), secretaryApi.getCertifications()])
      .then(([d, c]) => { setDepts(d.data||[]); setCerts(c.data||[]); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!form.departmentId) { setPrograms([]); setLevels([]); return; }
    secretaryApi.getPrograms({ departmentId: form.departmentId })
      .then(r => { setPrograms(r.data||[]); setLevels([]); setF('programId',''); setF('levelId',''); });
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.programId) { setLevels([]); return; }
    const prog = programs.find(p => String(p.id) === String(form.programId));
    setLevels(prog?.levels || []);
    setF('levelId', '');
  }, [form.programId]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function goToStep2(e) {
    e.preventDefault(); setError('');
    if (!form.firstName.trim() || !form.email.trim() || !form.phone.trim())
      return setError(t('secretary.firstName','First name') + ', email, ' + t('secretary.phone','phone') + ' are required.');
    if (form.enrollType === 'program' && !form.programId)
      return setError(t('secretary.selectProgram','Please select a program.'));
    if (form.enrollType === 'program' && levels.length > 0 && !form.levelId)
      return setError(t('secretary.selectLevel','Please select a level.'));
    if (form.enrollType === 'certification' && !form.certificationId)
      return setError(t('secretary.selectCert','Please select a certification.'));
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
        programId:       form.enrollType === 'program'        ? form.programId        : undefined,
        levelId:         form.enrollType === 'program'        ? form.levelId          : undefined,
        certificationId: form.enrollType === 'certification'  ? form.certificationId  : undefined,
        parents: validParents.map(p => ({
          fullName:     `${p.firstName} ${p.lastName}`.trim() || 'Parent',
          email:        p.email,
          phone:        p.phone,
          relationship: p.relationship,
        })),
      };
      const r = await secretaryApi.registerStudent(payload);
      setSuccess(t('secretary.registeredSuccess','Registered! Matricule: {{matricule}}', { matricule: r.data.matricule }));
      setForm(STEP1); setParents([]); setStep(1);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed.');
    } finally { setSaving(false); }
  }

  function addParent() { setParents(p => [...p, { ...EMPTY_PARENT }]); }
  function removeParent(i) { setParents(p => p.filter((_,j) => j !== i)); }
  function setParentF(i, k, v) { setParents(p => p.map((x,j) => j===i ? {...x,[k]:v} : x)); }

  if (loading) return <PageLoader/>;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="page-title">{t('secretary.registerTitle','Register Student')}</h1>
        <p className="page-subtitle">{t('secretary.registerSubtitle','Create a new student account')}</p>
      </div>

      {success && (
        <div className="card p-4 bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle size={16}/> {success}
        </div>
      )}
      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {/* Step progress bar */}
      <div className="card p-4 flex items-center gap-3">
        <StepDot n={1} active={step===1} done={step>1} label={t('secretary.stepStudentInfo','Student Info')}/>
        <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full bg-primary-500 transition-all duration-300 ${step>1?'w-full':'w-0'}`}/>
        </div>
        <StepDot n={2} active={step===2} done={false} label={t('secretary.stepParentInfo','Parent Info (optional)')}/>
      </div>

      {/* ── STEP 1: Student info ──────────────────────────── */}
      {step === 1 && (
        <form onSubmit={goToStep2} className="space-y-4">
          <div className="card p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-700">{t('secretary.personalInfo','Personal Information')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('secretary.firstName','First Name *')}</label>
                <input className="input" placeholder={t('secretary.firstNamePlaceholder','Enter first name')} value={form.firstName} onChange={e=>setF('firstName',e.target.value)} required/>
              </div>
              <div>
                <label className="label">{t('secretary.lastName','Last Name')}</label>
                <input className="input" placeholder={t('secretary.lastNamePlaceholder','Enter last name')} value={form.lastName} onChange={e=>setF('lastName',e.target.value)}/>
              </div>
              <div>
                <label className="label">{t('secretary.email','Email *')}</label>
                <input type="email" className="input" placeholder={t('secretary.emailPlaceholder','student@example.com')} value={form.email} onChange={e=>setF('email',e.target.value)} required/>
              </div>
              <div>
                <label className="label">{t('secretary.phone','Phone *')} <span className="text-gray-400 font-normal text-xs">{t('secretary.phoneHint','(becomes initial password)')}</span></label>
                <input className="input" placeholder={t('secretary.phonePlaceholder','e.g. 677000000')} value={form.phone} onChange={e=>setF('phone',e.target.value)} required/>
              </div>
              <div>
                <label className="label">{t('secretary.dateOfBirth','Date of Birth')}</label>
                <input type="date" className="input" value={form.dateOfBirth} onChange={e=>setF('dateOfBirth',e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Enrollment type */}
          <div className="card p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-700">{t('secretary.enrollment','Enrollment')}</p>
            <div className="flex gap-3 flex-wrap">
              {['program','certification'].map(type => (
                <label key={type} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all flex-1 min-w-[130px] ${form.enrollType===type?'border-primary-500 bg-primary-50 text-primary-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <input type="radio" name="enrollType" checked={form.enrollType===type} onChange={()=>setF('enrollType',type)} className="sr-only"/>
                  {type === 'program' ? t('secretary.academicProgram','Academic Program') : t('secretary.certification','Certification')}
                </label>
              ))}
            </div>

            {form.enrollType === 'program' && (
              <div className="space-y-3">
                <div>
                  <label className="label">{t('secretary.department','Department *')}</label>
                  <select className="select" value={form.departmentId} onChange={e=>{setF('departmentId',e.target.value);setF('programId','');}}>
                    <option value="">{t('secretary.selectDept','— Select department —')}</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('secretary.program','Program *')}</label>
                  <select className="select" value={form.programId} onChange={e=>setF('programId',e.target.value)} disabled={!form.departmentId}>
                    <option value="">{form.departmentId ? t('secretary.selectProgram','— Select program —') : t('secretary.selectDeptFirst','Select a department first')}</option>
                    {programs.map(p => {
                      const full = p.capacity && (p._count?.enrollments||0) >= p.capacity;
                      return <option key={p.id} value={p.id} disabled={full}>{p.name}{full ? ` ${t('secretary.full','(FULL)')}` : p.capacity ? ` · ${p._count?.enrollments}/${p.capacity}` : ''}</option>;
                    })}
                  </select>
                </div>
                {levels.length > 0 && (
                  <div>
                    <label className="label">{t('secretary.level','Level / Year *')}</label>
                    <select className="select" value={form.levelId} onChange={e=>setF('levelId',e.target.value)}>
                      <option value="">{t('secretary.selectLevel','— Select level —')}</option>
                      {levels.map(lv => <option key={lv.id} value={lv.id}>{lv.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {form.enrollType === 'certification' && (
              <div>
                <label className="label">{t('secretary.certification','Certification *')}</label>
                <select className="select" value={form.certificationId} onChange={e=>setF('certificationId',e.target.value)}>
                  <option value="">{t('secretary.selectCert','— Select certification —')}</option>
                  {certs.map(c => {
                    const full = c.capacity && (c._count?.enrollments||0) >= c.capacity;
                    return <option key={c.id} value={c.id} disabled={full}>{c.name}{full ? ` ${t('secretary.full','(FULL)')}` : ''}</option>;
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-6">
              {t('common.create','Next')} <ChevronRight size={14}/>
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Parent info ───────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{t('secretary.parentInfo','Parent / Guardian Information')}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t('secretary.parentOptional','Optional. You can register the student without a parent and add one later.')}</p>
            </div>

            {parents.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center space-y-3">
                <Users size={28} className="mx-auto text-gray-300"/>
                <p className="text-sm text-gray-400">{t('secretary.noParentAdded','No parents added.')}</p>
                <button type="button" className="btn-secondary" onClick={addParent}>
                  <UserPlus size={15}/> {t('secretary.addParent','Add a Parent/Guardian')}
                </button>
              </div>
            )}

            {parents.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{t('roles.parent','Parent')} {i+1}</p>
                  <button type="button" className="btn-ghost btn-sm btn-icon text-red-500" onClick={()=>removeParent(i)}><Trash2 size={14}/></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('secretary.parentFirstName','First Name')}</label>
                    <input className="input" value={p.firstName} onChange={e=>setParentF(i,'firstName',e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">{t('secretary.parentLastName','Last Name')}</label>
                    <input className="input" value={p.lastName} onChange={e=>setParentF(i,'lastName',e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">{t('secretary.parentEmail','Email *')}</label>
                    <input type="email" className="input" placeholder={t('secretary.parentEmailPlaceholder','parent@example.com')} value={p.email} onChange={e=>setParentF(i,'email',e.target.value)} required/>
                  </div>
                  <div>
                    <label className="label">{t('secretary.parentPhone','Phone')}</label>
                    <input className="input" placeholder={t('secretary.parentPhonePlaceholder','e.g. 677000000')} value={p.phone} onChange={e=>setParentF(i,'phone',e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">{t('secretary.relationship','Relationship')}</label>
                    <select className="select" value={p.relationship} onChange={e=>setParentF(i,'relationship',e.target.value)}>
                      <option value="Father">{t('secretary.relationFather','Father')}</option>
                      <option value="Mother">{t('secretary.relationMother','Mother')}</option>
                      <option value="Guardian">{t('secretary.relationGuardian','Guardian')}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {parents.length > 0 && (
              <button type="button" className="btn-ghost w-full justify-center" onClick={addParent}>
                <UserPlus size={15}/> {t('secretary.addAnotherParent','Add another parent/guardian')}
              </button>
            )}
          </div>

          <div className="flex gap-3 justify-between">
            <button type="button" className="btn-secondary" onClick={()=>setStep(1)}>
              <ArrowLeft size={14}/> {t('common.back','Back')}
            </button>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('secretary.registering','Registering…') : t('secretary.registerWithoutParent','Register Without Parent')}
              </button>
              <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('secretary.registering','Registering…') : t('secretary.completeRegistration','Complete Registration')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
