import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Bitcoin, Copy, EyeOff } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { PageHeader, Loading, ErrorNote, Empty, Modal, Field } from '../components/ui.jsx';

/* ============================================================
   Receiving wallets — the addresses clients send crypto to.

   Whatever is published here is exactly what appears on the client
   Funding screen, so an address typo is a lost deposit. Deactivate a
   route rather than deleting it if funds may still be in flight.
   ============================================================ */

const FIELDS = [
  ['asset', 'Asset ticker', 'USDT'],
  ['name', 'Display name', 'Tether USD'],
  ['network', 'Network', 'TRC-20'],
  ['address', 'Receiving address', 'TQm5rV8xLc2FbNw9YePd3JhKzS6uA4gWnX'],
  ['memoLabel', 'Memo label (if the chain needs one)', 'Destination tag'],
  ['memo', 'Memo / tag value', ''],
  ['confirmations', 'Confirmations quoted to the client', '19 confirmations'],
];

const BLANK = {
  asset: '', name: '', network: '', address: '', memo: '', memoLabel: '',
  confirmations: '2–6 confirmations', minDeposit: 50, scope: 'both', sortOrder: 0,
  notes: '', isActive: true,
};

export default function Wallets() {
  const { data, loading, error, reload } = useApi('/api/admin/wallets');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => { if (editing && editing !== 'new') setForm(editing); }, [editing]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  const set = (k) => (e) => {
    setSaveError('');
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaveError('');
    try {
      const payload = { ...form, minDeposit: Number(form.minDeposit) || 0, sortOrder: Number(form.sortOrder) || 0 };
      if (editing === 'new') await api.post('/api/admin/wallets', payload);
      else await api.patch(`/api/admin/wallets/${editing._id}`, payload);
      setEditing(null);
      setForm(BLANK);
      reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row) => {
    await api.patch(`/api/admin/wallets/${row._id}`, { isActive: !row.isActive });
    reload();
  };

  const remove = async (row) => {
    if (!window.confirm(
      `Delete the ${row.asset} address on ${row.network}? Any deposit already sent to it will not be matched. Deactivate it instead if funds may still be in flight.`
    )) return;
    await api.del(`/api/admin/wallets/${row._id}`);
    reload();
  };

  const copy = async (row) => {
    try {
      await navigator.clipboard.writeText(row.address);
      setCopied(row._id);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <>
      <PageHeader
        title="Receiving Wallets"
        subtitle="The crypto addresses clients deposit to. Published live — check every character before saving."
      >
        <button onClick={() => { setForm(BLANK); setEditing('new'); }} className="btn btn-gold">
          <Plus size={14} /> Add wallet
        </button>
      </PageHeader>

      {data.length === 0 ? (
        <div className="card"><Empty text="No wallets published — clients cannot deposit" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((row) => (
            <div key={row._id} className="card p-5" style={row.isActive ? undefined : { opacity: 0.55 }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Bitcoin size={16} style={{ color: 'var(--gold-bright)' }} />
                  <div>
                    <p className="text-[14px] font-bold">{row.asset} · {row.network}</p>
                    <p className="text-[11.5px] text-[color:var(--muted-dim)]">
                      {row.name}{row.isActive ? '' : ' · hidden from clients'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(row)} className="btn btn-ghost btn-sm">
                    {row.isActive ? <><EyeOff size={13} /> Hide</> : 'Publish'}
                  </button>
                  <button onClick={() => setEditing(row)} className="btn btn-ghost btn-sm">Edit</button>
                  <button onClick={() => remove(row)} className="btn btn-down btn-sm" aria-label="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <button onClick={() => copy(row)}
                className="w-full flex items-start gap-2 text-left p-2.5 rounded-lg mb-3"
                style={{ background: 'var(--line-soft)' }}>
                <span className="num text-[12px] break-all flex-1">{row.address}</span>
                {copied === row._id ? <Check size={13} style={{ color: 'var(--up)' }} /> : <Copy size={13} className="opacity-60" />}
              </button>

              {[['Memo', row.memo ? `${row.memoLabel || 'Memo'}: ${row.memo}` : '—'],
                ['Confirmations', row.confirmations],
                ['Minimum', `$${row.minDeposit}`],
                ['Scope', row.scope]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-1.5 text-[12.5px] border-b border-[color:var(--line-soft)] last:border-0">
                  <span className="text-[color:var(--muted-dim)]">{k}</span>
                  <span className="num text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add receiving wallet' : 'Edit receiving wallet'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(([key, label, placeholder]) => (
              <Field key={key} label={label}>
                <input className={`input${key === 'address' ? ' num' : ''}`} value={form[key] || ''}
                  onChange={set(key)} placeholder={placeholder} />
              </Field>
            ))}
            <Field label="Minimum deposit (USD)">
              <input className="input num" value={form.minDeposit} onChange={set('minDeposit')} inputMode="decimal" />
            </Field>
            <Field label="Sort order">
              <input className="input num" value={form.sortOrder} onChange={set('sortOrder')} inputMode="numeric" />
            </Field>
            <Field label="Shown for">
              <select className="input" value={form.scope} onChange={set('scope')}>
                <option value="both">Deposits and withdrawals</option>
                <option value="deposit">Deposits only</option>
                <option value="withdraw">Withdrawals only</option>
              </select>
            </Field>
            <Field label="Published">
              <label className="flex items-center gap-2 text-[13px] pt-2">
                <input type="checkbox" checked={!!form.isActive} onChange={set('isActive')} />
                Visible to clients
              </label>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes shown to the client">
                <textarea className="textarea" value={form.notes || ''} onChange={set('notes')}
                  placeholder="Send only on this network. Anything else is unrecoverable." />
              </Field>
            </div>
            <ErrorNote error={saveError ? { message: saveError } : null} />
            <div className="sm:col-span-2 flex gap-3 mt-1">
              <button type="submit" disabled={busy} className="btn btn-gold">
                {busy ? 'Saving…' : <><Check size={14} /> Save wallet</>}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
