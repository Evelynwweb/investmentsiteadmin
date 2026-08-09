import { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { PageHeader, Loading, ErrorNote, Field } from '../components/ui.jsx';

const NUMBERS = [
  { key: 'minDeposit', label: 'Minimum deposit', hint: 'Smallest deposit a client may submit.' },
  { key: 'minWithdrawal', label: 'Minimum withdrawal', hint: 'Smallest withdrawal a client may request.' },
  { key: 'minTransfer', label: 'Minimum transfer', hint: 'Applies to internal and external transfers.' },
  { key: 'referralReward', label: 'Referral reward', hint: 'Paid when a referred client first funds their account.' },
  {
    key: 'autoApproveDepositUnder',
    label: 'Auto-approve deposits under',
    hint: 'Deposits below this clear instantly. Set 0 to review every deposit by hand.',
  },
];

export default function Settings() {
  const { data, loading, error, reload } = useApi('/api/admin/settings');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { if (data) setForm(data); }, [data]);

  if (loading || !form) return <Loading />;
  if (error) return <ErrorNote error={error} />;

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSaved(false);
    setSaveError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaveError('');
    try {
      const payload = { ...form };
      for (const { key } of NUMBERS) payload[key] = Number(payload[key]) || 0;
      await api.put('/api/admin/settings', payload);
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const autoApprove = Number(form.autoApproveDepositUnder) > 0;

  return (
    <>
      <PageHeader title="Settings" subtitle="Platform-wide limits and rewards. Changes take effect within ten seconds." />

      <form onSubmit={save} className="card p-6 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-5">
          {NUMBERS.map((n) => (
            <Field key={n.key} label={n.label} hint={n.hint}>
              <input
                className="input num" inputMode="decimal"
                value={form[n.key] ?? 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '');
                  setSaved(false); setSaveError('');
                  setForm((f) => ({ ...f, [n.key]: v }));
                }}
              />
            </Field>
          ))}
        </div>

        {autoApprove && (
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mt-5" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)' }}>
            <AlertTriangle size={15} className="text-[color:var(--gold-bright)] shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-[color:var(--muted)]">
              Deposits under {form.autoApproveDepositUnder} will credit balances with no human review.
              Only raise this above 0 if you have another control confirming the money actually arrived.
            </p>
          </div>
        )}

        <div className="border-t border-[color:var(--line-soft)] mt-6 pt-5 flex flex-col gap-4">

          <Field label="Support email">
            <input className="input" type="email" value={form.supportEmail || ''} onChange={set('supportEmail')} />
          </Field>
        </div>

        <ErrorNote error={saveError ? { message: saveError } : null} />

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={busy} className="btn btn-gold">
            {busy ? 'Saving…' : 'Save settings'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--up)' }}>
              <Check size={13} /> Saved
            </span>
          )}
        </div>
      </form>
    </>
  );
}
