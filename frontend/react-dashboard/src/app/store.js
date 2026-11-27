import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import applicationsReducer from '../features/applications/applicationsSlice.js';
import departmentReviewsReducer from '../features/departmentReviews/departmentReviewsSlice.js';
import documentsReducer from '../features/documents/documentsSlice.js';
import fieldOfficerAssignmentsReducer from '../features/fieldOfficerAssignments/fieldOfficerAssignmentsSlice.js';
import inspectionsReducer from '../features/inspections/inspectionsSlice.js';
import licensesReducer from '../features/licenses/licensesSlice.js';
import usersReducer from '../features/users/usersSlice.js';
import departmentOfficerUiReducer from '../department-officer/state/departmentOfficerUiSlice.js';
import auditLogsReducer from '../features/auditLogs/auditLogsSlice.js';
import complianceReducer from '../features/compliance/complianceSlice.js';
import documentVerificationsReducer from '../features/documentVerifications/documentVerificationsSlice.js';
import municipalitiesReducer from '../features/municipalities/municipalitiesSlice.js';
import officersReducer from '../features/officers/officersSlice.js';
import paymentsReducer from '../features/payments/paymentsSlice.js';
import platformAdminReadModelReducer from '../platform-admin/state/platformAdminReadModelSlice.js';
import applicantWorkflowReducer from '../applicant/state/applicantWorkflowSlice.js';
import fieldOfficerUiReducer from '../field-officer/state/fieldOfficerUiSlice.js';
import platformAdminUiReducer from '../platform-admin/state/platformAdminUiSlice.js';
import commissionerUiReducer from '../municipal-commissioner/state/commissionerUiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applicantWorkflow: applicantWorkflowReducer,
    fieldOfficerUi: fieldOfficerUiReducer,
    platformAdminUi: platformAdminUiReducer,
    commissionerUi: commissionerUiReducer,
    applications: applicationsReducer,
    departmentReviews: departmentReviewsReducer,
    documents: documentsReducer,
    fieldOfficerAssignments: fieldOfficerAssignmentsReducer,
    inspections: inspectionsReducer,
    licenses: licensesReducer,
    users: usersReducer,
    departmentOfficerUi: departmentOfficerUiReducer,
    auditLogs: auditLogsReducer,
    compliance: complianceReducer,
    documentVerifications: documentVerificationsReducer,
    municipalities: municipalitiesReducer,
    officers: officersReducer,
    payments: paymentsReducer,
    platformAdminReadModel: platformAdminReadModelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['applicantWorkflow.workflow.files', 'applicantWorkflow.workflow.renewalFiles', 'fieldOfficerUi.values'],
        ignoredActionPaths: ['meta.arg.file', 'meta.arg.evidence', 'payload.file', 'payload.value'],
        ignoredActions: ['applicantWorkflow/setUploadFile', 'applicantWorkflow/setRenewalFile', 'fieldOfficerUi/setFieldOfficerValue'],
      },
    }),
});
