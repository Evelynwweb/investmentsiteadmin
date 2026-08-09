import { useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { fmtUSD, fmtSigned, fmtDateTime } from '../lib/format.js';
import { PageHeader, Loading, ErrorNote, Empty, Badge, UserCell, Chips } from '../components/ui.jsx';

const STATUS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
];
const TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdraw', label: 'Withdrawals' },
  { id: 'transfer', label: 'Transfers' },
  { id: 'investment', label: 'Investments' },
  { id: 'interest', label: 'Interest' },
  { id: 'trade', label: 'Trades' },
  { id: 'dividend', label: 'Dividends' },
  { id: 'referral', label: 'Referrals' },
];

export default function Transactions() {
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const { data, loading, error } = useApi(`/api/admin/transactions?status=${status}&type=${type}`);

  const credits = (data || []).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = (data || []).filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <>
      <PageHeader title="Transactions" subtitle="The bank-wide ledger.">
        <span className="text-[12.5px] text-[color:var(--muted-dim)] self-center">
          in <span className="num" style={{ color: 'var(--up)' }}>{fmtUSD(credits)}</span>
          {' · '}out <span className="num">{fmtUSD(debits)}</span>
        </span>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-4">
        <Chips options={STATUS} value={status} onChange={setStatus} />
        <Chips options={TYPES} value={type} onChange={setType} />
      </div>
      <ErrorNote error={error} />

      {loading ? <Loading /> : (
        <div className="card overflow-x-auto mt-4">
          {!data?.length ? <Empty text="No transactions match" /> : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Description</th><th>Type</th><th>Method</th>
                  <th>Status</th><th className="text-right">Amount</th><th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t._id}>
                    <td><UserCell user={t.user} /></td>
                    <td>
                      <p className="text-[13px]">{t.label}</p>
                      <p className="text-[11px] text-[color:var(--muted-dim)]">{t.detail}</p>
                    </td>
                    <td className="text-[12px] text-[color:var(--muted)] capitalize">{t.type}</td>
                    <td className="text-[12px] text-[color:var(--muted-dim)]">{t.method || '—'}</td>
                    <td><Badge value={t.status} /></td>
                    <td className="num text-right" style={{ color: t.amount >= 0 ? 'var(--up)' : 'var(--cream)' }}>
                      {fmtSigned(t.amount)}
                    </td>
                    <td className="text-[12px] text-[color:var(--muted-dim)] whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
