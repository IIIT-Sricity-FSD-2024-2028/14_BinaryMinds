/**
 * @deprecated This was an actor-specific re-export facade, not a Redux store.
 * Import entity thunks/selectors from their canonical features and UI state from field-officer/state.
 */
export { selectCurrentUser, selectAccessToken, selectIsFieldOfficer } from '../../features/auth/authSelectors.js';
export { fetchApplicationsByFieldOfficer, fetchApplicationById, verifyFieldOfficerApplication, selectApplicationById, selectApplicationsByFieldOfficer, selectApplicationsState } from '../../features/applications/applicationsSlice.js';
export { fetchDocumentsByApplication, fetchDocumentPreview, downloadDocumentFile, selectDocumentsByApplication, selectDocumentsState } from '../../features/documents/documentsSlice.js';
export { fetchAssignmentsByFieldOfficer, recoverFieldOfficerAssignment, createFieldOfficerAssignment, updateFieldOfficerAssignment, deleteFieldOfficerAssignment, selectFieldOfficerAssignmentsState } from '../../features/fieldOfficerAssignments/fieldOfficerAssignmentsSlice.js';
export { fetchInspectionsByFieldOfficer, fetchInspectionById, createInspection, updateInspection, submitInspectionReport, deleteInspection, fetchInspectionEvidenceByApplication, selectInspectionsState } from '../../features/inspections/inspectionsSlice.js';
export { fetchDepartmentOfficerProfile, createDepartmentOfficerUser, updateDepartmentOfficerUser, selectDepartmentOfficerProfile, selectDepartmentOfficerUsersState } from '../../features/users/usersSlice.js';
export { fetchVerificationsByApplication, createDocumentVerification, updateDocumentVerification, deleteDocumentVerification } from '../../features/documentVerifications/documentVerificationsSlice.js';
export { default as fieldOfficerUiReducer } from '../state/fieldOfficerUiSlice.js';
