import { useState } from 'react';
import { Check, X, Receipt, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtUSD, fmtSigned, fmtDateTime } from '../lib/format.js';
import {
  PageHeader, Loading, ErrorNote, Empty, Badge, UserCell, Modal, Field, Chips,
} from '../components/ui.jsx';

const FILTERS = [
  { id: 'all', label: 'All pending' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdraw', label: 'Withdrawals' },
  { id: 'transfer', label: 'Transfers' },
];

export default function Approvals() {
  const [type, setType] = useState('all');
  const { data, loading, error, reload } = useApi(`/api/admin/transactions?status=pending&type=${type}`);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState(null);
  const [actionError, setActionError] = useState('');

  const approve = async (t) => {
    setBusyId(t._id);
    setActionError('');
    try {
      await api.post(`/api/admin/transactions/${t._id}/approve`);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (reason.trim().length < 3) { setActionError('Give a reason.'); return; }
    setBusyId(rejecting._id);
    setActionError('');
    try {
      await api.post(`/api/admin/transactions/${rejecting._id}/reject`, { reason: reason.trim() });
      setRejecting(null);
      setReason('');
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openProof = async (t) => {
    setActionError('');
    try {
      const p = await api.get(`/api/admin/transactions/${t._id}/proof`);
      setProof({ ...p, txn: t });
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle="Deposits credit on approval. Withdrawals and outbound transfers already hold the funds — rejecting one refunds it."
      />

      <div className="mb-4"><Chips options={FILTERS} value={type} onChange={setType} /></div>
      <ErrorNote error={actionError ? { message: actionError } : error} />

      {loading ? <Loading /> : (
        <div className="card overflow-x-auto mt-4">
          {!data?.length ? <Empty text="Nothing waiting — the queue is clear" /> : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Request</th><th>Method</th>
                  <th className="text-right">Amount</th><th>Submitted</th><th className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t._id}>
                    <td><UserCell user={t.user} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Badge value={t.type} />
                        {t.hasProof && (
                          <button onClick={() => openProof(t)} className="btn btn-ghost btn-sm">
                            <Receipt size={12} /> Proof
                          </button>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[color:var(--muted-dim)] mt-1">{t.detail}</p>
                    </td>
                    <td className="text-[12px] text-[color:var(--muted)]">{t.method || '—'}</td>
                    <td className="num text-right" style={{ color: t.amount >= 0 ? 'var(--up)' : 'var(--cream)' }}>
                      {fmtSigned(t.amount)}
                      {t.fee > 0 && <p className="text-[10.5px] text-[color:var(--muted-dim)]">fee {fmtUSD(t.fee)}</p>}
                    </td>
                    <td className="text-[12px] text-[color:var(--muted-dim)] whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => approve(t)} disabled={busyId === t._id}
                          className="btn btn-up btn-sm"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => { setRejecting(t); setReason(''); setActionError(''); }}
                          disabled={busyId === t._id}
                          className="btn btn-down btn-sm"
                        >
                          <X size={12} /> Reject
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

      {rejecting && (
        <Modal title="Reject request" onClose={() => setRejecting(null)}>
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-4" style={{ background: 'rgba(240,82,95,.08)', border: '1px solid rgba(240,82,95,.3)' }}>
            <AlertTriangle size={15} className="text-[color:var(--down)] shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-[color:var(--muted)]">
              {rejecting.amount < 0
                ? `${fmtUSD(Math.abs(rejecting.amount))} was held when this was requested — rejecting refunds it to the client's account.`
                : 'This deposit was never credited, so rejecting simply closes it.'}
            </p>
          </div>
          <Field label="Reason (shown to the client)">
            <textarea
              autoFocus className="textarea" value={reason}
              onChange={(e) => { setActionError(''); setReason(e.target.value); }}
              placeholder="We could not verify the payment source."
            />
          </Field>
          <ErrorNote error={actionError ? { message: actionError } : null} />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setRejecting(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={confirmReject} disabled={busyId === rejecting._id} className="btn btn-down">
              {busyId === rejecting._id ? 'Rejecting…' : 'Reject request'}
            </button>
          </div>
        </Modal>
      )}

      {proof && (
        <Modal title="Payment proof" onClose={() => setProof(null)} wide>
          <p className="text-[12.5px] text-[color:var(--muted-dim)] mb-3">
            {proof.txn.label} · {fmtUSD(Math.abs(proof.txn.amount))}
            {proof.uploadedAt ? ` · uploaded ${fmtDateTime(proof.uploadedAt)}` : ''}
          </p>
          <img src={proof.proof} alt="Payment proof" className="w-full rounded-xl border border-[color:var(--line)]" />
        </Modal>
      )}
    </>
  );
}
