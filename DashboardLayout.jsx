import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

const titles = { '/': 'ภาพรวมระบบ', '/equipment': 'คลังอุปกรณ์', '/requests': 'รายการยืมคืน' };

export default function DashboardLayout({ user, onLogout }) {
  const location = useLocation();
  return <div className="app-shell"><Sidebar user={user} onLogout={onLogout} /><main className="main-area"><header className="topbar"><div><span className="eyebrow">TOOLROOM / MANAGEMENT</span><h1>{titles[location.pathname] || 'ระบบจัดการอุปกรณ์'}</h1></div><div className="topbar-date">{new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date())}</div></header><div className="page-content"><Outlet /></div><footer className="footer">Toolroom <span>•</span> ระบบจัดการยืมคืนอุปกรณ์</footer></main></div>;
}
