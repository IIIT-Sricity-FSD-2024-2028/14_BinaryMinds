import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../department-officer/store/requestUtils.js';

const roles = {
  readAll: ['department_officer', 'municipal_commissioner'],
  readOne: ['department_officer', 'municipal_commissioner', 'field_officer', 'applicant'],
  readFieldOfficer: ['department_officer', 'municipal_commissioner', 'field_officer'],
  write: ['field_officer', 'department_officer', 'municipal_commissioner'],
  remove: ['municipal_commissioner'],
};

function canUse(state, allowed) {
  return allowed.includes(state?.auth?.user?.role);
}

function requireRole(thunkApi, allowed) {
  return canUse(thunkApi.getState(), allowed)
    ? null
    : thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot perform this compliance operation.' });
}

function request(type, allowed, path, options) {
  return createAsyncThunk(type, (arg, thunkApi) => {
    const denied = requireRole(thunkApi, allowed);
    if (denied) return denied;
    const resolvedPath = typeof path === 'function' ? path(arg) : path;
    const resolvedOptions = typeof options === 'function' ? options(arg) : options;
    return departmentOfficerRequest(resolvedPath, resolvedOptions || {}, thunkApi);
  });
}

export const fetchComplianceRecords = request('compliance/fetchAll', roles.readAll, '/compliance');
export const fetchComplianceByLicense = request(
  'compliance/fetchByLicense', roles.readOne,
  ({ licenseId }) => `/compliance/license/${encodeURIComponent(licenseId)}`,
);
export const fetchComplianceByFieldOfficer = request(
  'compliance/fetchByFieldOfficer', roles.readFieldOfficer,
  ({ fieldOfficerId }) => `/compliance/field-officer/${encodeURIComponent(fieldOfficerId)}`,
);
export const fetchComplianceById = request(
  'compliance/fetchById', roles.readOne,
  ({ id }) => `/compliance/${encodeURIComponent(id)}`,
);
export const createComplianceRecord = request(
  'compliance/create', roles.write, '/compliance',
  ({ body }) => ({ method: 'POST', body }),
);
export const updateComplianceRecord = request(
  'compliance/update', roles.write,
  ({ id }) => `/compliance/${encodeURIComponent(id)}`,
  ({ body }) => ({ method: 'PATCH', body }),
);
export const resolveComplianceRecord = request(
  'compliance/resolve', roles.write,
  ({ id }) => `/compliance/${encodeURIComponent(id)}/resolve`,
  () => ({ method: 'POST' }),
);
export const escalateComplianceRecord = request(
  'compliance/escalate', roles.write,
  ({ id }) => `/compliance/${encodeURIComponent(id)}/escalate`,
  () => ({ method: 'POST' }),
);
export const deleteComplianceRecord = request(
  'compliance/delete', roles.remove,
  ({ id }) => `/compliance/${encodeURIComponent(id)}`,
  () => ({ method: 'DELETE' }),
);

export const complianceInitialState = createRequestState({ items: [], byId: {}, current: null });

function storeComplianceRecord(state, response) {
  const record = unwrapItem(response);
  if (!record || record.record_id === undefined || record.record_id === null) return;
  state.byId[String(record.record_id)] = record;
  replaceOrAppend(state.items, record, 'record_id');
  state.current = record;
}

function storeComplianceList(state, response, replace = false) {
  const records = unwrapList(response);
  if (replace) {
    state.items = records;
    state.byId = Object.fromEntries(
      records.filter((record) => record?.record_id !== undefined && record?.record_id !== null)
        .map((record) => [String(record.record_id), record]),
    );
    if (state.current) {
      state.current = state.byId[String(state.current.record_id)] || null;
    }
    return;
  }
  records.forEach((record) => replaceOrAppend(state.items, record, 'record_id'));
  records.forEach((record) => {
    if (record?.record_id !== undefined && record?.record_id !== null) {
      state.byId[String(record.record_id)] = record;
    }
  });
}

const complianceSlice = createSlice({
  name: 'compliance',
  initialState: complianceInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchComplianceRecords, 'fetchAll', (state, action) => storeComplianceList(state, action.payload, true));
    addRequestLifecycle(builder, fetchComplianceByLicense, 'fetchByLicense', (state, action) => storeComplianceList(state, action.payload));
    addRequestLifecycle(builder, fetchComplianceByFieldOfficer, 'fetchByFieldOfficer', (state, action) => storeComplianceList(state, action.payload));
    addRequestLifecycle(builder, fetchComplianceById, 'fetchById', (state, action) => storeComplianceRecord(state, action.payload));
    addRequestLifecycle(builder, createComplianceRecord, 'create', (state, action) => storeComplianceRecord(state, action.payload));
    addRequestLifecycle(builder, updateComplianceRecord, 'update', (state, action) => storeComplianceRecord(state, action.payload));
    addRequestLifecycle(builder, resolveComplianceRecord, 'resolve', (state, action) => storeComplianceRecord(state, action.payload));
    addRequestLifecycle(builder, escalateComplianceRecord, 'escalate', (state, action) => storeComplianceRecord(state, action.payload));
    addRequestLifecycle(builder, deleteComplianceRecord, 'delete', (state, action) => {
      const id = String(action.meta.arg.id);
      state.items = state.items.filter((record) => String(record.record_id) !== id);
      delete state.byId[id];
      if (String(state.current?.record_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, complianceInitialState);
  },
});

export const selectComplianceState = (state) => state.compliance;
export const selectComplianceRecords = (state) => selectComplianceState(state).items;
export const selectComplianceById = (state, id) => selectComplianceState(state).byId[String(id)] || null;
export const selectComplianceCurrent = (state) => selectComplianceState(state).current;
export const selectComplianceRequest = (state, operation) => selectComplianceState(state).requests[operation];
export const selectComplianceError = (state, operation) => selectComplianceState(state).errors[operation];

export default complianceSlice.reducer;
