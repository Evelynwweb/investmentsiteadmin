# Betament Admin

The back-office panel for the Betament platform — approvals, KYC review, lending decisions,
client management and platform settings.

Same amber palette as the client app, retuned for dense admin surfaces: flatter, higher
contrast, no glow.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Runs on port 5174 so it can sit alongside the client app on 5173. Point it at the API with
`VITE_API_URL` (defaults to `http://localhost:5000`).

Sign in with an account whose role is `admin` — see the backend README for creating the first one.
A client token is rejected at the login screen and again on rehydration, so a non-admin session
can never light up this shell.

## Screens

| Screen | What it does |
| --- | --- |
| **Dashboard** | AUM, deposits, invested capital, credit outstanding, and the work queue |
| **Approvals** | Pending deposits, withdrawals and outbound transfers, with payment proofs |
| **KYC Review** | Identity documents, approve or reject with a reason |
| **Loans** | Applications; approving draws the funds into the client's checking account |
| **Mandates** | Every investment subscription and its accrual to date |
| **Clients** | Search, open accounts, adjust balances, credit earnings, deactivate |
| **Transactions** | The bank-wide ledger with status and type filters |
| **Messages** | Client tickets; replying emails them and closes the ticket |
| **Payment Methods** | The funding rails clients see on deposit and withdrawal screens |
| **Settings** | Limits, opening gift, referral reward, auto-approval threshold |

## Things worth knowing before you click

- **Approving a deposit credits the client.** Pending deposits never moved the balance.
- **Rejecting a withdrawal refunds it.** The funds were held when the client requested it,
  so a rejection writes a reversal row and hands the money back.
- **Approving a loan draws the full amount down immediately** into the client's checking account.
- **Balance adjustments require a reason**, and it appears in the client's own ledger. They will read it.
- **Approved KYC documents are deleted** once the decision is recorded — they have served their purpose.
- **Auto-approve deposits is off by default.** Raising it above 0 credits balances with no human
  review; only do that if another control confirms the money actually arrived.
