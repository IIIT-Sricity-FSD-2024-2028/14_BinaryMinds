import { departmentOfficerRequest } from '../../services/asyncThunkUtils.js';

export const fieldOfficerAssignmentsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/field-officer-assignments', {}, thunkApi),
  fetchByApplication: (applicationId, thunkApi) => departmentOfficerRequest(
    `/field-officer-assignments/application/${encodeURIComponent(applicationId)}`, {}, thunkApi,
  ),
  fetchByFieldOfficer: (fieldOfficerId, thunkApi) => departmentOfficerRequest(
    `/field-officer-assignments/field-officer/${encodeURIComponent(fieldOfficerId)}`, {}, thunkApi,
  ),
  recoverForApplication: ({ applicationId }, thunkApi) => departmentOfficerRequest(
    `/field-officer-assignments/application/${encodeURIComponent(applicationId)}/recover`, { method: 'POST' }, thunkApi,
  ),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchSla: (id, thunkApi) => departmentOfficerRequest(
    `/field-officer-assignments/${encodeURIComponent(id)}/sla`, {}, thunkApi,
  ),
  create: (body, thunkApi) => departmentOfficerRequest('/field-officer-assignments', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/field-officer-assignments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
