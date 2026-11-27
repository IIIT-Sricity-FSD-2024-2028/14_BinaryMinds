import { departmentOfficerBinaryRequest, departmentOfficerRequest } from '../../services/asyncThunkUtils.js';

export const inspectionsApi = {
  fetchAll: (_argument, thunkApi) => departmentOfficerRequest('/inspections', {}, thunkApi),
  fetchByFieldOfficer: (fieldOfficerId, thunkApi) => departmentOfficerRequest(
    `/inspections/field-officer/${encodeURIComponent(fieldOfficerId)}`, {}, thunkApi,
  ),
  fetchByAssignment: (assignmentId, thunkApi) => departmentOfficerRequest(
    `/inspections/assignment/${encodeURIComponent(assignmentId)}`, {}, thunkApi,
  ),
  fetchById: (id, thunkApi) => departmentOfficerRequest(`/inspections/${encodeURIComponent(id)}`, {}, thunkApi),
  fetchEvidence: ({ inspectionId, filename }, thunkApi) => departmentOfficerBinaryRequest(
    `/inspections/${encodeURIComponent(inspectionId)}/evidence/${encodeURIComponent(filename)}`,
    {},
    thunkApi,
  ),
  create: (body, thunkApi) => departmentOfficerRequest('/inspections', { method: 'POST', body }, thunkApi),
  update: ({ id, body }, thunkApi) => departmentOfficerRequest(`/inspections/${encodeURIComponent(id)}`, {
    method: 'PATCH', body,
  }, thunkApi),
  submitReport: ({ id, notes, status, report_url, evidence = [] }, thunkApi) => {
    const body = new FormData();
    body.append('notes', notes);
    body.append('status', status);
    if (report_url !== undefined) body.append('report_url', report_url);
    evidence.forEach((file) => body.append('evidence', file));
    return departmentOfficerRequest(`/inspections/${encodeURIComponent(id)}/report`, {
      method: 'POST', body,
    }, thunkApi);
  },
  delete: (id, thunkApi) => departmentOfficerRequest(`/inspections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, thunkApi),
};
