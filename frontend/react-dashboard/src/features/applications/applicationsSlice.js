import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginApplicant } from '../auth/authSlice.js';
import { recordDepartmentDecision } from '../departmentReviews/departmentReviewsSlice.js';
import {
  addRequestLifecycle,
  createRequestState,
  isDepartmentDecisionConfirmed,
  resetOnAuthChange,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';
import { applicationsApi } from './applicationsApi.js';

export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  (argument, thunkApi) => applicationsApi.fetchAll(argument, thunkApi),
);
export const fetchSubmittedApplications = createAsyncThunk(
  'applications/fetchSubmitted',
  (argument, thunkApi) => applicationsApi.fetchSubmitted(argument, thunkApi),
);
export const fetchApplicantApplications = createAsyncThunk(
  'applications/fetchMine',
  (argument, thunkApi) => applicationsApi.fetchMine(argument, thunkApi),
);
export const fetchApplicationsByApplicant = createAsyncThunk(
  'applications/fetchByApplicant',
  (applicantId, thunkApi) => applicationsApi.fetchByApplicant(applicantId, thunkApi),
);
export const checkApplicantApplicationsForDuplicates = createAsyncThunk(
  'applications/checkForDuplicates',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(fetchApplicantApplications()).unwrap();
      return true;
    } catch (error) {
      return rejectWithValue(error || { message: 'Unable to check existing applications.' });
    }
  },
);
export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  (id, thunkApi) => applicationsApi.fetchById(id, thunkApi),
);
export const fetchApplicationsByFieldOfficer = createAsyncThunk(
  'applications/fetchByFieldOfficer',
  (officerId, thunkApi) => applicationsApi.fetchByFieldOfficer(officerId, thunkApi),
);
export const verifyFieldOfficerApplication = createAsyncThunk(
  'applications/verify',
  (id, thunkApi) => applicationsApi.verify(id, thunkApi),
);
export const assignApplicationToOfficer = createAsyncThunk(
  'applications/assign',
  (argument, thunkApi) => applicationsApi.assign(argument, thunkApi),
);
export const createApplication = createAsyncThunk(
  'applications/create',
  (body, thunkApi) => applicationsApi.create(body, thunkApi),
);
export const updateApplication = createAsyncThunk(
  'applications/update',
  (argument, thunkApi) => applicationsApi.update(argument, thunkApi),
);
export const deleteApplication = createAsyncThunk(
  'applications/delete',
  (id, thunkApi) => applicationsApi.delete(id, thunkApi),
);

export const applicationsInitialState = createRequestState({
  byId: {},
  allIds: [],
  mineIds: [],
  submittedIds: [],
  byApplicantId: {},
  byFieldOfficerId: {},
  currentId: null,
  initialized: false,
});

function applicationId(application) {
  return application?.application_id == null ? null : String(application.application_id);
}

function includeId(ids, id) {
  if (id != null && !ids.some((existing) => String(existing) === id)) ids.push(id);
}

function removeId(ids, id) {
  return ids.filter((existing) => String(existing) !== id);
}

function upsertApplication(state, application, { includeInAll = true } = {}) {
  const id = applicationId(application);
  if (!id) return;

  const previous = state.byId[id];
  state.byId[id] = application;
  if (includeInAll) includeId(state.allIds, id);

  if (state.mineIds.some((existing) => String(existing) === id) &&
      previous?.applicant_id != null &&
      String(previous.applicant_id) !== String(application.applicant_id)) {
    state.mineIds = removeId(state.mineIds, id);
  }

  const officerIds = new Set(
    [previous?.assignedOfficerId, previous?.verification_officer_id,
      application.assignedOfficerId, application.verification_officer_id]
      .filter((value) => value != null)
      .map(String),
  );
  officerIds.forEach((officerId) => {
    const ids = state.byFieldOfficerId[officerId] || [];
    const isAssociated = [application.assignedOfficerId, application.verification_officer_id]
      .some((value) => value != null && String(value) === officerId);
    if (isAssociated) includeId(ids, id);
    else state.byFieldOfficerId[officerId] = removeId(ids, id);
    if (isAssociated) state.byFieldOfficerId[officerId] = ids;
  });
}

function upsertList(state, response) {
  const records = unwrapList(response);
  const ids = [];
  records.forEach((application) => {
    const id = applicationId(application);
    if (!id) return;
    upsertApplication(state, application);
    includeId(ids, id);
  });
  return ids;
}

