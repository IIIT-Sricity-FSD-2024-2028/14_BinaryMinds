import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

const roles = {
  collection: ['department_officer'],
  application: ['field_officer', 'department_officer', 'applicant'],
  fieldOfficer: ['field_officer', 'department_officer'],
  item: ['field_officer', 'department_officer'],
  create: ['field_officer', 'department_officer'],
  update: ['field_officer', 'department_officer'],
  remove: ['department_officer'],
};

function runRequest(type, allowed, path, options) {
  return createAsyncThunk(type, (arg, thunkApi) => {
    if (!allowed.includes(thunkApi.getState()?.auth?.user?.role)) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot perform this document verification operation.' });
    }
    return departmentOfficerRequest(
      typeof path === 'function' ? path(arg) : path,
      typeof options === 'function' ? options(arg) : options || {},
      thunkApi,
    );
  });
}

export const fetchDocumentVerifications = runRequest('documentVerifications/fetchAll', roles.collection, '/document-verifications');
export const fetchVerificationsByApplication = runRequest(
  'documentVerifications/fetchByApplication', roles.application,
  ({ applicationId }) => `/document-verifications/application/${encodeURIComponent(applicationId)}`,
);
export const fetchVerificationsByFieldOfficer = runRequest(
  'documentVerifications/fetchByFieldOfficer', roles.fieldOfficer,
  ({ fieldOfficerId }) => `/document-verifications/field-officer/${encodeURIComponent(fieldOfficerId)}`,
);
export const fetchDocumentVerificationById = runRequest(
  'documentVerifications/fetchById', roles.item,
  ({ id }) => `/document-verifications/${encodeURIComponent(id)}`,
);
export const createDocumentVerification = runRequest(
  'documentVerifications/create', roles.create, '/document-verifications',
  ({ body }) => ({ method: 'POST', body }),
);
export const updateDocumentVerification = runRequest(
  'documentVerifications/update', roles.update,
  ({ id }) => `/document-verifications/${encodeURIComponent(id)}`,
  ({ body }) => ({ method: 'PATCH', body }),
);
export const deleteDocumentVerification = runRequest(
  'documentVerifications/delete', roles.remove,
  ({ id }) => `/document-verifications/${encodeURIComponent(id)}`,
  () => ({ method: 'DELETE' }),
);

export const documentVerificationsInitialState = createRequestState({ items: [], byId: {}, current: null });

function storeVerification(state, response) {
  const item = unwrapItem(response);
  if (!item || item.verification_id === undefined || item.verification_id === null) return;
  state.byId[String(item.verification_id)] = item;
  replaceOrAppend(state.items, item, 'verification_id');
  state.current = item;
}

function storeVerificationList(state, response, replace = false) {
  const items = unwrapList(response);
  if (replace) {
    state.items = items;
    state.byId = Object.fromEntries(
      items.filter((item) => item?.verification_id !== undefined && item?.verification_id !== null)
        .map((item) => [String(item.verification_id), item]),
    );
    if (state.current) {
      state.current = state.byId[String(state.current.verification_id)] || null;
    }
    return;
  }
  items.forEach((item) => replaceOrAppend(state.items, item, 'verification_id'));
  items.forEach((item) => {
    if (item?.verification_id !== undefined && item?.verification_id !== null) {
      state.byId[String(item.verification_id)] = item;
    }
  });
}

const documentVerificationsSlice = createSlice({
  name: 'documentVerifications',
  initialState: documentVerificationsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchDocumentVerifications, 'fetchAll', (state, action) => storeVerificationList(state, action.payload, true));
    addRequestLifecycle(builder, fetchVerificationsByApplication, 'fetchByApplication', (state, action) => storeVerificationList(state, action.payload));
    addRequestLifecycle(builder, fetchVerificationsByFieldOfficer, 'fetchByFieldOfficer', (state, action) => storeVerificationList(state, action.payload));
    addRequestLifecycle(builder, fetchDocumentVerificationById, 'fetchById', (state, action) => storeVerification(state, action.payload));
    addRequestLifecycle(builder, createDocumentVerification, 'create', (state, action) => storeVerification(state, action.payload));
    addRequestLifecycle(builder, updateDocumentVerification, 'update', (state, action) => storeVerification(state, action.payload));
    addRequestLifecycle(builder, deleteDocumentVerification, 'delete', (state, action) => {
      const id = String(action.meta.arg.id);
      state.items = state.items.filter((item) => String(item.verification_id) !== id);
      delete state.byId[id];
      if (String(state.current?.verification_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, documentVerificationsInitialState);
  },
});

export const selectDocumentVerificationsState = (state) => state.documentVerifications;
export const selectDocumentVerifications = (state) => selectDocumentVerificationsState(state).items;
export const selectDocumentVerificationById = (state, id) => selectDocumentVerificationsState(state).byId[String(id)] || null;
export const selectCurrentDocumentVerification = (state) => selectDocumentVerificationsState(state).current;
export const selectDocumentVerificationsRequest = (state, operation) => selectDocumentVerificationsState(state).requests[operation];
export const selectDocumentVerificationsError = (state, operation) => selectDocumentVerificationsState(state).errors[operation];

export default documentVerificationsSlice.reducer;
