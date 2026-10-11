import React, { useState } from 'react';
import { redeemTicketAsync } from '../utils/api';

const messages = {
  redeemed: 'Verified. Give the customer their offer now.',
  already_redeemed: 'This ticket has already been redeemed. Do not give the offer again.',
  invalid: 'Ticket not found. Check the full code on the customer phone.',
  unauthorized: 'This account cannot redeem this shop ticket.'
};

export default function TicketRedemption() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [working, setWorking] = useState(false);

  const redeem = async event => {
    event.preventDefault();
    if (working || !code.trim()) return;
    setWorking(true);
    setResult(null);
    try {
      setResult(await redeemTicketAsync(code.trim().toUpperCase()));
    } catch {
      setResult({ status: 'error' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="card glass-card" style={{ maxWidth: 560, margin: '2rem auto', padding: '2rem' }}>
      <h2>Redeem Customer Ticket</h2>
      <p>Ask the customer to show the ticket on their phone. Type its full code here before giving the reward.</p>
      <form onSubmit={redeem} style={{ display: 'grid', gap: '1rem' }}>
        <label htmlFor="ticket-code">Ticket code</label>
        <input id="ticket-code" type="text" value={code} onChange={event => setCode(event.target.value)}
          maxLength={24} autoComplete="off" placeholder="SL-..." required />
        <button className="btn btn-primary" disabled={working}>{working ? 'Checking...' : 'Verify & Redeem'}</button>
      </form>
      {result && <p role="status" style={{ marginTop: '1rem', fontWeight: 700,
        color: result.status === 'redeemed' ? '#047857' : '#b91c1c' }}>
        {messages[result.status] || 'Could not verify. Please retry; do not give the offer until confirmed.'}
      </p>}
    </section>
  );
}
