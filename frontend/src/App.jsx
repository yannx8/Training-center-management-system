// FILE: /frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';


import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Departments from './pages/admin/Departments';
import Programs from './pages/admin/Programs';
import AcademicYears from './pages/admin/AcademicYears';
import Rooms from './pages/admin/Rooms';
import AdminComplaints from './pages/admin/Complaints';

import SecretaryLayout from './pages/secretary/SecretaryLayout';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';

import TrainerLayout from './pages/trainer/TrainerLayout';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerCourses from './pages/trainer/TrainerCourses';
import TrainerCertifications from './pages/trainer/TrainerCertifications';
import TrainerAvailability from './pages/trainer/TrainerAvailability';
import TrainerTimetable from './pages/trainer/TrainerTimetable';
import TrainerComplaints from './pages/trainer/TrainerComplaints';

import HodLayout from './pages/hod/HodLayout';
import HodDashboard from './pages/hod/HodDashboard';
import HodTimetable from './pages/hod/HodTimetable';
import HodAvailability from './pages/hod/HodAvailability';

import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentGrades from './pages/student/StudentGrades';
import StudentComplaints from './pages/student/StudentComplaints';

import ParentLayout from './pages/parent/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentComplaint from './pages/parent/ParentComplaint';

// PrivateRoute: redirects to login if not authenticated.
// Not a HOC — it's a component that wraps the route element directly.
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          

          <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="departments" element={<Departments />} />
            <Route path="programs" element={<Programs />} />
            <Route path="academic-years" element={<AcademicYears />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="complaints" element={<AdminComplaints />} />
          </Route>

          <Route path="/secretary" element={<PrivateRoute><SecretaryLayout /></PrivateRoute>}>
            <Route index element={<SecretaryDashboard />} />
          </Route>

          <Route path="/trainer" element={<PrivateRoute><TrainerLayout /></PrivateRoute>}>
            <Route index element={<TrainerDashboard />} />
            <Route path="courses" element={<TrainerCourses />} />
            <Route path="certifications" element={<TrainerCertifications />} />
            <Route path="availability" element={<TrainerAvailability />} />
            <Route path="timetable" element={<TrainerTimetable />} />
            <Route path="complaints" element={<TrainerComplaints />} />
          </Route>

          <Route path="/hod" element={<PrivateRoute><HodLayout /></PrivateRoute>}>
            <Route index element={<HodDashboard />} />
            <Route path="timetable" element={<HodTimetable />} />
            <Route path="availability" element={<HodAvailability />} />
          </Route>

          <Route path="/student" element={<PrivateRoute><StudentLayout /></PrivateRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="complaints" element={<StudentComplaints />} />
          </Route>

          <Route path="/parent" element={<PrivateRoute><ParentLayout /></PrivateRoute>}>
            <Route index element={<ParentDashboard />} />
            <Route path="complaints" element={<ParentComplaint />} />
          </Route>

          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}