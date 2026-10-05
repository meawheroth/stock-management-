import { NavLink } from 'react-router-dom';

const links = [
  ['/', '▦', 'ภาพรวม'],
  ['/equipment', '▧', 'คลังอุปกรณ์'],
  ['/requests', '⇄', 'รายการยืมคืน'],
];

export default function Sidebar({ user, onLogout }) {
  return <aside className="sidebar">
    <a className="brand" href="/"><span className="brand-mark">T</span><span>toolroom<small>ระบบจัดการอุปกรณ์</small></span></a>
    <div className="nav-label">เมนูหลัก</div>
    <nav>{links.map(([to, icon, label]) => <NavLink end={to === '/'} key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{icon}</span>{label}</NavLink>)}</nav>
    <div className="sidebar-bottom">
      <div className="profile"><div className="avatar">{user?.fullName?.slice(0, 1) || 'U'}</div><div className="profile-copy"><strong>{user?.fullName || 'ผู้ใช้งาน'}</strong><span>{({ admin: 'ผู้ดูแลระบบ', teacher: 'อาจารย์', student: 'นักศึกษา' })[user?.role] || user?.role}</span></div><button className="icon-button logout" title="ออกจากระบบ" onClick={onLogout}>↗</button></div>
    </div>
  </aside>;
}
