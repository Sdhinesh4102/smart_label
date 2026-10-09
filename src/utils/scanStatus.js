const QR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidQrId = (id) => QR_ID_PATTERN.test(id || '');

export const classifyScan = (clientId, qrId, details) => {
  if (!clientId || !isValidQrId(qrId)) return 'invalid';
  // Older printed losing QRs were not stored. They must remain non-winning.
  if (!details) return 'legacy_loser';
  if (details.clientId !== clientId) return 'invalid';
  if (details.isClaimed) return 'claimed';
  return details.isWinner ? 'winner' : 'loser';
};
