export const getDeviceToken = (qrId) => {
  const key = `smart-label:scan:${qrId}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    window.localStorage.setItem(key, token);
    return token;
  } catch {
    // A private browser may block storage. The reveal still works once, but a
    // refresh cannot prove that it is the same phone.
    return `${crypto.randomUUID()}${crypto.randomUUID()}`;
  }
};
