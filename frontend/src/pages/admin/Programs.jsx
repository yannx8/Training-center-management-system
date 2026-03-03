// FILE: /frontend/src/pages/admin/Programs.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getPrograms, createProgram, updateProgram, deleteProgram, getDepartments, getCourses, createCourse, updateCourse, deleteCourse, getUsers } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function Programs() {
  const { data, loading, refetch } = useFetch(getPrograms);
  const { data: departments } = useFetch(getDepartments);
  const [showModal, setShowModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', durationYears: 1, status: 'active' });
  const [courseForm, setCourseForm] = useState({ title: '', credits: 3, trainerId: '' });
  const [error, setError] = useState('');
  const [courseError, setCourseError] = useState('');

  function openCreate() { setEditItem(null); setForm({ name: '', code: '', departmentId: '', durationYears: 1, status: 'active' }); setError(''); setShowModal(true); }
  function openEdit(p) { setEditItem(p); setForm({ name: p.name, code: p.code, departmentId: p.department_id || '', durationYears: p.duration_years, status: p.status }); setError(''); setShowModal(true); }

  async function handleSubmit() {
    try {
      if (editItem) await updateProgram(editItem.id, form);
      else await createProgram(form);
      setShowModal(false); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete program?')) return;
    await deleteProgram(id); refetch();
  }

  // Course-related functions
  const { data: courses, loading: coursesLoading, refetch: refetchCourses } = useFetch(() => 
    currentProgram ? getCourses(currentProgram.id) : Promise.resolve([])
  );

  const { data: allUsers } = useFetch(getUsers);

  // Filter users to only include trainers from the current program's department
  const departmentTrainers = allUsers?.filter(user => 
    user.department === currentProgram?.department_name && 
    user.roles?.toLowerCase().includes('trainer')
  ) || [];

  function openCourseCreate() { 
    setEditCourse(null); 
    setCourseForm({ title: '', credits: 3, trainerId: '' }); 
    setCourseError(''); 
    setShowCourseModal(true); 
  }

  function openCourseEdit(course) { 
    setEditCourse(course); 
    setCourseForm({ 
      title: course.title, 
      credits: course.credits, 
      trainerId: course.trainer_id 
    }); 
    setCourseError(''); 
    setShowCourseModal(true); 
  }

  async function handleCourseSubmit() {
    try {
      const courseData = {
        ...courseForm,
        programId: currentProgram.id
      };

      if (editCourse) {
        await updateCourse(editCourse.id, courseData);
      } else {
        await createCourse(courseData);
      }
      
      setShowCourseModal(false); 
      refetchCourses();
    } catch (err) { 
      setCourseError(err.response?.data?.message || 'Failed to save course'); 
    }
  }

  async function handleCourseDelete(id) {
    if (!confirm('Delete course?')) return;
    await deleteCourse(id); 
    refetchCourses();
  }

  const programColumns = [
    { key: 'name', label: 'Program Name' },
    { key: 'code', label: 'Code' },
    { key: 'department_name', label: 'Department' },
    { key: 'duration_years', label: 'Duration', render: r => `${r.duration_years} years` },
    { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="action-btns">
        <button className="btn-primary" onClick={() => {
          setCurrentProgram(r);
          refetchCourses();
        }}>View Courses</button>
                    <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(r.id)}>Delete</button>
      </div>
    )},
  ];

  const courseColumns = [
    { key: 'title', label: 'Course Title' },
    { key: 'credits', label: 'Credits' },
    { key: 'trainer_name', label: 'Trainer' },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="action-btns">
                    <button className="um-btn-edit" onClick={() => openCourseEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleCourseDelete(r.id)}>Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Programs</h1><p className="page-subtitle">Manage academic programs and courses</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Program</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card"><Table columns={programColumns} rows={data || []} emptyMessage="No programs found." /></div>
      )}

      {currentProgram && (
        <div className="page-section">
          <div className="section-header">
            <h2>{currentProgram.name} - Courses</h2>
            <button className="btn-primary" onClick={openCourseCreate}>+ Add Course</button>
          </div>
          
          {coursesLoading ? <div className="page-loading">Loading courses...</div> : (
            <div className="table-card">
              <Table columns={courseColumns} rows={courses || []} emptyMessage="No courses found." />
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal title={editItem ? 'Edit Program' : 'Create New Program'} onClose={() => setShowModal(false)}>
          <div className="form-field"><label>Program Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Bachelor of Computer Science" /></div>
          <div className="form-field"><label>Department *</label>
            <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
              <option value="">Select Department</option>
              {(departments || []).map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field"><label>Duration (years)</label><input type="number" min="1" value={form.durationYears} onChange={e => setForm({...form, durationYears: e.target.value})} /></div>
          <div className="form-field"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-confirm" onClick={handleSubmit}>{editItem ? 'Save' : 'Create'}</button>
          </div>
        </Modal>
      )}

      {showCourseModal && (
        <Modal title={editCourse ? 'Edit Course' : 'Create New Course'} onClose={() => setShowCourseModal(false)}>
          <div className="form-field"><label>Course Title *</label><input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} placeholder="e.g., Introduction to Programming" /></div>
          <div className="form-field"><label>Credits *</label><input type="number" min="1" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: e.target.value})} /></div>
          <div className="form-field"><label>Trainer *</label>
            <select value={courseForm.trainerId} onChange={e => setCourseForm({...courseForm, trainerId: e.target.value})}>
              <option value="">Select Trainer</option>
              {departmentTrainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>{trainer.full_name}</option>
              ))}
            </select>
          </div>
          {courseError && <div className="form-error">{courseError}</div>}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowCourseModal(false)}>Cancel</button>
            <button className="btn-confirm" onClick={handleCourseSubmit}>{editCourse ? 'Save' : 'Create'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}