import { departmentOfficerRequest } from '../../services/asyncThunkUtils.js';

export const departmentReviewsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/department-reviews', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/department-reviews/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchByApplication: (applicationId, thunkApi) => departmentOfficerRequest(
    `/department-reviews/application/${encodeURIComponent(applicationId)}`, {}, thunkApi,
  ),
  fetchByReviewer: (reviewerId, thunkApi) => departmentOfficerRequest(
    `/department-reviews/reviewer/${encodeURIComponent(reviewerId)}`, {}, thunkApi,
  ),
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
  delete: (id, thunkApi) => departmentOfficerRequest(`/department-reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
