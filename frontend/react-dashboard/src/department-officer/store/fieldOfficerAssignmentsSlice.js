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

export const fetchFieldOfficerAssignments = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchAll',
  () => ({ path: '/field-officer-assignments' }),
);
export const fetchFieldOfficerAssignmentById = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchById',
  (id) => ({ path: `/field-officer-assignments/${encodeURIComponent(id)}` }),
);
export const createFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/create',
  (body) => ({ path: '/field-officer-assignments', options: { method: 'POST', body } }),
);
export const updateFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/update',
  ({ id, body }) => ({ path: `/field-officer-assignments/${encodeURIComponent(id)}`, options: { method: 'PATCH', body } }),
);
export const deleteFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/delete',
  (id) => ({ path: `/field-officer-assignments/${encodeURIComponent(id)}`, options: { method: 'DELETE' } }),
);

export const fieldOfficerAssignmentsInitialState = createRequestState({ items: [], current: null, initialized: false });

const fieldOfficerAssignmentsSlice = createSlice({
  name: 'departmentOfficerAssignments',
  initialState: fieldOfficerAssignmentsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchFieldOfficerAssignments, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.initialized = true;
    }, (state) => {
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchFieldOfficerAssignmentById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      replaceOrAppend(state.items, state.current, 'assignment_id');
    });
    addRequestLifecycle(builder, createFieldOfficerAssignment, 'create', (state, action) => {
      replaceOrAppend(state.items, unwrapItem(action.payload), 'assignment_id');
    });
    addRequestLifecycle(builder, updateFieldOfficerAssignment, 'update', (state, action) => {
      const assignment = unwrapItem(action.payload);
      replaceOrAppend(state.items, assignment, 'assignment_id');
      if (String(state.current?.assignment_id) === String(assignment?.assignment_id)) state.current = assignment;
    });
    addRequestLifecycle(builder, deleteFieldOfficerAssignment, 'delete', (state, action) => {
      const id = action.meta.arg;
      state.items = state.items.filter((item) => String(item.assignment_id) !== String(id));
      if (String(state.current?.assignment_id) === String(id)) state.current = null;
    });
    resetOnAuthChange(builder, fieldOfficerAssignmentsInitialState);
  },
});

export const selectFieldOfficerAssignmentsState = (state) => state.departmentOfficerAssignments;
export const selectFieldOfficerAssignments = (state) => selectFieldOfficerAssignmentsState(state).items;
export default fieldOfficerAssignmentsSlice.reducer;
