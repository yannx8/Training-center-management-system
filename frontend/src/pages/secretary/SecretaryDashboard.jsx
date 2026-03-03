// FILE: /frontend/src/pages/secretary/SecretaryDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { secretaryApi } from '../../api/secretaryApi';
import StatCard from '../../components/StatCard';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Secretary.css';

export default function SecretaryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalParents: 0,
    activePrograms: 0,
    todayRegistrations: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Registration form state
  const [formData, setFormData] = useState({
    student: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      matricule: ''
    },
    parents: [{ firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' }],
    enrollmentType: 'program',
    programId: '',
    certificationId: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, parentsRes, programsRes, certsRes] = await Promise.all([
        secretaryApi.getStudents(),
        secretaryApi.getParents(),
        secretaryApi.getPrograms(),
        secretaryApi.getCertifications()
      ]);

      const students = studentsRes.data.data || [];
      const parents = parentsRes.data.data || [];
      const progs = programsRes.data.data || [];
      const certs = certificationsRes.data.data || [];

      setStats({
        totalStudents: students.length,
        totalParents: parents.length,
        activePrograms: progs.filter(p => p.status === 'active').length,
        todayRegistrations: students.filter(s => {
          const created = new Date(s.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length
      });

      setRecentStudents(students.slice(0, 5));
      setPrograms(progs);
      setCertifications(certs);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      await secretaryApi.registerStudent(formData);
      setShowRegisterModal(false);
      setFormData({
        student: { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', matricule: '' },
        parents: [{ firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' }],
        enrollmentType: 'program',
        programId: '',
        certificationId: ''
      });
      loadDashboardData();
      alert('Student registered successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const addParent = () => {
    setFormData({
      ...formData,
      parents: [...formData.parents, { firstName: '', lastName: '', email: '', phone: '', relationship: 'Mother' }]
    });
  };

  const removeParent = (index) => {
    const newParents = formData.parents.filter((_, i) => i !== index);
    setFormData({ ...formData, parents: newParents });
  };

  const updateParent = (index, field, value) => {
    const newParents = [...formData.parents];
    newParents[index][field] = value;
    setFormData({ ...formData, parents: newParents });
  };

  const studentColumns = [
    { key: 'matricule', header: 'Matricule' },
    { key: 'full_name', header: 'Name' },
    { key: 'program_name', header: 'Program' },
    { key: 'email', header: 'Email' },
    { 
      key: 'created_at', 
      header: 'Registered',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="secretary-dashboard">
      <div className="dashboard-header">
        <h1>Secretary Dashboard</h1>
        <p>Welcome, {user?.fullName}</p>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon="👨‍🎓" 
          color="#3498db"
        />
        <StatCard 
          title="Total Parents" 
          value={stats.totalParents} 
          icon="👨‍👩‍👧" 
          color="#2ecc71"
        />
        <StatCard 
          title="Active Programs" 
          value={stats.activePrograms} 
          icon="📚" 
          color="#9b59b6"
        />
        <StatCard 
          title="Today's Registrations" 
          value={stats.todayRegistrations} 
          icon="✅" 
          color="#e67e22"
        />
      </div>

      <div className="dashboard-actions">
        <Button variant="primary" onClick={() => setShowRegisterModal(true)}>
          + Register New Student
        </Button>
      </div>

      <div className="recent-section">
        <h2>Recent Registrations</h2>
        <Table 
          columns={studentColumns}
          data={recentStudents}
          emptyMessage="No students registered yet"
        />
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New Student"
        size="large"
      >
        <form onSubmit={handleRegisterStudent} className="registration-form">
          <div className="form-section">
            <h3>Student Information</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="First Name *"
                value={formData.student.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, firstName: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Last Name *"
                value={formData.student.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, lastName: e.target.value }
                })}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.student.email}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, email: e.target.value }
                })}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.student.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, phone: e.target.value }
                })}
              />
            </div>
            <div className="form-row">
              <input
                type="date"
                placeholder="Date of Birth *"
                value={formData.student.dateOfBirth}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, dateOfBirth: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Matricule (auto-generated if empty)"
                value={formData.student.matricule}
                onChange={(e) => setFormData({
                  ...formData,
                  student: { ...formData.student, matricule: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Enrollment</h3>
            <div className="form-row">
              <select
                value={formData.enrollmentType}
                onChange={(e) => setFormData({ ...formData, enrollmentType: e.target.value })}
              >
                <option value="program">Academic Program</option>
                <option value="certification">Certification</option>
              </select>
              
              {formData.enrollmentType === 'program' ? (
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                  required
                >
                  <option value="">Select Program *</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={formData.certificationId}
                  onChange={(e) => setFormData({ ...formData, certificationId: e.target.value })}
                  required
                >
                  <option value="">Select Certification *</option>
                  {certifications.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Parent/Guardian Information</h3>
              <Button type="button" variant="secondary" onClick={addParent}>
                + Add Parent
              </Button>
            </div>
            
            {formData.parents.map((parent, index) => (
              <div key={index} className="parent-form">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={parent.firstName}
                    onChange={(e) => updateParent(index, 'firstName', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={parent.lastName}
                    onChange={(e) => updateParent(index, 'lastName', e.target.value)}
                  />
                  <select
                    value={parent.relationship}
                    onChange={(e) => updateParent(index, 'relationship', e.target.value)}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                  {formData.parents.length > 1 && (
                    <Button type="button" variant="danger" onClick={() => removeParent(index)}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="form-row">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={parent.email}
                    onChange={(e) => updateParent(index, 'email', e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={parent.phone}
                    onChange={(e) => updateParent(index, 'phone', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}