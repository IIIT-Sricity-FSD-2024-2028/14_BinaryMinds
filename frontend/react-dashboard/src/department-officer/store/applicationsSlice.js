import { createSlice } from '@reduxjs/toolkit';
import { recordDepartmentDecision } from './departmentReviewsSlice.js';
import { applicationsApi } from '../api/applicationsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  isDepartmentDecisionConfirmed,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from './requestUtils.js';

export const fetchApplications = createDepartmentOfficerThunk(
  'departmentOfficerApplications/fetchAll',
  applicationsApi.fetchAll,
);
export const fetchApplicationById = createDepartmentOfficerThunk(
  'departmentOfficerApplications/fetchById',
  applicationsApi.fetchById,
);
export const assignApplicationToOfficer = createDepartmentOfficerThunk(
  'departmentOfficerApplications/assign',
  applicationsApi.assign,
);
export const createApplication = createDepartmentOfficerThunk(
  'departmentOfficerApplications/create',
  applicationsApi.create,
);
export const updateApplication = createDepartmentOfficerThunk(
  'departmentOfficerApplications/update',
  applicationsApi.update,
);
export const deleteApplication = createDepartmentOfficerThunk(
  'departmentOfficerApplications/delete',
  applicationsApi.delete,
);

export const applicationsInitialState = createRequestState({ items: [], current: null, initialized: false });

const applicationsSlice = createSlice({
  name: 'departmentOfficerApplications',
  initialState: applicationsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchApplications, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.initialized = true;
    }, (state) => {
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchApplicationById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      replaceOrAppend(state.items, state.current, 'application_id');
    });
    addRequestLifecycle(builder, assignApplicationToOfficer, 'assign', (state, action) => {
      const application = unwrapItem(action.payload);
      if (String(application?.application_id) !== String(action.meta.arg.id)) return;
      replaceOrAppend(state.items, application, 'application_id');
      if (String(state.current?.application_id) === String(application.application_id)) {
        state.current = application;
      }
    });
    addRequestLifecycle(builder, createApplication, 'create', (state, action) => {
      replaceOrAppend(state.items, unwrapItem(action.payload), 'application_id');
    });
    addRequestLifecycle(builder, updateApplication, 'update', (state, action) => {
      const application = unwrapItem(action.payload);
      replaceOrAppend(state.items, application, 'application_id');
      if (String(state.current?.application_id) === String(application?.application_id)) {
        state.current = application;
      }
    });
    addRequestLifecycle(builder, deleteApplication, 'delete', (state, action) => {
      const id = action.meta.arg;
      state.items = state.items.filter((item) => String(item.application_id) !== String(id));
      if (String(state.current?.application_id) === String(id)) state.current = null;
    });
    builder.addCase(recordDepartmentDecision.fulfilled, (state, action) => {
      if (!isDepartmentDecisionConfirmed(action.payload, action.meta.arg.status)) return;
      const application = action.payload?.application;
      replaceOrAppend(state.items, application, 'application_id');
      if (String(state.current?.application_id) === String(application?.application_id)) {
        state.current = application;
      }
    });
    resetOnAuthChange(builder, applicationsInitialState);
  },
});

export const selectApplicationsState = (state) => state.departmentOfficerApplications;
export const selectApplications = (state) => selectApplicationsState(state).items;
export default applicationsSlice.reducer;
