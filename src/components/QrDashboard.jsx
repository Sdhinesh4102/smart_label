import React, { useEffect, useState } from 'react';
import { getQrDashboardStatsAsync } from '../utils/api';

export default function QrDashboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = () => {
    setLoading(true);
    setError('');
    getQrDashboardStatsAsync().then(setRows).catch(() => setError('Could not load QR results.'))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  return <section className="card glass-card" style={{ padding: '1.5rem' }}>
    <h2>QR Results</h2>
    <p>Saved stickers, prizes revealed, and rewards redeemed at the cashier.</p>
    <button className="btn btn-secondary" onClick={refresh} disabled={loading}>Refresh</button>
    {error && <p role="alert">{error}</p>}
    {!loading && !error && <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', textAlign: 'left' }}>
        <thead><tr><th>Store</th><th>QR stickers</th><th>Winners</th><th>Revealed</th><th>Redeemed</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.store_id}>
          <td>{row.store_name}</td><td>{row.total_qrs}</td><td>{row.winners}</td>
          <td>{row.revealed}</td><td>{row.redeemed}</td>
        </tr>)}</tbody>
      </table>
      {rows.length === 0 && <p>No stores yet.</p>}
    </div>}
  </section>;
}
