import { useEffect, useState } from 'react';
import { request } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OverviewPage({ user }) {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      user?.role === 'admin' ? request('/dashboard/summary') : Promise.resolve(null),
      request('/equipment?limit=5'),
    ]).then(([stats, inventory]) => { setSummary(stats); setItems(inventory.items || []); }).catch(err => setError(err.message));
  }, [user]);
  const cards = user?.role === 'admin' ? [
    ['ประเภทอุปกรณ์', summary?.itemTypes, 'รายการในคลัง', '▧', ''], ['พร้อมใช้งาน', summary?.available, 'ชิ้น', '✓', 'green'],
    ['กำลังถูกยืม', summary?.borrowed, 'ชิ้น', '↗', ''], ['รออนุมัติ', summary?.requests?.pending, 'รายการ', '◷', 'red'],
  ] : [];
  return <>
    <section className="welcome-banner"><div><span className="eyebrow light">ยินดีต้อนรับ</span><h2>{user?.fullName || 'ผู้ใช้งาน'}</h2><p>ดูภาพรวมและสถานะอุปกรณ์ในระบบของคุณ</p></div><div className="banner-stamp">TR<span>INVENTORY</span></div></section>
    {error && <div className="error-banner">{error} — ตรวจสอบว่าเซิร์ฟเวอร์พร้อมให้บริการ</div>}
    {user?.role === 'admin' ? <><div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>ภาพรวมคลังอุปกรณ์</h2></div><span className="muted">อัปเดตข้อมูลล่าสุด</span></div><div className="stats-grid">{cards.map(([label, value, note, icon, tone]) => <StatCard key={label} label={label} value={value} note={note} icon={icon} tone={tone} />)}</div></> : <div className="notice-card"><span className="notice-icon">✦</span><div><h3>เริ่มต้นจัดการอุปกรณ์ได้เลย</h3><p>เลือกดูคลังอุปกรณ์เพื่อค้นหารายการ หรือดูสถานะคำขอยืมคืนของคุณ</p></div></div>}
    <section className="table-card"><div className="table-heading"><div><span className="eyebrow">INVENTORY</span><h2>อุปกรณ์ล่าสุด</h2></div><a className="text-link" href="/equipment">ดูทั้งหมด <span>→</span></a></div><InventoryTable items={items} /></section>
  </>;
}

export function InventoryTable({ items }) {
  if (!items.length) return <div className="empty-state"><div>▧</div><strong>ยังไม่มีรายการอุปกรณ์</strong><span>รายการจะแสดงที่นี่เมื่อมีข้อมูลในระบบ</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่ออุปกรณ์</th><th>ประเภท</th><th>คงเหลือ</th><th>สถานะ</th></tr></thead><tbody>{items.map(item => <tr key={item._id}><td className="code-cell">{item.itemCode}</td><td className="name-cell"><span className="item-symbol">▧</span>{item.name}</td><td>{item.category === 'equipment' ? 'ครุภัณฑ์' : 'วัสดุสิ้นเปลือง'}</td><td>{item.availableQuantity} <span className="muted">/ {item.totalQuantity}</span></td><td><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div>;
}
