import { useState } from 'react';
import { Check, X, FileImage } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtDateTime } from '../lib/format.js';
import {
  PageHeader, Loading, ErrorNote, Empty, Badge, UserCell, Modal, Field, Chips,
} from '../components/ui.jsx';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

export default function Kyc() {
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useApi(`/api/admin/kyc?status=${status}`);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [docs, setDocs] = useState(null);
  const [actionError, setActionError] = useState('');

  const decide = async (row, approve, why) => {
    setBusyId(row._id);
    setActionError('');
    try {
      await api.post(`/api/admin/kyc/${row._id}/decide`, { approve, reason: why });
      setRejecting(null);
      setReason('');
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openDocs = async (row) => {
    setActionError('');
    try {
      const d = await api.get(`/api/admin/kyc/${row._id}/documents`);
      setDocs({ ...d, row });
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="KYC Review"
        subtitle="Approving unlocks withdrawals and wires. Approved documents are deleted once the decision is recorded."
      />

      <div className="mb-4"><Chips options={FILTERS} value={status} onChange={setStatus} /></div>
      <ErrorNote error={actionError ? { message: actionError } : error} />

      {loading ? <Loading /> : (
        <div className="card overflow-x-auto mt-4">
          {!data?.length ? <Empty text="Nothing to review" /> : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Declared name</th><th>Document</th>
                  <th>Status</th><th>Submitted</th><th className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r._id}>
                    <td><UserCell user={r} /></td>
                    <td>
                      <p className="text-[12.5px]">{r.kyc.fullName || '—'}</p>
                      <p className="text-[11px] text-[color:var(--muted-dim)]">
                        {r.kyc.dob || '—'}{r.kyc.address ? ` · ${r.kyc.address}` : ''}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] capitalize text-[color:var(--muted)]">
                          {(r.kyc.documentType || '—').replace(/-/g, ' ')}
                        </span>
                        {(r.kyc.hasFront || r.kyc.hasBack) && (
                          <button onClick={() => openDocs(r)} className="btn btn-ghost btn-sm">
                            <FileImage size={12} /> View
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge value={r.kyc.status} />
                      {r.kyc.rejectionReason && (
                        <p className="text-[11px] text-[color:var(--muted-dim)] mt-1 max-w-[200px]">{r.kyc.rejectionReason}</p>
                      )}
                    </td>
                    <td className="text-[12px] text-[color:var(--muted-dim)] whitespace-nowrap">
                      {r.kyc.submittedAt ? fmtDateTime(r.kyc.submittedAt) : '—'}
                    </td>
                    <td>
                      {r.kyc.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => decide(r, true)} disabled={busyId === r._id} className="btn btn-up btn-sm">
                            <Check size={12} /> Approve
                          </button>
                          <button onClick={() => { setRejecting(r); setReason(''); }} disabled={busyId === r._id} className="btn btn-down btn-sm">
                            <X size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11.5px] text-[color:var(--muted-dim)] text-right">
                          {r.kyc.reviewedAt ? fmtDateTime(r.kyc.reviewedAt) : '—'}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {rejecting && (
        <Modal title={`Reject verification — ${rejecting.name}`} onClose={() => setRejecting(null)}>
          <Field label="Reason" hint="Emailed to the client so they know what to resubmit.">
            <textarea
              autoFocus className="textarea" value={reason}
              onChange={(e) => { setActionError(''); setReason(e.target.value); }}
              placeholder="The document photo was cropped — we need all four corners visible."
            />
          </Field>
          <ErrorNote error={actionError ? { message: actionError } : null} />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setRejecting(null)} className="btn btn-ghost">Cancel</button>
            <button
              onClick={() => reason.trim().length < 3 ? setActionError('Give a reason.') : decide(rejecting, false, reason.trim())}
              disabled={busyId === rejecting._id}
              className="btn btn-down"
            >
              {busyId === rejecting._id ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}

      {docs && (
        <Modal title={`Documents — ${docs.row.name}`} onClose={() => setDocs(null)} wide>
          <div className="flex flex-col gap-4">
            {docs.front && <img src={docs.front} alt="Document front" className="w-full rounded-xl border border-[color:var(--line)]" />}
            {docs.back && <img src={docs.back} alt="Document back" className="w-full rounded-xl border border-[color:var(--line)]" />}
            {!docs.front && !docs.back && <Empty text="No images attached" />}
          </div>
        </Modal>
      )}
    </>
  );
}
