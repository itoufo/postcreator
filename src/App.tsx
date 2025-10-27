import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/components/auth/Login';
import Signup from '@/components/auth/Signup';
import AuthGuard from '@/components/auth/AuthGuard';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import Generator from '@/pages/Generator';
import History from '@/pages/History';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/accounts"
          element={
            <AuthGuard>
              <Accounts />
            </AuthGuard>
          }
        />
        <Route
          path="/generator"
          element={
            <AuthGuard>
              <Generator />
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <History />
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
