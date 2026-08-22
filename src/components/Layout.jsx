import { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BadgeCheck, Users, ArrowLeftRight, FileCheck2, MessageSquare, SlidersHorizontal, LogOut, Menu, Bitcoin } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../lib/useApi.js';
import { Loading } from './ui.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/approvals', label: 'Approvals', icon: BadgeCheck, badge: 'approvals' },
  { to: '/kyc', label: 'KYC Review', icon: FileCheck2, badge: 'kyc' },
  { to: '/wallets', label: 'Receiving Wallets', icon: Bitcoin },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/messages', label: 'Messages', icon: MessageSquare, badge: 'tickets' },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export default function Layout() {
  const { admin, booting, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Queue counts drive the sidebar badges — refreshed on every route change.
  const { data: stats } = useApi(admin ? '/api/admin/stats' : null, [location.pathname]);
  const queue = stats?.queue || {};
  const counts = {
    approvals: (queue.deposits || 0) + (queue.withdrawals || 0),
    kyc: queue.kyc || 0,
    tickets: queue.tickets || 0,
  };

  if (booting) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[236px] flex flex-col border-r border-[color:var(--line-soft)] bg-[color:var(--bg-soft)] p-4 transition-transform lg:translate-x-0 overflow-y-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2.5 px-2 py-2 mb-5">
          <img src="/blogo.svg" width={32} height={32} alt="" />
          <div>
            <p className="text-[13.5px] font-bold leading-tight">Betament</p>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold-bright)]">Admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {LINKS.map(({ to, label, icon: Icon, end, badge }) => {
            const count = badge ? counts[badge] : 0;
            return (
              <NavLink
                key={to} to={to} end={end} onClick={() => setOpen(false)}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} /> {label}
                {count > 0 && (
                  <span
                    className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10.5px] font-bold"
                    style={{ background: 'var(--down)', color: '#fff' }}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[color:var(--line-soft)] pt-3 mt-3">
          <p className="text-[12.5px] px-2 truncate">{admin.name}</p>
          <p className="text-[11px] px-2 text-[color:var(--muted-dim)] truncate mb-2">{admin.email}</p>
          <button onClick={logout} className="side-link w-full text-left"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[color:var(--line-soft)]">
          <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm" aria-label="Menu"><Menu size={16} /></button>
          <p className="text-[13.5px] font-bold">Betament Admin</p>
        </header>
        <main className="p-4 md:p-7 max-w-[1240px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
