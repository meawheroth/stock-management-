import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onLogin(email, password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="login-page"><section className="login-panel"><a className="brand login-brand" href="/"><span className="brand-mark">T</span><span>toolroom<small>ระบบจัดการอุปกรณ์</small></span></a><div className="login-copy"><span className="eyebrow">WELCOME BACK</span><h1>เข้าสู่ระบบ</h1><p>จัดการอุปกรณ์และติดตามการยืมคืนได้ในที่เดียว</p></div><form onSubmit={submit} className="login-form"><label>อีเมล<input type="email" autoComplete="username" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>รหัสผ่าน<input type="password" autoComplete="current-password" placeholder="กรอกรหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <div className="inline-error">{error}</div>}<button className="button button-primary login-submit" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}<span>→</span></button></form><p className="login-footnote">หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบ</p></section><section className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-content"><span className="art-kicker">SMART INVENTORY · EASY BORROWING</span><div className="art-icon">✳</div><h2>ทุกอุปกรณ์<br/>พร้อมไปกับไอเดียของคุณ</h2><p>ดูแลคลังอุปกรณ์ ยืมคืน และติดตามสถานะ<br/>ได้สะดวกจากทุกที่</p></div><div className="art-footer">TOOLROOM MANAGEMENT SYSTEM <span>01 — 03</span></div></section></main>;
}
