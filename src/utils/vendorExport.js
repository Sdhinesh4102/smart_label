export const csvCell = (value) => {
  const text = String(value ?? '');
  // Spreadsheet programs can interpret untrusted shop names as formulas.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

export const createVendorCsv = ({ runId, clientName, promoText, codes }) => {
  const rows = [
    ['run_id', 'sticker_number', 'store_name', 'qr_url', 'promo_text', 'width_mm', 'height_mm']
  ];
  for (const code of codes) {
    rows.push([runId, code.stickerNumber, clientName, code.targetUrl, promoText, 50, 30]);
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
};
