import { useEffect, useState } from 'react';
import { request } from '../api/client.js';
import { InventoryTable } from './OverviewPage.jsx';

export default function EquipmentPage() {
  const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => request(`/equipment?limit=100&search=${encodeURIComponent(search)}`).then(data => { setItems(data.items || []); setError(''); }).catch(err => setError(err.message)), 250); return () => clearTimeout(timer); }, [search]);
  return <section className="table-card full-table"><div className="table-heading"><div><span className="eyebrow">EQUIPMENT LIBRARY</span><h2>รายการอุปกรณ์ทั้งหมด</h2><p className="muted">อุปกรณ์ในระบบ {items.length} รายการ</p></div><label className="search-box"><span>⌕</span><input placeholder="ค้นหาชื่อหรือรหัสอุปกรณ์" value={search} onChange={e => setSearch(e.target.value)} /></label></div>{error ? <div className="error-banner">{error}</div> : <InventoryTable items={items} />}</section>;
}
