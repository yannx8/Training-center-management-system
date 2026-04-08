import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Profile from './pages/Profile';

// Auth
import Login      from './pages/Login';
import SelectRole from './pages/SelectRole';

// Admin
import AdminLayout      from './pages/admin/AdminLayout';
import AdminDashboard   from './pages/admin/Dashboard';
import UserManagement   from './pages/admin/UserManagement';
import Departments      from './pages/admin/Departments';
import Programs         from './pages/admin/Programs';
import ProgramCourses   from './pages/admin/ProgramCourses';
import Certifications   from './pages/admin/Certifications';
import Rooms            from './pages/admin/Rooms';
import AcademicYears    from './pages/admin/AcademicYears';
import AdminComplaints  from './pages/admin/Complaints';

// HOD
import HodLayout        from './pages/hod/HodLayout';
import HodDashboard     from './pages/hod/HodDashboard';
import HodWeeks         from './pages/hod/HodWeeks';
import HodAvailability  from './pages/hod/HodAvailability';
import HodTimetable     from './pages/hod/HodTimetable';
import HodAnnouncements from './pages/hod/HodAnnouncements';

// Trainer
import TrainerLayout        from './pages/trainer/TrainerLayout';
import TrainerDashboard     from './pages/trainer/TrainerDashboard';
import TrainerCourses       from './pages/trainer/TrainerCourses';
import TrainerCertifications from './pages/trainer/TrainerCertifications';
import TrainerAvailability  from './pages/trainer/TrainerAvailability';
import TrainerTimetable     from './pages/trainer/TrainerTimetable';
import TrainerGrades        from './pages/trainer/TrainerGrades';
import TrainerComplaints    from './pages/trainer/TrainerComplaints';
import TrainerAnnouncements from './pages/trainer/TrainerAnnouncements';

// Student
import StudentLayout           from './pages/student/StudentLayout';
import StudentDashboard        from './pages/student/StudentDashboard';
import StudentTimetable        from './pages/student/StudentTimetable';
import StudentCertTimetable    from './pages/student/StudentCertTimetable';
import StudentCertAvailability from './pages/student/StudentCertAvailability';
import StudentGrades           from './pages/student/StudentGrades';
import StudentComplaints       from './pages/student/StudentComplaints';
import StudentAnnouncements    from './pages/student/StudentAnnouncements';

// Parent
import ParentLayout        from './pages/parent/ParentLayout';
import ParentDashboard     from './pages/parent/ParentDashboard';
import ParentChildren      from './pages/parent/ParentChildren';
import ParentTimetable     from './pages/parent/ParentTimetable';
import ParentGrades        from './pages/parent/ParentGrades';
import ParentComplaints    from './pages/parent/ParentComplaints';
import ParentAnnouncements from './pages/parent/ParentAnnouncements';

// Secretary
import SecretaryLayout    from './pages/secretary/SecretaryLayout';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import AllStudents        from './pages/secretary/AllStudents';
import RegisterStudent    from './pages/secretary/RegisterStudent';

// A specialized wrapper to guard our routes. 
// It checks if the user is logged in and if they have the correct role permission 
// before letting them see the page. If not, it redirects them to the right spot.
function Protected({ role, children }) {
  const { isAuthenticated, role: userRole, loading } = useAuth();
  
  // Show nothing while we're still checking their session.
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace/>;
  
  // If they are logged in but trying to access a role-specific page they don't own, 
  // send them back to their own dashboard.
  if (role && userRole !== role) return <Navigate to={'/' + userRole} replace/>;
  
  return children;
}

// The root component of our frontend application.
// We set up the global authentication context and all the possible page routes here.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public access routes */}
          <Route path="/login"       element={<Login/>}/>
          <Route path="/select-role" element={<SelectRole/>}/>
          <Route path="/"            element={<Navigate to="/login" replace/>}/>

          {/* Role-specific dashboards and features, each grouped under its own layout */}
          
          {/* Admin Section: High-level system management */}
          <Route path="/admin" element={<Protected role="admin"><AdminLayout/></Protected>}>
            <Route index                        element={<AdminDashboard/>}/>
            <Route path="users"                 element={<UserManagement/>}/>
            <Route path="departments"           element={<Departments/>}/>
            <Route path="programs"              element={<Programs/>}/>
            <Route path="programs/:id/courses"  element={<ProgramCourses/>}/>
            <Route path="certifications"        element={<Certifications/>}/>
            <Route path="rooms"                 element={<Rooms/>}/>
            <Route path="academic-years"        element={<AcademicYears/>}/>
            <Route path="complaints"            element={<AdminComplaints/>}/>
            <Route path="profile"               element={<Profile/>}/>
          </Route>

          {/* HOD Section: Departmental scheduling and trainer oversight */}
          <Route path="/hod" element={<Protected role="hod"><HodLayout/></Protected>}>
            <Route index                element={<HodDashboard/>}/>
            <Route path="weeks"         element={<HodWeeks/>}/>
            <Route path="availability"  element={<HodAvailability/>}/>
            <Route path="timetables"    element={<HodTimetable/>}/>
            <Route path="announcements" element={<HodAnnouncements/>}/>
            <Route path="profile"       element={<Profile/>}/>
          </Route>

          {/* Trainer Section: Grading, scheduling, and course materials */}
          <Route path="/trainer" element={<Protected role="trainer"><TrainerLayout/></Protected>}>
            <Route index                 element={<TrainerDashboard/>}/>
            <Route path="courses"        element={<TrainerCourses/>}/>
            <Route path="certifications" element={<TrainerCertifications/>}/>
            <Route path="availability"   element={<TrainerAvailability/>}/>
            <Route path="timetable"      element={<TrainerTimetable/>}/>
            <Route path="grades"         element={<TrainerGrades/>}/>
            <Route path="complaints"     element={<TrainerComplaints/>}/>
            <Route path="announcements"  element={<TrainerAnnouncements/>}/>
            <Route path="profile"        element={<Profile/>}/>
          </Route>

          {/* Student Section: Timetables, grades, and announcements */}
          <Route path="/student" element={<Protected role="student"><StudentLayout/></Protected>}>
            <Route index                     element={<StudentDashboard/>}/>
            <Route path="timetable"          element={<StudentTimetable/>}/>
            <Route path="cert-timetable"     element={<StudentCertTimetable/>}/>
            <Route path="cert-availability"  element={<StudentCertAvailability/>}/>
            <Route path="grades"             element={<StudentGrades/>}/>
            <Route path="complaints"         element={<StudentComplaints/>}/>
            <Route path="announcements"      element={<StudentAnnouncements/>}/>
            <Route path="profile"            element={<Profile/>}/>
          </Route>

          {/* Parent Section: Monitoring children's progress and schedules */}
          <Route path="/parent" element={<Protected role="parent"><ParentLayout/></Protected>}>
            <Route index                element={<ParentDashboard/>}/>
            <Route path="children"      element={<ParentChildren/>}/>
            <Route path="timetable"     element={<ParentTimetable/>}/>
            <Route path="grades"        element={<ParentGrades/>}/>
            <Route path="complaints"    element={<ParentComplaints/>}/>
            <Route path="announcements" element={<ParentAnnouncements/>}/>
            <Route path="profile"       element={<Profile/>}/>
          </Route>

          {/* Secretary Section: Student registration and records */}
          <Route path="/secretary" element={<Protected role="secretary"><SecretaryLayout/></Protected>}>
            <Route index           element={<SecretaryDashboard/>}/>
            <Route path="students" element={<AllStudents/>}/>
            <Route path="register" element={<RegisterStudent/>}/>
            <Route path="profile"  element={<Profile/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
