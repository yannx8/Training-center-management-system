// FILE: /frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Departments from './pages/admin/Departments';
import Programs from './pages/admin/Programs';
import ProgramCourses from './pages/admin/ProgramCourses';
import Certifications from './pages/admin/Certifications';
import AcademicYears from './pages/admin/AcademicYears';
import Rooms from './pages/admin/Rooms';
import Complaints from './pages/admin/Complaints';

// Secretary
import SecretaryLayout from './pages/secretary/secretaryLayout';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';

// HOD
import HodLayout from './pages/hod/HodLayout';
import HodDashboard from './pages/hod/HodDashboard';
import HodAvailability from './pages/hod/HodAvailability';
import HodTimetable from './pages/hod/HodTimetable';
import HodAnnouncements from './pages/hod/HodAnnouncements';

// Trainer
import TrainerLayout from './pages/trainer/TrainerLayout';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerCourses from './pages/trainer/TrainerCourses';
import TrainerCertifications from './pages/trainer/TrainerCertifications';
import TrainerAvailability from './pages/trainer/TrainerAvailability';
import TrainerTimetable from './pages/trainer/TrainerTimetable';
import TrainerComplaints from './pages/trainer/TrainerComplaints';
import TrainerAnnouncements from './pages/trainer/TrainerAnnouncements';
import TrainerCertWeeks from './pages/trainer/TrainerCertWeeks';

// Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentGrades from './pages/student/StudentGrades';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentCertTimetable from './pages/student/StudentCertTimetable';
import StudentCertAvailability from './pages/student/StudentCertAvailability';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

// Parent
import ParentLayout from './pages/parent/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildSelection from './pages/parent/ChildSelection';
import ChildTimetable from './pages/parent/ChildTimetable';
import ParentComplaint from './pages/parent/ParentComplaint';
import ParentAnnouncements from './pages/parent/ParentAnnouncements';

import Login from './pages/Login';
import SelectRole from './pages/SelectRole';

function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user?.roleName))
        return <Navigate to="/select-role" />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/select-role" element={<SelectRole />} />

                    {/* Admin */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="departments" element={<Departments />} />
                        <Route path="programs" element={<Programs />} />
                        <Route path="programs/:programId/courses" element={<ProgramCourses />} />
                        <Route path="certifications" element={<Certifications />} />
                        <Route path="academic-years" element={<AcademicYears />} />
                        <Route path="rooms" element={<Rooms />} />
                        <Route path="complaints" element={<Complaints />} />
                    </Route>

                    {/* Secretary */}
                    <Route path="/secretary" element={<ProtectedRoute allowedRoles={['secretary']}><SecretaryLayout /></ProtectedRoute>}>
                        <Route index element={<SecretaryDashboard />} />
                    </Route>

                    {/* HOD */}
                    <Route path="/hod" element={<ProtectedRoute allowedRoles={['hod']}><HodLayout /></ProtectedRoute>}>
                        <Route index element={<HodDashboard />} />
                        <Route path="availability" element={<HodAvailability />} />
                        <Route path="timetable" element={<HodTimetable />} />
                        <Route path="announcements" element={<HodAnnouncements />} />
                    </Route>

                    {/* Trainer */}
                    <Route path="/trainer" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerLayout /></ProtectedRoute>}>
                        <Route index element={<TrainerDashboard />} />
                        <Route path="courses" element={<TrainerCourses />} />
                        <Route path="certifications" element={<TrainerCertifications />} />
                        <Route path="availability" element={<TrainerAvailability />} />
                        <Route path="cert-scheduling" element={<TrainerCertWeeks />} />
                        <Route path="timetable" element={<TrainerTimetable />} />
                        <Route path="complaints" element={<TrainerComplaints />} />
                        <Route path="announcements" element={<TrainerAnnouncements />} />
                    </Route>

                    {/* Student */}
                    <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
                        <Route index element={<StudentDashboard />} />
                        <Route path="timetable" element={<StudentTimetable />} />
                        <Route path="cert-timetable" element={<StudentCertTimetable />} />
                        <Route path="cert-availability" element={<StudentCertAvailability />} />
                        <Route path="grades" element={<StudentGrades />} />
                        <Route path="complaints" element={<StudentComplaints />} />
                        <Route path="announcements" element={<StudentAnnouncements />} />
                    </Route>

                    {/* Parent */}
                    <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
                        <Route index element={<ParentDashboard />} />
                        <Route path="children" element={<ChildSelection />} />
                        <Route path="timetable/:studentId" element={<ChildTimetable />} />
                        <Route path="complaint" element={<ParentComplaint />} />
                        <Route path="announcements" element={<ParentAnnouncements />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
