import { Link } from 'react-router-dom';
import { Wallet, Users, Landmark, PiggyBank } from 'lucide-react';
import { useApi } from '../lib/useApi.js';
import { fmtUSD, fmtSigned, timeAgo } from '../lib/format.js';
import { PageHeader, Stat, Loading, ErrorNote, Badge, UserCell, Empty } from '../components/ui.jsx';

/* Four figures and one queue strip. The earlier version carried eight tiles
   and five cards before the first row of real data — most of it restating
   the same numbers. This is what a duty manager actually opens the page for. */

const QUEUE = [
  { key: 'deposits', label: 'Deposits', to: '/approvals' },
  { key: 'withdrawals', label: 'Withdrawals', to: '/approvals' },
  { key: 'kyc', label: 'KYC', to: '/kyc' },
  { key: 'tickets', label: 'Tickets', to: '/messages' },
];

export default function Dashboard() {
  const { data, loading, error } = useApi('/api/admin/stats');

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  const q = data.queue || {};
  const total = Object.values(q).reduce((s, n) => s + n, 0);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where the book stands, and what is waiting on you." />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Assets under management" value={fmtUSD(data.aum, { maximumFractionDigits: 0 })} sub="All client accounts" icon={Wallet} />
        <Stat label="Cash held" value={fmtUSD(data.cashTotal, { maximumFractionDigits: 0 })} sub="Client cash accounts" icon={PiggyBank} />
        <Stat label="Brokerage & retirement" value={fmtUSD((data.brokerageTotal || 0) + (data.retirementTotal || 0), { maximumFractionDigits: 0 })} sub={`${data.mandates} subscriptions`} icon={Landmark} />
        <Stat label="Clients" value={String(data.clients)} sub={`${data.activeClients} active`} icon={Users} />
      </div>

      {/* work queue — one strip, not five cards */}
      <div className="card mt-4 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[color:var(--line-soft)] flex items-center justify-between">
          <p className="text-[13px] font-bold">Needs attention</p>
          <span className="text-[12px] text-[color:var(--muted-dim)]">
            {total === 0 ? 'Queue clear' : `${total} waiting`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-[color:var(--line-soft)]">
          {QUEUE.map((c) => {
            const n = q[c.key] || 0;
            return (
              <Link key={c.key} to={c.to} className="px-5 py-4 hover:bg-white/[.02] transition-colors">
                <p className="num text-[20px]" style={{ color: n > 0 ? 'var(--gold-bright)' : 'var(--muted-dim)' }}>{n}</p>
                <p className="text-[11.5px] text-[color:var(--muted-dim)] mt-1">{c.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* latest ledger */}
      <div className="card mt-4 overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-[color:var(--line-soft)]">
          <p className="text-[13px] font-bold">Latest activity</p>
        </div>
        {data.recent.length === 0 ? <Empty text="No transactions yet" /> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th><th>Description</th><th>Status</th>
                <th className="text-right">Amount</th><th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t._id}>
                  <td><UserCell user={t.user} /></td>
                  <td>
                    <p className="text-[13px]">{t.label}</p>
                    <p className="text-[11px] text-[color:var(--muted-dim)]">{t.detail}</p>
                  </td>
                  <td><Badge value={t.status} /></td>
                  <td className="num text-right" style={{ color: t.amount >= 0 ? 'var(--up)' : 'var(--cream)' }}>
                    {fmtSigned(t.amount)}
                  </td>
                  <td className="text-[12px] text-[color:var(--muted-dim)] whitespace-nowrap">{timeAgo(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
