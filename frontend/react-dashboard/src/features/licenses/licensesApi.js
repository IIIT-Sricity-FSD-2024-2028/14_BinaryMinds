import { departmentOfficerRequest } from '../../services/asyncThunkUtils.js';

export const licensesApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/licenses', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchByApplication: (applicationId, thunkApi) => departmentOfficerRequest(
    `/licenses/application/${encodeURIComponent(applicationId)}`, {}, thunkApi,
  ),
  fetchByNumber: (licenseNumber, thunkApi) => departmentOfficerRequest(
    `/licenses/number/${encodeURIComponent(licenseNumber)}`, {}, thunkApi,
  ),
  create: ({ application_id, issued_by, expiry_date }, thunkApi) => departmentOfficerRequest('/licenses', {
    method: 'POST', body: { application_id, issued_by, expiry_date },
  }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  suspend: (id, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
  }, thunkApi),
  revoke: (id, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
  }, thunkApi),
  renew: ({ id, body }, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}/renew`, {
    method: 'POST', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/licenses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
