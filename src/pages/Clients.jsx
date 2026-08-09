import { useState } from 'react';
import { Search, Plus, Wallet, Coins, ShieldOff, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtUSD, fmtDate, fmtSigned, timeAgo } from '../lib/format.js';
import {
  PageHeader, Loading, ErrorNote, Empty, Badge, UserCell, Modal, Field, Chips,
} from '../components/ui.jsx';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Deactivated' },
];

/* Credit or debit a client's account. Every adjustment demands a reason —
   it lands in the client's ledger and they will read it. */
function AdjustModal({ client, onClose, onDone }) {
  const { data } = useApi(`/api/admin/users/${client._id}`);
  const [form, setForm] = useState({ accountId: '', amount: '', reason: '', direction: 'credit' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const accounts = data?.accounts || [];
  const submit = async (e) => {
    e.preventDefault();
    const value = Number(form.amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a positive amount.');
    if (form.reason.trim().length < 3) return setError('A reason is required.');
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/admin/users/${client._id}/adjust`, {
        accountId: form.accountId || accounts.find((a) => a.kind === 'checking')?._id,
        amount: form.direction === 'credit' ? value : -value,
        reason: form.reason.trim(),
      });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Adjust balance — ${client.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Account">
          <select className="select" value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name} — {fmtUSD(a.balance)}</option>
            ))}
          </select>
        </Field>
        <Field label="Direction">
          <select className="select" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}>
            <option value="credit">Credit (add money)</option>
            <option value="debit">Debit (take money)</option>
          </select>
        </Field>
        <Field label="Amount">
          <input
            className="input" inputMode="decimal" autoFocus value={form.amount}
            onChange={(e) => { setError(''); setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9.]/g, '') })); }}
            placeholder="0.00"
          />
        </Field>
        <Field label="Reason" hint="Written to the client's ledger — they will see this.">
          <input
            className="input" value={form.reason}
            onChange={(e) => { setError(''); setForm((f) => ({ ...f, reason: e.target.value })); }}
            placeholder="Goodwill credit for the failed transfer on 3 Aug"
          />
        </Field>
        <ErrorNote error={error ? { message: error } : null} />
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-gold">
            {busy ? 'Applying…' : 'Apply adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* Credit the earnings wallet — periodic interest or mandate gains the client
   then sweeps into checking themselves. */
function EarningsModal({ client, onClose, onDone }) {
  const [form, setForm] = useState({ amount: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(form.amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a positive amount.');
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/admin/users/${client._id}/earnings`, {
        amount: value, reason: form.reason.trim() || 'Periodic return',
      });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Credit earnings — ${client.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-[12.5px] text-[color:var(--muted-dim)]">
          Lands in the client&rsquo;s earnings wallet. They sweep it into checking themselves.
        </p>
        <Field label="Amount">
          <input
            className="input" inputMode="decimal" autoFocus value={form.amount}
            onChange={(e) => { setError(''); setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9.]/g, '') })); }}
            placeholder="0.00"
          />
        </Field>
        <Field label="Note">
          <input
            className="input" value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Q3 mandate distribution"
          />
        </Field>
        <ErrorNote error={error ? { message: error } : null} />
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-gold">{busy ? 'Crediting…' : 'Credit earnings'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* The address every withdrawal for this client is sent to. Nothing leaves
   until the desk approves it, so this is the gate that matters. */
