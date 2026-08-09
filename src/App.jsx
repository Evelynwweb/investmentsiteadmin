import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './auth/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Approvals from './pages/Approvals.jsx';
import Kyc from './pages/Kyc.jsx';
import Wallets from './pages/Wallets.jsx';
import Clients from './pages/Clients.jsx';
import Transactions from './pages/Transactions.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="kyc" element={<Kyc />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="clients" element={<Clients />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
