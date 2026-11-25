import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../features/auth/authSlice';
import { baseApi } from '../services/baseApi';
import applicationsReducer from '../department-officer/store/applicationsSlice.js';
import departmentReviewsReducer from '../department-officer/store/departmentReviewsSlice.js';
import documentsReducer from '../department-officer/store/documentsSlice.js';
import fieldOfficerAssignmentsReducer from '../department-officer/store/fieldOfficerAssignmentsSlice.js';
import inspectionsReducer from '../department-officer/store/inspectionsSlice.js';
import licensesReducer from '../department-officer/store/licensesSlice.js';
import usersReducer from '../department-officer/store/usersSlice.js';
import auditLogsReducer from '../features/auditLogs/auditLogsSlice.js';
import complianceReducer from '../features/compliance/complianceSlice.js';
import documentVerificationsReducer from '../features/documentVerifications/documentVerificationsSlice.js';
import municipalitiesReducer from '../features/municipalities/municipalitiesSlice.js';
import officersReducer from '../features/officers/officersSlice.js';
import paymentsReducer from '../features/payments/paymentsSlice.js';
import platformAdminReadModelReducer from '../features/platformAdmin/platformAdminReadModelSlice.js';

const resetApiCacheOnCredentials = ({ dispatch }) => (next) => (action) => {
  const result = next(action);
  if (setCredentials.match(action)) {
    dispatch(baseApi.util.resetApiState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    departmentOfficerApplications: applicationsReducer,
    departmentOfficerReviews: departmentReviewsReducer,
    departmentOfficerDocuments: documentsReducer,
    departmentOfficerAssignments: fieldOfficerAssignmentsReducer,
    departmentOfficerInspections: inspectionsReducer,
    departmentOfficerLicenses: licensesReducer,
    departmentOfficerUsers: usersReducer,
    auditLogs: auditLogsReducer,
    compliance: complianceReducer,
    documentVerifications: documentVerificationsReducer,
    municipalities: municipalitiesReducer,
    officers: officersReducer,
    payments: paymentsReducer,
    platformAdminReadModel: platformAdminReadModelReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, resetApiCacheOnCredentials),
});
