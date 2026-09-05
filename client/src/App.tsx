import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequireRole, roleHome } from './components/RequireRole';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

import StudentDashboard from './pages/student/StudentDashboard';
import Jobs from './pages/student/Jobs';
import JobDetail from './pages/student/JobDetail';
import MyApplications from './pages/student/MyApplications';
import PrepTracker from './pages/student/PrepTracker';
import Profile from './pages/Profile';

import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import ManageJobs from './pages/coordinator/ManageJobs';
import JobApplicants from './pages/coordinator/JobApplicants';

import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Moderation from './pages/admin/Moderation';
import Landing from './pages/Landing';

/** Guests see the landing page; signed-in users go straight to their dashboard. */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={roleHome(user.role)} replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Student */}
        <Route
          element={
            <RequireRole roles={['student']}>
              <AppLayout />
            </RequireRole>
          }
        >
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/jobs" element={<Jobs />} />
          <Route path="/student/jobs/:id" element={<JobDetail />} />
          <Route path="/student/applications" element={<MyApplications />} />
          <Route path="/student/prep" element={<PrepTracker />} />
          <Route path="/student/profile" element={<Profile />} />
        </Route>

        {/* Coordinator */}
        <Route
          element={
            <RequireRole roles={['coordinator']}>
              <AppLayout />
            </RequireRole>
          }
        >
          <Route path="/coordinator" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/jobs" element={<ManageJobs />} />
          <Route path="/coordinator/jobs/:id/applicants" element={<JobApplicants />} />
          <Route path="/coordinator/profile" element={<Profile />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <RequireRole roles={['admin']}>
              <AppLayout />
            </RequireRole>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/moderation" element={<Moderation />} />
          <Route path="/admin/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