function PayoutBlock({ userId, payout, onChanged }) {
  const [busy, setBusy] = useState(false);
  const decide = async (approve) => {
    setBusy(true);
    try {
      await api.post(`/api/admin/users/${userId}/payout/verify`, { approve });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  if (!payout) {
    return (
      <div>
        <p className="text-[13px] font-bold mb-2">Payout wallet</p>
        <div className="card p-4"><Empty text="No payout wallet saved — this client cannot withdraw" /></div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13px] font-bold mb-2">Payout wallet</p>
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold">{payout.asset} · {payout.network}</p>
            <p className="num text-[12px] mt-1 break-all">{payout.address}</p>
            {payout.memo && <p className="text-[11.5px] mt-1 text-[color:var(--muted-dim)]">{payout.memo}</p>}
          </div>
          <Badge value={payout.verified ? 'verified' : 'pending'} />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => decide(true)} disabled={busy || payout.verified} className="btn btn-gold btn-sm">
            Approve
          </button>
          <button onClick={() => decide(false)} disabled={busy || !payout.verified} className="btn btn-down btn-sm">
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ client, onClose }) {
  const { data, loading, reload } = useApi(`/api/admin/users/${client._id}`);
  return (
    <Modal title={client.name} onClose={onClose} wide>
      {loading || !data ? <Loading /> : (
        <div className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-3 gap-3">
            {data.accounts.map((a) => (
              <div key={a._id} className="card p-4">
                <p className="text-[10.5px] uppercase tracking-widest text-[color:var(--muted-dim)]">{a.name}</p>
                <p className="num text-[18px] mt-1.5">{fmtUSD(a.balance)}</p>
                <p className="text-[11px] text-[color:var(--muted-dim)] mt-1">••••{a.number.slice(-4)}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-[12.5px]">
            {[
              ['Email', data.user.email],
              ['Phone', data.user.phone || '—'],
              ['Country', data.user.country || '—'],
              ['Joined', fmtDate(data.user.createdAt)],
              ['Referral code', data.user.referralCode],
              ['Earnings wallet', fmtUSD(data.user.profitBalance)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-[color:var(--line-soft)] pb-2">
                <span className="text-[color:var(--muted-dim)]">{k}</span>
                <span className="truncate">{v}</span>
              </div>
            ))}
          </div>

          <PayoutBlock userId={client._id} payout={data.user.payout} onChanged={reload} />

          {data.investments.length > 0 && (
            <div>
              <p className="text-[13px] font-bold mb-2">Mandates</p>
              <div className="card overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Plan</th><th>Principal</th><th>Rate</th><th>Accrued</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.investments.map((i) => (
                      <tr key={i._id}>
                        <td>{i.planName}</td>
                        <td className="num">{fmtUSD(i.principal)}</td>
                        <td className="num">{i.rate}%</td>
                        <td className="num" style={{ color: 'var(--up)' }}>{fmtUSD(i.accrued)}</td>
                        <td><Badge value={i.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <p className="text-[13px] font-bold mb-2">Recent ledger</p>
            <div className="card overflow-x-auto max-h-[320px] overflow-y-auto">
              {data.transactions.length === 0 ? <Empty text="No transactions" /> : (
                <table className="tbl">
                  <thead><tr><th>Description</th><th>Status</th><th className="text-right">Amount</th><th>When</th></tr></thead>
                  <tbody>
                    {data.transactions.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <p className="text-[12.5px]">{t.label}</p>
                          <p className="text-[11px] text-[color:var(--muted-dim)]">{t.detail}</p>
                        </td>
                        <td><Badge value={t.status} /></td>
                        <td className="num text-right" style={{ color: t.amount >= 0 ? 'var(--up)' : 'var(--cream)' }}>{fmtSigned(t.amount)}</td>
                        <td className="text-[11.5px] text-[color:var(--muted-dim)] whitespace-nowrap">{timeAgo(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CreateModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '', role: 'client' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/api/admin/users', form);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const set = (k) => (e) => { setError(''); setForm((f) => ({ ...f, [k]: e.target.value })); };

  return (
    <Modal title="Open an account" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name"><input className="input" required autoFocus value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Temporary password" hint="Tell the client to change it on first sign-in.">
          <input className="input" required minLength={6} value={form.password} onChange={set('password')} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={set('country')} /></Field>
        </div>
        <Field label="Role">
          <select className="select" value={form.role} onChange={set('role')}>
            <option value="client">Client</option>
            <option value="admin">Administrator</option>
          </select>
        </Field>
        <ErrorNote error={error ? { message: error } : null} />
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-gold">{busy ? 'Creating…' : 'Create account'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Clients() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi(`/api/admin/users?q=${encodeURIComponent(q)}&status=${status}`);
  const [adjusting, setAdjusting] = useState(null);
  const [crediting, setCrediting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const toggleActive = async (u) => {
    setBusyId(u._id);
    setActionError('');
    try {
      await api.patch(`/api/admin/users/${u._id}`, { isActive: !u.isActive });
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Clients" subtitle="Every account on the platform, with balances and controls.">
        <button onClick={() => setCreating(true)} className="btn btn-gold"><Plus size={14} /> Open account</button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="card flex items-center gap-2 px-3.5 py-2 flex-1 min-w-[220px]">
          <Search size={15} className="text-[color:var(--muted-dim)]" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or referral code…"
            className="bg-transparent outline-none text-[13px] w-full"
          />
        </div>
        <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </div>

      <ErrorNote error={actionError ? { message: actionError } : error} />

      {loading ? <Loading /> : (
        <div className="card overflow-x-auto mt-4">
          {!data?.length ? <Empty text="No clients match that search" /> : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Role</th><th>KYC</th><th>Status</th>
                  <th className="text-right">Total</th><th className="text-right">Earnings</th>
                  <th>Joined</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <button onClick={() => setViewing(u)} className="text-left">
                        <UserCell user={u} />
                      </button>
                    </td>
                    <td><Badge value={u.role} /></td>
                    <td><Badge value={u.kyc.status} /></td>
                    <td><Badge value={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="num text-right">{fmtUSD(u.balances.total)}</td>
                    <td className="num text-right text-[color:var(--muted)]">{fmtUSD(u.profitBalance)}</td>
                    <td className="text-[12px] text-[color:var(--muted-dim)] whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setAdjusting(u)} className="btn btn-ghost btn-sm" title="Adjust balance">
                          <Wallet size={12} />
                        </button>
                        <button onClick={() => setCrediting(u)} className="btn btn-ghost btn-sm" title="Credit earnings">
                          <Coins size={12} />
                        </button>
                        <button
                          onClick={() => toggleActive(u)} disabled={busyId === u._id}
                          className={`btn btn-sm ${u.isActive ? 'btn-down' : 'btn-up'}`}
                          title={u.isActive ? 'Deactivate' : 'Reactivate'}
                        >
                          {u.isActive ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {adjusting && <AdjustModal client={adjusting} onClose={() => setAdjusting(null)} onDone={() => { setAdjusting(null); reload(); }} />}
      {crediting && <EarningsModal client={crediting} onClose={() => setCrediting(null)} onDone={() => { setCrediting(null); reload(); }} />}
      {viewing && <DetailModal client={viewing} onClose={() => setViewing(null)} />}
      {creating && <CreateModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
    </>
  );
}
