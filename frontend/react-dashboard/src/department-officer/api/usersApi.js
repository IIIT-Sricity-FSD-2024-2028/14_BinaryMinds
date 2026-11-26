import { departmentOfficerRequest } from '../store/requestUtils.js';

export const usersApi = {
  fetchProfile: (_argument, thunkApi) => departmentOfficerRequest('/users/me', {}, thunkApi),
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/users', {}, thunkApi),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {}, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT', body,
  }, thunkApi),
  delete: (id, thunkApi) => departmentOfficerRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
