import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { inspectionsApi } from './inspectionsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

export const fetchInspections = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchAll',
  inspectionsApi.fetchAll,
);
export const fetchInspectionById = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchById',
  inspectionsApi.fetchById,
);
export const fetchInspectionsByFieldOfficer = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchByFieldOfficer',
  inspectionsApi.fetchByFieldOfficer,
);
export const fetchInspectionsByAssignment = createDepartmentOfficerThunk(
  'departmentOfficerInspections/fetchByAssignment',
  inspectionsApi.fetchByAssignment,
);
export const createInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/create',
  inspectionsApi.create,
);
export const updateInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/update',
  inspectionsApi.update,
);
export const submitInspectionReport = createDepartmentOfficerThunk(
  'departmentOfficerInspections/submitReport',
  inspectionsApi.submitReport,
);
export const deleteInspection = createDepartmentOfficerThunk(
  'departmentOfficerInspections/delete',
  inspectionsApi.delete,
);
export const fetchInspectionEvidenceByApplication = createAsyncThunk(
  'departmentOfficerInspections/fetchEvidenceByApplication',
  async ({ applicationId, evidenceKey, reports }, thunkApi) => {
    const fetchedItems = await Promise.all(reports.flatMap((report) => (report.evidence_files || []).map(async (file) => {
      const evidenceItem = {
        inspectionId: report.inspection_id,
        inspectionDate: report.completed_date || report.scheduled_date,
        file,
      };
      try {
        const { blob, mimeType } = await inspectionsApi.fetchEvidence({
          inspectionId: report.inspection_id,
          filename: file.filename,
        }, thunkApi);
        return { ...evidenceItem, blob, mimeType };
      } catch (error) {
        if (thunkApi.signal.aborted) throw error;
        return { ...evidenceItem, error: true };
      }
    })));

    const requestIsCurrent = thunkApi.getState().inspections.evidenceRequestIdsByApplicationId[String(applicationId)] === thunkApi.requestId;
    if (thunkApi.signal.aborted) throw new Error('Inspection evidence request was cancelled.');
    if (!requestIsCurrent) {
      return { applicationId: String(applicationId), evidenceKey, stale: true, items: [] };
    }
    const items = fetchedItems.map((item) => {
      if (item.error) return item;
      const { blob, mimeType, file, ...metadata } = item;
      return {
        ...metadata,
        file: { ...file, mime_type: file.mime_type || mimeType },
        url: URL.createObjectURL(blob),
      };
    });
    return { applicationId: String(applicationId), evidenceKey, items };
  },
);

export const inspectionsInitialState = createRequestState({
  items: [],
  current: null,
  initialized: false,
  evidenceByApplicationId: {},
  evidenceRequestsByApplicationId: {},
  evidenceRequestKeysByApplicationId: {},
  evidenceErrorsByApplicationId: {},
  evidenceRequestIdsByApplicationId: {},
});

const inspectionsSlice = createSlice({
  name: 'departmentOfficerInspections',
  initialState: inspectionsInitialState,
  reducers: {
    clearInspectionEvidence(state, action) {
      const id = String(action.payload.applicationId);
      if (action.payload.evidenceKey && state.evidenceByApplicationId[id]?.key !== action.payload.evidenceKey) return;
      delete state.evidenceByApplicationId[id];
      delete state.evidenceRequestsByApplicationId[id];
      delete state.evidenceRequestKeysByApplicationId[id];
      delete state.evidenceErrorsByApplicationId[id];
      delete state.evidenceRequestIdsByApplicationId[id];
    },
  },
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
    addRequestLifecycle(builder, fetchInspectionsByFieldOfficer, 'fetchByFieldOfficer', (state, action) => {
      const rows = unwrapList(action.payload);
      rows.forEach((inspection) => replaceOrAppend(state.items, inspection, 'inspection_id'));
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchInspectionsByAssignment, 'fetchByAssignment', (state, action) => {
      const rows = unwrapList(action.payload);
      rows.forEach((inspection) => replaceOrAppend(state.items, inspection, 'inspection_id'));
      state.initialized = true;
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
    builder
      .addCase(fetchInspectionEvidenceByApplication.pending, (state, action) => {
        const id = String(action.meta.arg.applicationId);
        state.evidenceRequestsByApplicationId[id] = 'pending';
        state.evidenceRequestKeysByApplicationId[id] = action.meta.arg.evidenceKey;
        state.evidenceRequestIdsByApplicationId[id] = action.meta.requestId;
        delete state.evidenceErrorsByApplicationId[id];
      })
      .addCase(fetchInspectionEvidenceByApplication.fulfilled, (state, action) => {
        const id = action.payload.applicationId;
        if (state.evidenceRequestIdsByApplicationId[id] !== action.meta.requestId) return;
        state.evidenceRequestsByApplicationId[id] = 'fulfilled';
        state.evidenceByApplicationId[id] = {
          key: action.payload.evidenceKey,
          items: action.payload.items,
        };
        delete state.evidenceErrorsByApplicationId[id];
      })
      .addCase(fetchInspectionEvidenceByApplication.rejected, (state, action) => {
        const id = String(action.meta.arg.applicationId);
        if (state.evidenceRequestIdsByApplicationId[id] !== action.meta.requestId) return;
        state.evidenceRequestsByApplicationId[id] = action.meta.aborted ? 'idle' : 'rejected';
        if (action.meta.aborted) delete state.evidenceErrorsByApplicationId[id];
        else state.evidenceErrorsByApplicationId[id] = action.error?.message || 'Unable to load inspection evidence.';
      });
    resetOnAuthChange(builder, inspectionsInitialState);
  },
});

export const selectInspectionsState = (state) => state.inspections;
export const selectInspections = (state) => selectInspectionsState(state).items;
export const selectInspectionEvidenceByApplication = (state, applicationId) =>
  selectInspectionsState(state).evidenceByApplicationId[String(applicationId)] || null;
export const selectInspectionEvidenceRequest = (state, applicationId) =>
  selectInspectionsState(state).evidenceRequestsByApplicationId[String(applicationId)] || 'idle';
export const selectInspectionEvidenceError = (state, applicationId) =>
  selectInspectionsState(state).evidenceErrorsByApplicationId[String(applicationId)] || '';
export const { clearInspectionEvidence } = inspectionsSlice.actions;
export default inspectionsSlice.reducer;
