import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const { admin, booting, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (booting) return null;
  if (admin) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-[380px] p-7">
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/alogo.svg" width={34} height={34} alt="" />
          <div>
            <p className="text-[15px] font-bold leading-tight">Aurivest</p>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold-bright)]">Admin</p>
          </div>
        </div>

        <h1 className="text-[18px] font-bold">Sign in</h1>
        <p className="text-[12.5px] text-[color:var(--muted-dim)] mt-1 mb-6">
          Administrator access only.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email" type="email" required autoFocus className="input"
              value={form.email}
              onChange={(e) => { setError(''); setForm((f) => ({ ...f, email: e.target.value })); }}
              placeholder="admin@aurivest.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password" type="password" required className="input"
              value={form.password}
              onChange={(e) => { setError(''); setForm((f) => ({ ...f, password: e.target.value })); }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-[12.5px] text-[color:var(--down)]">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-gold justify-center py-3">
            {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={14} />
          </button>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-[color:var(--muted-dim)] mt-6">
          <ShieldCheck size={12} className="text-[color:var(--gold-bright)]" />
          Every action here is written to the client&rsquo;s ledger.
        </p>
      </form>
    </div>
  );
}
