import { departmentOfficerRequest } from '../store/requestUtils.js';

export const applicationsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/applications', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/applications/${encodeURIComponent(id)}`, {}, thunkApi),
  assign: ({ id, officerId }, thunkApi) => departmentOfficerRequest(`/applications/${encodeURIComponent(id)}/assign`, {
    method: 'PATCH', body: { officerId: Number(officerId) },
  }, thunkApi),
  create: (body, thunkApi) => departmentOfficerRequest('/applications', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
