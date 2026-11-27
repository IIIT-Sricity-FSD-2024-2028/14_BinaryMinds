import { createSelector, createSlice } from '@reduxjs/toolkit';
import { fieldOfficerAssignmentsApi } from './fieldOfficerAssignmentsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

export const fetchFieldOfficerAssignments = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchAll',
  fieldOfficerAssignmentsApi.fetchAll,
);
export const fetchFieldOfficerAssignmentById = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchById',
  fieldOfficerAssignmentsApi.fetchById,
);
export const fetchFieldOfficerAssignmentsByApplication = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchByApplication',
  fieldOfficerAssignmentsApi.fetchByApplication,
);
export const fetchFieldOfficerAssignmentSla = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchSla',
  fieldOfficerAssignmentsApi.fetchSla,
);
export const fetchAssignmentsByFieldOfficer = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/fetchByFieldOfficer',
  fieldOfficerAssignmentsApi.fetchByFieldOfficer,
);
export const recoverFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/recover',
  fieldOfficerAssignmentsApi.recoverForApplication,
);
export const createFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/create',
  fieldOfficerAssignmentsApi.create,
);
export const updateFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/update',
  fieldOfficerAssignmentsApi.update,
);
export const deleteFieldOfficerAssignment = createDepartmentOfficerThunk(
  'departmentOfficerAssignments/delete',
  fieldOfficerAssignmentsApi.delete,
);

export const fieldOfficerAssignmentsInitialState = createRequestState({
  items: [], byFieldOfficerId: {}, byApplicationId: {}, slaByAssignmentId: {}, current: null, initialized: false,
});

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
    addRequestLifecycle(builder, fetchAssignmentsByFieldOfficer, 'fetchByFieldOfficer', (state, action) => {
      const officerId = String(action.meta.arg);
      const items = unwrapList(action.payload);
      state.byFieldOfficerId[officerId] = items;
      items.forEach((assignment) => replaceOrAppend(state.items, assignment, 'assignment_id'));
    });
    addRequestLifecycle(builder, fetchFieldOfficerAssignmentsByApplication, 'fetchByApplication', (state, action) => {
      const rows = unwrapList(action.payload);
      state.byApplicationId[String(action.meta.arg)] = rows.map((item) => String(item.assignment_id));
      rows.forEach((assignment) => replaceOrAppend(state.items, assignment, 'assignment_id'));
    });
    addRequestLifecycle(builder, fetchFieldOfficerAssignmentSla, 'fetchSla', (state, action) => {
      state.slaByAssignmentId[String(action.meta.arg)] = unwrapItem(action.payload);
    });
    addRequestLifecycle(builder, fetchFieldOfficerAssignmentById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      replaceOrAppend(state.items, state.current, 'assignment_id');
    });
    addRequestLifecycle(builder, createFieldOfficerAssignment, 'create', (state, action) => {
      replaceOrAppend(state.items, unwrapItem(action.payload), 'assignment_id');
    });
    addRequestLifecycle(builder, recoverFieldOfficerAssignment, 'recover', (state, action) => {
      const assignment = unwrapItem(action.payload);
      replaceOrAppend(state.items, assignment, 'assignment_id');
      if (assignment?.field_officer_id != null) {
        const key = String(assignment.field_officer_id);
        state.byFieldOfficerId[key] = state.byFieldOfficerId[key] || [];
        replaceOrAppend(state.byFieldOfficerId[key], assignment, 'assignment_id');
      }
    });
    addRequestLifecycle(builder, updateFieldOfficerAssignment, 'update', (state, action) => {
      const assignment = unwrapItem(action.payload);
      replaceOrAppend(state.items, assignment, 'assignment_id');
      if (String(state.current?.assignment_id) === String(assignment?.assignment_id)) state.current = assignment;
    });
    addRequestLifecycle(builder, deleteFieldOfficerAssignment, 'delete', (state, action) => {
      const id = String(action.meta.arg);
      state.items = state.items.filter((item) => String(item.assignment_id) !== id);
      Object.keys(state.byApplicationId).forEach((applicationId) => {
        state.byApplicationId[applicationId] = state.byApplicationId[applicationId].filter((assignmentId) => assignmentId !== id);
      });
      Object.keys(state.byFieldOfficerId).forEach((officerId) => {
        state.byFieldOfficerId[officerId] = state.byFieldOfficerId[officerId]
          .filter((assignment) => String(assignment.assignment_id) !== id);
      });
      delete state.slaByAssignmentId[id];
      if (String(state.current?.assignment_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, fieldOfficerAssignmentsInitialState);
  },
});

export const selectFieldOfficerAssignmentsState = (state) => state.fieldOfficerAssignments;
export const selectFieldOfficerAssignments = (state) => selectFieldOfficerAssignmentsState(state).items;
export const selectFieldOfficerAssignmentsByApplication = createSelector(
  [
    (state, applicationId) => selectFieldOfficerAssignmentsState(state).byApplicationId[String(applicationId)] || [],
    (state) => selectFieldOfficerAssignmentsState(state).items,
  ],
  (ids, items) => {
    const byId = new Map(items.map((assignment) => [String(assignment.assignment_id), assignment]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  },
);
export const selectFieldOfficerAssignmentSla = (state, assignmentId) =>
  selectFieldOfficerAssignmentsState(state).slaByAssignmentId[String(assignmentId)] || null;
export default fieldOfficerAssignmentsSlice.reducer;
