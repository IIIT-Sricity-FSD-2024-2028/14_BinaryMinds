import { selectAccessToken } from '../features/auth/authSelectors.js';
import { API_BASE } from './apiClient.js';
import { clearSessionOnUnauthorized } from './unauthorizedSession.js';

export async function platformAdminRequest(path, options = {}, thunkApi) {
  const token = thunkApi ? selectAccessToken(thunkApi.getState()) : null;
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else headers.delete('Authorization');
  let body = options.body;
  if (body !== undefined && typeof body !== 'string' && !isFormData) body = JSON.stringify(body);
  const response = await fetch(`${API_BASE}/${path}`, { ...options, headers, body, signal: thunkApi?.signal });
  if (thunkApi) clearSessionOnUnauthorized(response, thunkApi);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return payload?.data ?? payload;
}

