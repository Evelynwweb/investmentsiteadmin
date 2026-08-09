import { X, AlertCircle, Inbox } from 'lucide-react';
import { initials } from '../lib/format.js';

/* ---------- modal ---------- */
export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- form field ---------- */
export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[color:var(--muted-dim)] mt-1.5">{hint}</p>}
    </div>
  );
}

/* ---------- status badge ---------- */
const BADGE_COLORS = {
  completed: 'var(--up)', verified: 'var(--up)', active: 'var(--up)', approved: 'var(--up)', resolved: 'var(--up)',
  pending: 'var(--gold-bright)', processing: 'var(--gold-bright)', read: 'var(--gold-bright)', matured: 'var(--gold-bright)',
  failed: 'var(--down)', rejected: 'var(--down)', reversed: 'var(--down)', inactive: 'var(--down)',
  open: 'var(--ember)', withdrawn: 'var(--muted-dim)', closed: 'var(--muted-dim)',
  unverified: 'var(--muted-dim)', skipped: 'var(--muted-dim)',
  admin: 'var(--gold-bright)', client: 'var(--muted)',
};
export function Badge({ value }) {
  const color = BADGE_COLORS[value] || 'var(--muted)';
  return (
    <span className="badge" style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}>
      {value}
    </span>
  );
}

/* ---------- async states ---------- */
export function Loading() {
  return <div className="flex justify-center py-16"><div className="spinner" /></div>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1.5 text-[12.5px] text-[color:var(--down)] mt-3">
      <AlertCircle size={13} /> {error.message || String(error)}
    </p>
  );
}

export function Empty({ text = 'Nothing here yet' }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-[color:var(--muted-dim)]">
      <Inbox size={22} />
      <p className="text-[12.5px]">{text}</p>
    </div>
  );
}

/* ---------- page header ---------- */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-[20px] font-bold">{title}</h1>
        {subtitle && <p className="text-[12.5px] text-[color:var(--muted-dim)] mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/* ---------- client cell (avatar + name + email) ---------- */
export function UserCell({ user }) {
  if (!user) return <span className="text-[color:var(--muted-dim)]">deleted client</span>;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: 'rgba(245,158,11,.14)', color: 'var(--gold-bright)' }}
      >
        {initials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] truncate">{user.name}</p>
        <p className="text-[11px] text-[color:var(--muted-dim)] truncate">{user.email}</p>
      </div>
    </div>
  );
}

/* ---------- filter chip row ---------- */
export function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`chip ${value === o.id ? 'active' : ''}`}
        >
          {o.label}{o.count !== undefined ? ` (${o.count})` : ''}
        </button>
      ))}
    </div>
  );
}

/* ---------- stat tile ---------- */
export function Stat({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] uppercase tracking-widest text-[color:var(--muted-dim)]">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,.1)' }}>
            <Icon size={14} className="text-[color:var(--gold-bright)]" />
          </div>
        )}
      </div>
      <p className="num text-[22px] mt-3" style={{ color: tone || 'var(--cream)' }}>{value}</p>
      {sub && <p className="text-[11.5px] text-[color:var(--muted-dim)] mt-1">{sub}</p>}
    </div>
  );
}
