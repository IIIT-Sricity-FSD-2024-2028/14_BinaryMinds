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
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, resetApiCacheOnCredentials),
});
