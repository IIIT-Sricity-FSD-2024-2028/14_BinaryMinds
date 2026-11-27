/**
 * @deprecated Legacy API helpers are now Redux thunk action creators.
 * Dispatch these exports and select their results from the central store.
 */
export {
  fetchApplications as getSubmittedApplications,
  assignApplicationToOfficer as assignApplication,
  createApplication,
  fetchApplicationsByFieldOfficer as getOfficerApplications,
  verifyFieldOfficerApplication as verifyApplication,
} from '../features/applications/applicationsSlice.js';
export { fetchOfficers as getOfficers } from '../features/officers/officersSlice.js';
