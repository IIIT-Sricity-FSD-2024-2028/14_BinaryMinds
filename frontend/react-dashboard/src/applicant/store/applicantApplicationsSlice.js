/**
 * @deprecated Applicant application entities are owned by features/applications.
 * Applicant-only form and workflow state is owned by applicant/state/applicantWorkflowSlice.
 * This adapter contains no reducer of its own and does not create duplicate state.
 */
export * from '../../features/applications/applicationsSlice.js';
export * from '../state/applicantWorkflowSlice.js';
export { default } from '../state/applicantWorkflowSlice.js';
