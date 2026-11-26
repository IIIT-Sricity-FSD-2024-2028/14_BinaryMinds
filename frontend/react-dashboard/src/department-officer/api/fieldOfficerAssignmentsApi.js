import { departmentOfficerRequest } from '../store/requestUtils.js';

export const fieldOfficerAssignmentsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/field-officer-assignments', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {}, thunkApi),
  create: (body, thunkApi) => departmentOfficerRequest('/field-officer-assignments', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
