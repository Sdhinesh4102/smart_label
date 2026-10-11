import React, { useState } from 'react';
import { redeemTicketAsync, verifyTicketAsync } from '../utils/api';

const messages = {
  redeemed: 'Redeemed successfully. Give the customer the verified offer now.',
  already_redeemed: 'This ticket has already been redeemed. Do not give the offer again.',
  invalid: 'Ticket not found. Check the full code on the customer phone.',
  unauthorized: 'This account cannot redeem this shop ticket.'
};

export default function TicketRedemption() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [working, setWorking] = useState(false);

  const verify = async event => {
    event.preventDefault();
    if (working || !code.trim()) return;
    setWorking(true);
    setResult(null);
    setVerifiedCode('');
    try {
      const response = await verifyTicketAsync(code.trim().toUpperCase());
      setResult(response);
      if (response.status === 'ready') setVerifiedCode(response.ticket_code);
    } catch {
      setResult({ status: 'error' });
    } finally {
      setWorking(false);
    }
  };

  const redeem = async () => {
    if (!verifiedCode || working) return;
    setWorking(true);
    try {
      const response = await redeemTicketAsync(verifiedCode);
      setResult(response);
      setVerifiedCode('');
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
      <form onSubmit={verify} style={{ display: 'grid', gap: '1rem' }}>
        <label htmlFor="ticket-code">Ticket code</label>
        <input id="ticket-code" type="text" value={code} onChange={event => { setCode(event.target.value); setVerifiedCode(''); setResult(null); }}
          maxLength={24} autoComplete="off" placeholder="SL-..." required />
        <button className="btn btn-primary" disabled={working}>{working ? 'Checking...' : 'Verify Ticket'}</button>
      </form>
      {result?.status === 'ready' && <div style={{ marginTop: '1rem' }}>
        <p><strong>Store:</strong> {result.store_name}</p>
        <p><strong>Offer:</strong> {result.offer_text || result.coupon_code || 'Store reward'}</p>
        <p>Match this with the customer screen, then confirm.</p>
        <button className="btn btn-primary" onClick={redeem} disabled={working}>Confirm Redemption</button>
      </div>}
      {result && <p role="status" style={{ marginTop: '1rem', fontWeight: 700,
        color: result.status === 'redeemed' ? '#047857' : '#b91c1c' }}>
        {result.status === 'ready' ? 'Ticket is valid and not yet redeemed.' :
          messages[result.status] || 'Could not verify. Please retry; do not give the offer until confirmed.'}
      </p>}
    </section>
  );
}
