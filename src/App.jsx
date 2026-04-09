import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Roster from './pages/Roster';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        element={
          <RequireAuth allowedRoles={['admin', 'coach', 'parent']}>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="roster" element={<Roster />} />
        <Route
          path="admin"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <Admin />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
