import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { login, request } from './api/client.js';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import EquipmentPage from './pages/EquipmentPage.jsx';
import RequestsPage from './pages/RequestsPage.jsx';

export default function App() {
  const [user, setUser] = useState(null); const [ready, setReady] = useState(false); const navigate = useNavigate();
  useEffect(() => { if (!localStorage.getItem('toolroom-token')) { setReady(true); return; } request('/auth/me').then(setUser).catch(() => localStorage.removeItem('toolroom-token')).finally(() => setReady(true)); }, []);
  async function handleLogin(email, password) { const result = await login(email, password); localStorage.setItem('toolroom-token', result.token); setUser(result.user); navigate('/'); }
  function logout() { localStorage.removeItem('toolroom-token'); setUser(null); navigate('/login'); }
  if (!ready) return <div className="loading-screen"><span className="brand-mark">T</span><span>กำลังโหลดระบบ…</span></div>;
  return <Routes><Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} /><Route element={user ? <DashboardLayout user={user} onLogout={logout} /> : <Navigate to="/login" replace />}><Route index element={<OverviewPage user={user} />} /><Route path="equipment" element={<EquipmentPage />} /><Route path="requests" element={<RequestsPage />} /></Route><Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} /></Routes>;
}
