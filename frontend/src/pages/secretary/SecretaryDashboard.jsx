// FILE: /frontend/src/pages/secretary/SecretaryDashboard.jsx
import { useState, useEffect } from 'react';
import { getStudents, getParents, getPrograms, registerStudent } from '../../api/secretaryApi';
import '../../styles/Secretary.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const RELATIONSHIPS = ['Father','Mother','Guardian'];

export default function SecretaryDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration wizard state
  const [step, setStep] = useState(1);
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', matricule: '', dateOfBirth: '', programId: '', email: '', phone: '' });
  const [parentForms, setParentForms] = useState([{ firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' }]);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'parents') loadParents();
  }, [activeTab]);

  async function loadPrograms() {
    try { const res = await getPrograms(); setPrograms(res.data.data); } catch {}
  }

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await getStudents({ search: searchQuery || undefined, programId: filterProgram || undefined });
      setStudents(res.data.data);
    } catch {} finally { setLoading(false); }
  }

  async function loadParents() {
    setLoading(true);
    try { const res = await getParents(); setParents(res.data.data); } catch {} finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    loadStudents();
  }

  function addParent() {
    setParentForms([...parentForms, { firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' }]);
  }

  function updateParent(index, field, value) {
    const updated = [...parentForms];
    updated[index][field] = value;
    setParentForms(updated);
  }

  async function handleRegister() {
    setRegError('');
    if (!studentForm.programId)
      return setRegError('Please select a program');
    try {
      await registerStudent({
        student: studentForm,
        parents: parentForms.filter(p => p.firstName && p.email),
        enrollmentType: 'program',
        programId: studentForm.programId,
      });
      setRegSuccess('Student registered successfully!');
      setStep(1);
      setStudentForm({ firstName: '', lastName: '', matricule: '', dateOfBirth: '', programId: '', email: '', phone: '' });
      setParentForms([{ firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' }]);
      setTimeout(() => setRegSuccess(''), 4000);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed');
    }
  }

  const step1Valid = studentForm.firstName && studentForm.lastName && studentForm.dateOfBirth && studentForm.programId;

  return (
    <div className="secretary-body">
      <div className="sec-tabs">
        <button className={`sec-tab${activeTab === 'register' ? ' active' : ''}`} onClick={() => setActiveTab('register')}>
          Register Student
        </button>
        <button className={`sec-tab${activeTab === 'students' ? ' active' : ''}`} onClick={() => setActiveTab('students')}>
          Enrolled Students {students.length > 0 ? students.length : 0}
        </button>
        <button className={`sec-tab${activeTab === 'parents' ? ' active' : ''}`} onClick={() => setActiveTab('parents')}>
          Registered Parents {parents.length > 0 ? parents.length : 0}
        </button>
      </div>

      {/* REGISTER TAB */}
      {activeTab === 'register' && (
        <div className="reg-card">
          {regSuccess && <div className="reg-success">{regSuccess}</div>}
          <div className="reg-steps">
            <div className={`reg-step${step === 1 ? ' active' : ' done'}`}>
              <span className="reg-step-icon">👤</span> Student Information
            </div>
            <div className="reg-step-line" />
            <div className={`reg-step${step === 2 ? ' active' : ''}`}>
              <span className="reg-step-icon">👥</span> Parent Information
            </div>
          </div>

          {step === 1 && (
            <>
              <h3 className="reg-section-title">Student Details</h3>
              <div className="reg-form-grid">
                <div className="form-field"><label>First Name *</label><input value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} placeholder="Enter first name" /></div>
                <div className="form-field"><label>Last Name *</label><input value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} placeholder="Enter last name" /></div>
                <div className="form-field"><label>Matricule Number *</label><input value={studentForm.matricule} onChange={e => setStudentForm({...studentForm, matricule: e.target.value})} placeholder="e.g., MAT2024001" /></div>
                <div className="form-field"><label>Date of Birth *</label><input type="date" value={studentForm.dateOfBirth} onChange={e => setStudentForm({...studentForm, dateOfBirth: e.target.value})} /></div>
              </div>
              <div className="form-field"><label>Program *</label>
                <select value={studentForm.programId} onChange={e => setStudentForm({...studentForm, programId: e.target.value})} className="program-select">
                  <option value="">Select a program</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="reg-actions">
                <button className="btn-next" disabled={!step1Valid} onClick={() => setStep(2)}>
                  Next: Add Parents →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="reg-section-title">Parent/Guardian Information</h3>
              <p className="reg-note">Or Create New Parent Accounts</p>
              {parentForms.map((p, i) => (
                <div key={i} className="parent-block">
                  <div className="parent-block-title">Parent/Guardian #{i + 1}</div>
                  <div className="reg-form-grid">
                    <div className="form-field"><label>First Name</label><input value={p.firstName} onChange={e => updateParent(i, 'firstName', e.target.value)} placeholder="Enter first name" /></div>
                    <div className="form-field"><label>Last Name</label><input value={p.lastName} onChange={e => updateParent(i, 'lastName', e.target.value)} placeholder="Enter last name" /></div>
                    <div className="form-field"><label>Email</label><input type="email" value={p.email} onChange={e => updateParent(i, 'email', e.target.value)} placeholder="parent@example.com" /></div>
                    <div className="form-field"><label>Phone</label><input value={p.phone} onChange={e => updateParent(i, 'phone', e.target.value)} placeholder="+1 (555) 000-0000" /></div>
                  </div>
                  <div className="form-field"><label>Relationship</label>
                    <select value={p.relationship} onChange={e => updateParent(i, 'relationship', e.target.value)}>
                      {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button className="btn-add-parent" onClick={addParent}>+ Add Another Parent/Guardian</button>
              {regError && <div className="form-error">{regError}</div>}
              <div className="reg-actions" style={{ justifyContent: 'space-between' }}>
                <button className="btn-back" onClick={() => setStep(1)}>Back</button>
                <button className="btn-complete" onClick={handleRegister}>Complete Registration</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="sec-content">
          <div className="sec-search-bar">
            <form onSubmit={handleSearch} style={{ flex: 1 }}>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." />
              </div>
            </form>
            <div className="form-field" style={{ minWidth: 200 }}>
              <label>Filter by Program</label>
              <select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); }}>
                <option value="">All Programs</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="sec-count">Showing <strong>{students.length}</strong> of <strong>{students.length}</strong> students</div>
          {students.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>No students found</h3>
                <p>Start by registering your first student.</p>
              </div>
            )
            : (
              <div className="table-card">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Matricule</th><th>Program</th><th>Email</th><th>Phone</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td>{s.full_name}</td>
                        <td>{s.matricule}</td>
                        <td>{s.program_name}</td>
                        <td>{s.email}</td>
                        <td>{s.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* PARENTS TAB */}
      {activeTab === 'parents' && (
        <div className="sec-content">
          {parents.length === 0
            ? <div className="empty-state"><div className="empty-icon">👥</div><h3>No parents registered</h3></div>
            : (
              <div className="table-card">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Relationship</th><th>Students</th></tr></thead>
                  <tbody>
                    {parents.map(p => (
                      <tr key={p.id}><td>{p.full_name}</td><td>{p.email}</td><td>{p.phone}</td><td>{p.relationship}</td><td>{p.student_count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}