import { useEffect, useState } from 'react';
import { request } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function RequestsPage() {
  const [rows, setRows] = useState([]); const [error, setError] = useState('');
  useEffect(() => { request('/borrow').then(setRows).catch(err => setError(err.message)); }, []);
  return <section className="table-card full-table"><div className="table-heading"><div><span className="eyebrow">BORROWING ACTIVITY</span><h2>คำขอยืมและประวัติรายการ</h2><p className="muted">ติดตามสถานะคำขอยืมอุปกรณ์</p></div><span className="count-chip">{rows.length} รายการ</span></div>{error ? <div className="error-banner">{error}</div> : rows.length ? <div className="table-wrap"><table><thead><tr><th>วันที่ทำรายการ</th><th>ผู้ยืม</th><th>โปรเจกต์ / วิชา</th><th>กำหนดคืน</th><th>สถานะ</th></tr></thead><tbody>{rows.map(row => <tr key={row._id}><td>{new Intl.DateTimeFormat('th-TH').format(new Date(row.createdAt))}</td><td className="name-cell">{row.borrower?.fullName || '—'}</td><td>{row.project}</td><td>{new Intl.DateTimeFormat('th-TH').format(new Date(row.dueDate))}</td><td><StatusBadge status={row.status} /></td></tr>)}</tbody></table></div> : <div className="empty-state"><div>⇄</div><strong>ยังไม่มีรายการยืมคืน</strong><span>รายการใหม่จะแสดงที่นี่</span></div>}</section>;
}
