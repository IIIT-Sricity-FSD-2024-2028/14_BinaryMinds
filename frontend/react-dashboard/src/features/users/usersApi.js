import { departmentOfficerRequest } from '../../services/asyncThunkUtils.js';

export const usersApi = {
  fetchProfile: (_argument, thunkApi) => departmentOfficerRequest('/users/me', {}, thunkApi),
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/users', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {}, thunkApi),
  create: (body, thunkApi) => departmentOfficerRequest('/users', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
