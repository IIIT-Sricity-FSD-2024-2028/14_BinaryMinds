import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

/**
 * Create an axios instance that automatically attaches the `role` header.
 */
function createClient(role) {
  return axios.create({
    baseURL: API_BASE,
    headers: { role },
  });
}

// ── Superuser APIs ──────────────────────────────────────────────────────

const superuserClient = createClient('superuser');

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

const officerClient = createClient('officer');

export const getOfficerApplications = (officerId) =>
  officerClient
    .get(`/applications/officer/${officerId}`)
    .then((r) => r.data);

export const verifyApplication = (id) =>
  officerClient.patch(`/applications/${id}/verify`).then((r) => r.data);
