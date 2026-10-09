export const normalizeCustomerInput = (name, phone) => {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  const cleanPhone = String(phone || '').replace(/[\s()+-]/g, '');
  if (cleanName.length < 2 || cleanName.length > 100) {
    return { error: 'Enter your name (2 to 100 characters).' };
  }
  if (!/^\d{7,15}$/.test(cleanPhone)) {
    return { error: 'Enter a valid phone number (7 to 15 digits).' };
  }
  return { name: cleanName, phone: cleanPhone };
};
