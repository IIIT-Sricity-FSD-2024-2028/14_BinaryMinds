import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

/**
 * Create an axios instance that attaches the authenticated bearer token.
 */
function createClient() {
  const client = axios.create({ baseURL: API_BASE });

  client.interceptors.request.use((config) => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  });

  return client;
}

// ── Superuser APIs ──────────────────────────────────────────────────────

const superuserClient = createClient();

export const getSubmittedApplications = () =>
  superuserClient.get('/applications/submitted').then((r) => r.data);

export const getOfficers = () =>
  superuserClient.get('/officers').then((r) => r.data);

export const assignApplication = (id, officerId) =>
  superuserClient.patch(`/applications/${id}/assign`, { officerId }).then((r) => r.data);

export const createApplication = (applicantName) =>
  superuserClient
    .post('/applications', { applicantName })
    .then((r) => r.data);

// Municipal Commissioner portal APIs use the same request-time token client.
const commissionerClient = createClient();

export const getCommissionerProfile = () => commissionerClient.get('/users/me').then((r) => r.data);
export const getCommissionerUsers = () => commissionerClient.get('/users').then((r) => r.data);
export const getCommissionerDepartmentOfficer = () => commissionerClient.get('/users/department-officer').then((r) => r.data);
export const createCommissionerUser = (body) => commissionerClient.post('/users', body).then((r) => r.data);
export const saveCommissionerDepartmentOfficer = (body, replace) =>
  commissionerClient.post(`/users/department-officer${replace ? '/replace' : ''}`, body).then((r) => r.data);
export const deleteCommissionerUser = (id) => commissionerClient.delete(`/users/${id}`).then((r) => r.data);
export const updateCommissionerUser = (id, body) => commissionerClient.put(`/users/${id}`, body).then((r) => r.data);
export const getCommissionerApplications = () => commissionerClient.get('/applications/submitted').then((r) => r.data);
export const assignCommissionerApplication = (id, officerId) =>
  commissionerClient.patch(`/applications/${id}/assign`, { officerId: Number(officerId) }).then((r) => r.data);
export const getCommissionerOfficers = () => commissionerClient.get('/officers').then((r) => r.data);
export const getCommissionerLicenses = () => commissionerClient.get('/licenses').then((r) => r.data);
export const getCommissionerAuditLogs = () => commissionerClient.get('/audit-logs').then((r) => r.data);

// ── Officer APIs ────────────────────────────────────────────────────────

const officerClient = createClient();

export const getOfficerApplications = (officerId) =>
  officerClient
    .get(`/applications/officer/${officerId}`)
    .then((r) => r.data);

export const verifyApplication = (id) =>
  officerClient.patch(`/applications/${id}/verify`).then((r) => r.data);
