import { departmentOfficerRequest } from '../store/requestUtils.js';

export const departmentReviewsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/department-reviews', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/department-reviews/${encodeURIComponent(id)}`, {}, thunkApi),
  create: (body, thunkApi) => departmentOfficerRequest('/department-reviews', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/department-reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  recordDecision: ({ applicationId, status, comments }, thunkApi) => departmentOfficerRequest(
    `/department-reviews/application/${encodeURIComponent(applicationId)}/decision`,
    { method: 'POST', body: { status, comments } },
    thunkApi,
  ),
  sign: ({ id, digital_signature }, thunkApi) => departmentOfficerRequest(`/department-reviews/${encodeURIComponent(id)}/sign`, {
    method: 'POST', body: { digital_signature },
  }, thunkApi),
};
