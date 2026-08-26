import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

/**
 * Create an axios instance that attaches the authenticated bearer token.
 */
function createClient() {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken') || ''}` },
  });
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

// ── Officer APIs ────────────────────────────────────────────────────────

const officerClient = createClient();

export const getOfficerApplications = (officerId) =>
  officerClient
    .get(`/applications/officer/${officerId}`)
    .then((r) => r.data);

export const verifyApplication = (id) =>
  officerClient.patch(`/applications/${id}/verify`).then((r) => r.data);
