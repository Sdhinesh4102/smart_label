export const nextInvoiceNumber = (numbers = []) => {
  const highest = numbers.reduce((max, value) => {
    const match = /^INV-(\d+)$/i.exec(String(value || '').trim());
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `INV-${String(highest + 1).padStart(4, '0')}`;
};
