import { departmentOfficerBinaryRequest, departmentOfficerRequest } from '../store/requestUtils.js';

export const documentsApi = {
  fetchByApplication: (applicationId, thunkApi) => departmentOfficerRequest(
    `/documents/application/${encodeURIComponent(applicationId)}`, {}, thunkApi,
  ),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/documents/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchPreview: ({ id }, thunkApi) => departmentOfficerBinaryRequest(
    `/documents/${encodeURIComponent(id)}/file`, {}, thunkApi,
  ),
  fetchDownload: ({ id }, thunkApi) => departmentOfficerBinaryRequest(
    `/documents/${encodeURIComponent(id)}/download`, {}, thunkApi,
  ),
  create: ({ application_id, document_type, file }, thunkApi) => {
    const body = new FormData();
    body.append('application_id', String(application_id));
    body.append('document_type', document_type);
    body.append('file', file);
    return departmentOfficerRequest('/documents', { method: 'POST', body }, thunkApi);
  },
  updateStatus: ({ id, status, rejection_reason }, thunkApi) => departmentOfficerRequest(
    `/documents/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: { status, rejection_reason } },
    thunkApi,
  ),
  delete: (id, thunkApi) => departmentOfficerRequest(`/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
