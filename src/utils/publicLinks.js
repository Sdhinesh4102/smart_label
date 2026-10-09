export const safeHttpUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const socialUrl = (platform, handle) => {
  if (typeof handle !== 'string') return null;
  const cleaned = handle.trim().replace(/^@/, '');
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(cleaned)) return null;
  const domains = { instagram: 'instagram.com', facebook: 'facebook.com' };
  return domains[platform] ? `https://${domains[platform]}/${encodeURIComponent(cleaned)}` : null;
};

export const whatsappUrl = (phone, message) => {
  const digits = String(phone || '').replace(/[\s+()-]/g, '');
  if (!/^\d{7,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
