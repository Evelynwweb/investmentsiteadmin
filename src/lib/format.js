export const fmtUSD = (n, opts = {}) => {
  const o = { minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts };
  if (o.minimumFractionDigits > o.maximumFractionDigits) o.minimumFractionDigits = o.maximumFractionDigits;
  return (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', ...o });
};

export const fmtSigned = (n) => `${n < 0 ? '-' : '+'}${fmtUSD(Math.abs(n))}`;

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const timeAgo = (d) => {
  const secs = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 86400 * 30) return `${Math.floor(secs / 86400)}d ago`;
  return fmtDate(d);
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
