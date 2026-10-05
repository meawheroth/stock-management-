const labels = {
  available: 'พร้อมใช้งาน', borrowed: 'ถูกยืม', damaged: 'ชำรุด', lost: 'สูญหาย',
  pending: 'รออนุมัติ', approved: 'กำลังยืม', rejected: 'ไม่อนุมัติ', returned: 'คืนแล้ว',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{labels[status] || status || '—'}</span>;
}
