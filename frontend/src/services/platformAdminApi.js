const API_BASE = 'http://localhost:3000/api';

export async function platformAdminRequest(path, options = {}) {
  const token = sessionStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return payload?.data ?? payload;
}

