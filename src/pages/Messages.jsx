import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { fmtDateTime } from '../lib/format.js';
import {
  PageHeader, Loading, ErrorNote, Empty, Badge, UserCell, Modal, Field, Chips,
} from '../components/ui.jsx';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'read', label: 'Read' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
];

export default function Messages() {
  const [status, setStatus] = useState('open');
  const { data, loading, error, reload } = useApi(`/api/admin/support?status=${status}`);
  const [replying, setReplying] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const send = async () => {
    if (reply.trim().length < 2) { setActionError('Write a reply first.'); return; }
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/api/admin/support/${replying._id}/reply`, { reply: reply.trim() });
      setReplying(null);
      setReply('');
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const mark = async (m, next) => {
    setActionError('');
    try {
      await api.patch(`/api/admin/support/${m._id}`, { status: next });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const messages = data?.messages || [];

  return (
    <>
      <PageHeader title="Messages" subtitle="Client tickets. Replying emails them and closes the ticket." />

      <div className="mb-4"><Chips options={FILTERS} value={status} onChange={setStatus} /></div>
      <ErrorNote error={actionError ? { message: actionError } : error} />

      {loading ? <Loading /> : (
        <div className="flex flex-col gap-3 mt-4">
          {!messages.length ? <div className="card"><Empty text="No messages here" /></div> : messages.map((m) => (
            <div key={m._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <UserCell user={m.user} />
                <div className="flex items-center gap-2">
                  <Badge value={m.status} />
                  <span className="text-[11.5px] text-[color:var(--muted-dim)]">{fmtDateTime(m.createdAt)}</span>
                </div>
              </div>
              <p className="text-[13.5px] font-semibold mt-3">{m.subject}</p>
              <p className="text-[13px] text-[color:var(--muted)] mt-1.5 leading-relaxed whitespace-pre-wrap">{m.body}</p>

              {m.reply && (
                <div className="mt-4 pt-3 border-t border-[color:var(--line-soft)]">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--gold-bright)] mb-1.5">Your reply</p>
                  <p className="text-[13px] text-[color:var(--muted)] leading-relaxed whitespace-pre-wrap">{m.reply}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {m.status !== 'resolved' && (
                  <button onClick={() => { setReplying(m); setReply(''); }} className="btn btn-gold btn-sm">
                    <Send size={12} /> Reply
                  </button>
                )}
                {m.status === 'open' && (
                  <button onClick={() => mark(m, 'read')} className="btn btn-ghost btn-sm">
                    <Check size={12} /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <Modal title={`Reply — ${replying.subject}`} onClose={() => setReplying(null)}>
          <p className="text-[12.5px] text-[color:var(--muted-dim)] mb-4 leading-relaxed">{replying.body}</p>
          <Field label="Your reply" hint="Emailed to the client and stored on the ticket.">
            <textarea
              autoFocus className="textarea" value={reply}
              onChange={(e) => { setActionError(''); setReply(e.target.value); }}
            />
          </Field>
          <ErrorNote error={actionError ? { message: actionError } : null} />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setReplying(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={send} disabled={busy} className="btn btn-gold">
              {busy ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
