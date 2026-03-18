// FILE: src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SelectRole from "./pages/SelectRole";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import Departments from "./pages/admin/Departments";
import Programs from "./pages/admin/Programs";
import ProgramCourses from "./pages/admin/ProgramCourses";
import Certifications from "./pages/admin/Certifications";
import Rooms from "./pages/admin/Rooms";
import Complaints from "./pages/admin/Complaints";
import HodLayout from "./pages/hod/HodLayout";
import HodDashboard from "./pages/hod/HodDashboard";
import HodWeeks from "./pages/hod/HodWeeks";
import HodAvailability from "./pages/hod/HodAvailability";
import HodTimetable from "./pages/hod/HodTimetable";
import HodAnnouncements from "./pages/hod/HodAnnouncements";
import TrainerLayout from "./pages/trainer/TrainerLayout";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import TrainerAvailability from "./pages/trainer/TrainerAvailability";
import TrainerTimetable from "./pages/trainer/TrainerTimetable";
import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCertAvailability from "./pages/student/StudentCertAvailability";
import ParentLayout from "./pages/parent/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import SecretaryLayout from "./pages/secretary/SecretaryLayout";
import SecretaryDashboard from "./pages/secretary/SecretaryDashboard";
import RegisterStudent from "./pages/secretary/RegisterStudent";
import AllStudents from "./pages/secretary/AllStudents";

function Protected({ role, children }) {
  const { isAuthenticated, role: userRole, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to={"/" + userRole} replace />;
  return children;
}

function Todo({ label }) {
  return <div className="card p-10 text-center text-gray-400"><p className="font-semibold">{label}</p><p className="text-sm mt-1">Component file available.</p></div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/admin" element={<Protected role="admin"><AdminLayout /></Protected>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="departments" element={<Departments />} />
            <Route path="programs" element={<Programs />} />
            <Route path="programs/:id/courses" element={<ProgramCourses />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="academic-years" element={<Todo label="Academic Years" />} />
            <Route path="complaints" element={<Complaints />} />
          </Route>

          <Route path="/hod" element={<Protected role="hod"><HodLayout /></Protected>}>
            <Route index element={<HodDashboard />} />
            <Route path="weeks" element={<HodWeeks />} />
            <Route path="availability" element={<HodAvailability />} />
            <Route path="timetables" element={<HodTimetable />} />
            <Route path="announcements" element={<HodAnnouncements />} />
          </Route>

          <Route path="/trainer" element={<Protected role="trainer"><TrainerLayout /></Protected>}>
            <Route index element={<TrainerDashboard />} />
            <Route path="courses" element={<Todo label="My Courses" />} />
            <Route path="certifications" element={<Todo label="Certifications" />} />
            <Route path="availability" element={<TrainerAvailability />} />
            <Route path="timetable" element={<TrainerTimetable />} />
            <Route path="grades" element={<Todo label="Grade Entry" />} />
            <Route path="complaints" element={<Todo label="Mark Complaints" />} />
            <Route path="announcements" element={<Todo label="Announcements" />} />
          </Route>

          <Route path="/student" element={<Protected role="student"><StudentLayout /></Protected>}>
            <Route index element={<StudentDashboard />} />
            <Route path="timetable" element={<Todo label="Academic Timetable" />} />
            <Route path="cert-timetable" element={<Todo label="Cert Timetable" />} />
            <Route path="cert-availability" element={<StudentCertAvailability />} />
            <Route path="grades" element={<Todo label="My Grades" />} />
            <Route path="complaints" element={<Todo label="Complaints" />} />
            <Route path="announcements" element={<Todo label="Announcements" />} />
          </Route>

          <Route path="/parent" element={<Protected role="parent"><ParentLayout /></Protected>}>
            <Route index element={<ParentDashboard />} />
            <Route path="children" element={<Todo label="My Children" />} />
            <Route path="timetable" element={<Todo label="Child Timetable" />} />
            <Route path="grades" element={<Todo label="Child Grades" />} />
            <Route path="complaints" element={<Todo label="Complaints" />} />
            <Route path="announcements" element={<Todo label="Announcements" />} />
          </Route>

          <Route path="/secretary" element={<Protected role="secretary"><SecretaryLayout /></Protected>}>
            <Route index element={<SecretaryDashboard />} />
            <Route path="students" element={<AllStudents />} />
            <Route path="register" element={<RegisterStudent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
