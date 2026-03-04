// FILE: /frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SelectRole from './pages/SelectRole';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Departments from './pages/admin/Departments';
import Programs from './pages/admin/Programs';
import AcademicYears from './pages/admin/AcademicYears';
import Rooms from './pages/admin/Rooms';
import Complaints from './pages/admin/Complaints';

// Secretary
import SecretaryLayout from './pages/secretary/secretaryLayout';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import RegisterStudent from './pages/secretary/RegisterStudent';
import AllStudents from './pages/secretary/AllStudents';

// HOD
import HodLayout from './pages/hod/HodLayout';
import HodDashboard from './pages/hod/HodDashboard';
import HodAvailability from './pages/hod/HodAvailability';
import HodTimetable from './pages/hod/HodTimetable';

// Trainer
import TrainerLayout from './pages/trainer/TrainerLayout';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerCourses from './pages/trainer/TrainerCourses';
import TrainerAvailability from './pages/trainer/TrainerAvailability';
import TrainerTimetable from './pages/trainer/TrainerTimetable';
import TrainerComplaints from './pages/trainer/TrainerComplaints';

// Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentGrades from './pages/student/StudentGrades';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentComplaints from './pages/student/StudentComplaints';

// Parent
import ParentLayout from './pages/parent/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentComplaint from './pages/parent/ParentComplaint';

function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user?.roleName)) {
        return <Navigate to="/select-role" />;
    }
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
                        <Route path="academic-years" element={<AcademicYears />} />
                        <Route path="rooms" element={<Rooms />} />
                        <Route path="complaints" element={<Complaints />} />
                    </Route>

                    {/* Secretary */}
                    <Route path="/secretary" element={<ProtectedRoute allowedRoles={['secretary']}><SecretaryLayout /></ProtectedRoute>}>
                        <Route index element={<SecretaryDashboard />} />
                        <Route path="register" element={<RegisterStudent />} />
                        <Route path="students" element={<AllStudents />} />
                    </Route>

                    {/* HOD */}
                    <Route path="/hod" element={<ProtectedRoute allowedRoles={['hod']}><HodLayout /></ProtectedRoute>}>
                        <Route index element={<HodDashboard />} />
                        <Route path="availability" element={<HodAvailability />} />
                        <Route path="timetable" element={<HodTimetable />} />
                    </Route>

                    {/* Trainer */}
                    <Route path="/trainer" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerLayout /></ProtectedRoute>}>
                        <Route index element={<TrainerDashboard />} />
                        <Route path="courses" element={<TrainerCourses />} />
                        <Route path="availability" element={<TrainerAvailability />} />
                        <Route path="timetable" element={<TrainerTimetable />} />
                        <Route path="complaints" element={<TrainerComplaints />} />
                    </Route>

                    {/* Student */}
                    <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
                        <Route index element={<StudentDashboard />} />
                        <Route path="grades" element={<StudentGrades />} />
                        <Route path="timetable" element={<StudentTimetable />} />
                        <Route path="complaints" element={<StudentComplaints />} />
                    </Route>

                    {/* Parent */}
                    <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
                        <Route index element={<ParentDashboard />} />
                        <Route path="complaints" element={<ParentComplaint />} />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;