function setRequest(builder, thunk, operation, onFulfilled, onRejected) {
  addRequestLifecycle(builder, thunk, operation, onFulfilled, onRejected);
}

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: applicationsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    setRequest(builder, fetchApplications, 'fetchAll', (state, action) => {
      state.allIds = upsertList(state, action.payload);
      state.initialized = true;
    }, (state) => {
      state.initialized = true;
    });
    setRequest(builder, fetchSubmittedApplications, 'fetchSubmitted', (state, action) => {
      state.submittedIds = upsertList(state, action.payload);
    });
    setRequest(builder, fetchApplicantApplications, 'fetchMine', (state, action) => {
      state.mineIds = upsertList(state, action.payload);
      if (!state.currentId || !state.mineIds.some((id) => String(id) === String(state.currentId))) {
        state.currentId = state.mineIds[0] || null;
      }
    });
    setRequest(builder, fetchApplicationsByApplicant, 'fetchByApplicant', (state, action) => {
      state.byApplicantId[String(action.meta.arg)] = upsertList(state, action.payload);
    });
    setRequest(builder, checkApplicantApplicationsForDuplicates, 'checkForDuplicates');
    setRequest(builder, fetchApplicationById, 'fetchById', (state, action) => {
      const application = unwrapItem(action.payload);
      upsertApplication(state, application);
      state.currentId = applicationId(application);
    });
    setRequest(builder, fetchApplicationsByFieldOfficer, 'fetchByFieldOfficer', (state, action) => {
      const officerId = String(action.meta.arg);
      state.byFieldOfficerId[officerId] = upsertList(state, action.payload);
    });
    setRequest(builder, verifyFieldOfficerApplication, 'verify', (state, action) => {
      upsertApplication(state, unwrapItem(action.payload));
    });
    setRequest(builder, assignApplicationToOfficer, 'assign', (state, action) => {
      upsertApplication(state, unwrapItem(action.payload));
    });
    setRequest(builder, createApplication, 'create', (state, action) => {
      const application = unwrapItem(action.payload);
      upsertApplication(state, application);
      includeId(state.mineIds, applicationId(application));
      state.currentId = applicationId(application);
    });
    setRequest(builder, updateApplication, 'update', (state, action) => {
      const application = unwrapItem(action.payload);
      upsertApplication(state, application);
      state.currentId = applicationId(application);
    });
    setRequest(builder, deleteApplication, 'delete', (state, action) => {
      const id = String(action.meta.arg);
      delete state.byId[id];
      state.allIds = removeId(state.allIds, id);
      state.mineIds = removeId(state.mineIds, id);
      state.submittedIds = removeId(state.submittedIds, id);
      Object.keys(state.byApplicantId).forEach((applicantId) => {
        state.byApplicantId[applicantId] = removeId(state.byApplicantId[applicantId], id);
      });
      Object.keys(state.byFieldOfficerId).forEach((officerId) => {
        state.byFieldOfficerId[officerId] = removeId(state.byFieldOfficerId[officerId], id);
      });
      if (String(state.currentId) === id) state.currentId = null;
    });
    builder.addCase(recordDepartmentDecision.fulfilled, (state, action) => {
      if (!isDepartmentDecisionConfirmed(action.payload, action.meta.arg.status)) return;
      upsertApplication(state, action.payload?.application);
    });
    resetOnAuthChange(builder, applicationsInitialState);
    builder.addCase(loginApplicant.fulfilled, () => structuredClone(applicationsInitialState));
  },
});

const EMPTY_APPLICATIONS = Object.freeze([]);
function selectIds(state, ids) {
  return (ids || EMPTY_APPLICATIONS).map((id) => state.applications.byId[String(id)]).filter(Boolean);
}

export const selectApplicationsState = (state) => state.applications;
export const selectApplications = (state) => selectIds(state, state.applications.allIds);
export const selectApplicantApplications = (state) => selectIds(state, state.applications.mineIds);
export const selectSubmittedApplications = (state) => selectIds(state, state.applications.submittedIds);
export const selectApplicationsByApplicant = (state, applicantId) =>
  selectIds(state, state.applications.byApplicantId[String(applicantId)]);
export const selectApplicationById = (state, id) => state.applications.byId[String(id)] || null;
export const selectApplicationsByFieldOfficer = (state, officerId) =>
  selectIds(state, state.applications.byFieldOfficerId[String(officerId)]);
export const selectCurrentApplication = (state) =>
  state.applications.currentId == null ? null : selectApplicationById(state, state.applications.currentId);
export const selectApplicantApplicationsRequest = (state, operation) => state.applications.requests[operation];
export const selectApplicantApplicationsError = (state, operation) => state.applications.errors[operation];

export default applicationsSlice.reducer;
