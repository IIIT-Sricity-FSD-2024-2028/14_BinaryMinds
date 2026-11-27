import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

const readRoles = ['municipal_commissioner', 'platform_admin'];

function hasAllowedRole(state, roles) {
  return roles.includes(state?.auth?.user?.role);
}

export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAll',
  (_, thunkApi) => {
    if (!hasAllowedRole(thunkApi.getState(), readRoles)) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot access audit logs.' });
    }
    return departmentOfficerRequest('/audit-logs', {}, thunkApi);
  },
);

export const auditLogsInitialState = createRequestState({ items: [], byId: {} });

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState: auditLogsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchAuditLogs, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.byId = Object.fromEntries(
        state.items.filter((item) => item?.audit_id !== undefined)
          .map((item) => [String(item.audit_id), item]),
      );
    });
    resetOnAuthChange(builder, auditLogsInitialState);
  },
});

export const selectAuditLogsState = (state) => state.auditLogs;
export const selectAuditLogs = (state) => selectAuditLogsState(state).items;
export const selectAuditLogById = (state, id) => selectAuditLogsState(state).byId[String(id)] || null;
export const selectAuditLogsRequest = (state) => selectAuditLogsState(state).requests.fetchAll;
export const selectAuditLogsError = (state) => selectAuditLogsState(state).errors.fetchAll;

export default auditLogsSlice.reducer;
