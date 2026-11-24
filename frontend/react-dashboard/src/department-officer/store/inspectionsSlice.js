import { createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from './requestUtils.js';

export const fetchInspections = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchAll',
  () => ({ path: '/inspections' }),
);
export const fetchInspectionById = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchById',
  (id) => ({ path: `/inspections/${encodeURIComponent(id)}` }),
);
export const createInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/create',
  (body) => ({ path: '/inspections', options: { method: 'POST', body } }),
);
export const updateInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/update',
  ({ id, body }) => ({ path: `/inspections/${encodeURIComponent(id)}`, options: { method: 'PATCH', body } }),
);
export const submitInspectionReport = createDepartmentOfficerThunk(
  'departmentOfficerInspections/submitReport',
  ({ id, notes, status, report_url, evidence = [] }) => {
    const body = new FormData();
    body.append('notes', notes);
    body.append('status', status);
    if (report_url !== undefined) body.append('report_url', report_url);
    evidence.forEach((file) => body.append('evidence', file));
    return {
      path: `/inspections/${encodeURIComponent(id)}/report`,
      options: { method: 'POST', body },
    };
  },
);
export const deleteInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/delete',
  (id) => ({ path: `/inspections/${encodeURIComponent(id)}`, options: { method: 'DELETE' } }),
);

export const inspectionsInitialState = createRequestState({ items: [], current: null, initialized: false });

const inspectionsSlice = createSlice({
  name: 'departmentOfficerInspections',
  initialState: inspectionsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchInspections, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.initialized = true;
    }, (state) => {
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchInspectionById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      replaceOrAppend(state.items, state.current, 'inspection_id');
    });
    addRequestLifecycle(builder, createInspection, 'create', (state, action) => {
      replaceOrAppend(state.items, unwrapItem(action.payload), 'inspection_id');
    });
    addRequestLifecycle(builder, updateInspection, 'update', (state, action) => {
      const inspection = unwrapItem(action.payload);
      replaceOrAppend(state.items, inspection, 'inspection_id');
      if (String(state.current?.inspection_id) === String(inspection?.inspection_id)) state.current = inspection;
    });
    addRequestLifecycle(builder, submitInspectionReport, 'submitReport', (state, action) => {
      const inspection = unwrapItem(action.payload);
      replaceOrAppend(state.items, inspection, 'inspection_id');
      if (String(state.current?.inspection_id) === String(inspection?.inspection_id)) state.current = inspection;
    });
    addRequestLifecycle(builder, deleteInspection, 'delete', (state, action) => {
      const id = action.meta.arg;
      state.items = state.items.filter((item) => String(item.inspection_id) !== String(id));
      if (String(state.current?.inspection_id) === String(id)) state.current = null;
    });
    resetOnAuthChange(builder, inspectionsInitialState);
  },
});

export const selectInspectionsState = (state) => state.departmentOfficerInspections;
export const selectInspections = (state) => selectInspectionsState(state).items;
export default inspectionsSlice.reducer;
