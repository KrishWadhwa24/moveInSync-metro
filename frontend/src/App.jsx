import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Search from './pages/Search';
import Booking from './pages/Booking';
import Admin from './pages/Admin';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/search" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/search"         element={<PrivateRoute><Search /></PrivateRoute>} />
        <Route path="/booking/:id"    element={<PrivateRoute><Booking /></PrivateRoute>} />
        <Route path="/admin"          element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*"               element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}