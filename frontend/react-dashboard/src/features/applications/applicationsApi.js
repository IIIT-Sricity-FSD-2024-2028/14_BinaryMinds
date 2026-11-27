import { selectAccessToken, selectCurrentRole } from '../auth/authSelectors.js';
import { API_BASE } from '../../services/apiClient.js';
import { clearSessionOnUnauthorized } from '../../services/unauthorizedSession.js';

async function request(path, options = {}, thunkApi, { applicantOnly = false } = {}) {
  const { getState, signal, rejectWithValue } = thunkApi;
  if (applicantOnly && selectCurrentRole(getState()) !== 'applicant') {
    return rejectWithValue({ status: 403, message: 'Only applicants can perform this operation.' });
  }

  const headers = new Headers(options.headers || {});
  const token = selectAccessToken(getState());
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let body;
  if (isFormData) body = options.body;
  else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body,
      signal,
    });
    clearSessionOnUnauthorized(response, thunkApi);
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(payload?.message)
        ? payload.message.join(' ')
        : payload?.message || payload?.error;
      return rejectWithValue({
        status: response.status,
        message: message || `Request failed (${response.status}).`,
        data: payload,
      });
    }
    return payload;
  } catch (error) {
    return rejectWithValue({ message: error?.message || 'The request could not be completed.' });
  }
}

export const applicationsApi = {
  fetchAll: (_argument, thunkApi) => request('/applications', {}, thunkApi),
  fetchSubmitted: (_argument, thunkApi) => request('/applications/submitted', {}, thunkApi),
  fetchMine: (_argument, thunkApi) => request('/applications/mine', {}, thunkApi, { applicantOnly: true }),
  fetchByApplicant: (applicantId, thunkApi) => request(
    `/applications/applicant/${encodeURIComponent(applicantId)}`, {}, thunkApi,
  ),
  fetchById: (id, thunkApi) => request(`/applications/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchByFieldOfficer: (officerId, thunkApi) => request(
    `/applications/officer/${encodeURIComponent(officerId)}`,
    {},
    thunkApi,
  ),
  verify: (id, thunkApi) => request(
    `/applications/${encodeURIComponent(id)}/verify`,
    { method: 'PATCH' },
    thunkApi,
  ),
  assign: ({ id, officerId }, thunkApi) => request(
    `/applications/${encodeURIComponent(id)}/assign`,
    { method: 'PATCH', body: { officerId: officerId == null || officerId === '' ? undefined : Number(officerId) } },
    thunkApi,
  ),
  create: (body, thunkApi) => request('/applications', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => request(
    `/applications/${encodeURIComponent(id)}`,
    { method: 'PATCH', body },
    thunkApi,
  ),
  delete: (id, thunkApi) => request(
    `/applications/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    thunkApi,
  ),
};
