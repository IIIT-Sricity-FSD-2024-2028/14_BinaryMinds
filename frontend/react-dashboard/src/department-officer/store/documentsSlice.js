import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { documentsApi } from '../api/documentsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  unwrapItem,
  unwrapList,
} from './requestUtils.js';

export const fetchDocumentsByApplication = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/fetchByApplication',
  documentsApi.fetchByApplication,
);
export const fetchDocumentById = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/fetchById',
  documentsApi.fetchById,
);
export const createDocument = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/create',
  documentsApi.create,
);
export const updateDocumentStatus = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/updateStatus',
  documentsApi.updateStatus,
);
export const deleteDocument = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/delete',
  documentsApi.delete,
);
export const fetchDocumentPreview = createAsyncThunk(
  'departmentOfficerDocuments/fetchPreview',
  async ({ id, filename }, thunkApi) => {
    const { blob, mimeType } = await documentsApi.fetchPreview({ id }, thunkApi);
    const requestIsCurrent = thunkApi.getState().departmentOfficerDocuments.fileRequestIdsByDocumentId[String(id)]?.preview === thunkApi.requestId;
    if (thunkApi.signal.aborted) throw new Error('Document preview request was cancelled.');
    if (!requestIsCurrent) return { documentId: String(id), requestId: thunkApi.requestId, stale: true };
    return {
      documentId: String(id),
      requestId: thunkApi.requestId,
      filename,
      mimeType,
      url: URL.createObjectURL(blob),
    };
  },
);
export const downloadDocumentFile = createAsyncThunk(
  'departmentOfficerDocuments/downloadFile',
  async ({ id, filename }, thunkApi) => {
    const { blob, mimeType } = await documentsApi.fetchDownload({ id }, thunkApi);
    if (thunkApi.signal.aborted) throw new Error('Document download request was cancelled.');
    const url = URL.createObjectURL(new Blob([blob], { type: mimeType || blob.type }));
    try {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    return { documentId: String(id), filename };
  },
);

export const documentsInitialState = createRequestState({
  byApplicationId: {},
  byId: {},
  previewsByDocumentId: {},
  fileRequestsByDocumentId: {},
  fileErrorsByDocumentId: {},
  fileRequestIdsByDocumentId: {},
});

function setFileRequest(state, action, operation, status, error = null) {
  const id = String(action.meta.arg.id);
  state.fileRequestsByDocumentId[id] = {
    ...state.fileRequestsByDocumentId[id],
    [operation]: status,
  };
  state.fileRequestIdsByDocumentId[id] = {
    ...state.fileRequestIdsByDocumentId[id],
    [operation]: action.meta.requestId,
  };
  state.fileErrorsByDocumentId[id] = {
    ...state.fileErrorsByDocumentId[id],
    [operation]: error,
  };
}

function replaceDocument(state, document) {
  if (document?.document_id === undefined || document?.document_id === null) return;
  state.byId[String(document.document_id)] = document;
  const applicationId = String(document.application_id);
  const documents = state.byApplicationId[applicationId] || [];
  const index = documents.findIndex((item) => String(item.document_id) === String(document.document_id));
  if (index < 0) documents.push(document);
  else documents[index] = document;
  state.byApplicationId[applicationId] = documents;
}

function removeDocument(state, id) {
  const key = String(id);
  const document = state.byId[key];
  delete state.byId[key];
  if (document) {
    const appKey = String(document.application_id);
    state.byApplicationId[appKey] = (state.byApplicationId[appKey] || [])
      .filter((item) => String(item.document_id) !== key);
  } else {
    Object.keys(state.byApplicationId).forEach((appKey) => {
      state.byApplicationId[appKey] = state.byApplicationId[appKey]
        .filter((item) => String(item.document_id) !== key);
    });
  }
}

const documentsSlice = createSlice({
  name: 'departmentOfficerDocuments',
  initialState: documentsInitialState,
  reducers: {
    clearDocumentPreview(state, action) {
      const id = String(action.payload.documentId);
      const preview = state.previewsByDocumentId[id];
      if (!preview || preview.requestId !== action.payload.requestId) return;
      delete state.previewsByDocumentId[id];
    },
  },
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchDocumentsByApplication, 'fetchByApplication', (state, action) => {
      state.byApplicationId[String(action.meta.arg)] = unwrapList(action.payload);
      state.byApplicationId[String(action.meta.arg)].forEach((document) => {
        if (document?.document_id !== undefined) state.byId[String(document.document_id)] = document;
      });
    });
    addRequestLifecycle(builder, fetchDocumentById, 'fetchById', (state, action) => {
      const document = unwrapItem(action.payload);
      state.byId[String(document.document_id)] = document;
      replaceDocument(state, document);
    });
    addRequestLifecycle(builder, createDocument, 'create', (state, action) => {
      replaceDocument(state, unwrapItem(action.payload));
    });
    addRequestLifecycle(builder, updateDocumentStatus, 'updateStatus', (state, action) => {
      replaceDocument(state, unwrapItem(action.payload));
    });
    addRequestLifecycle(builder, deleteDocument, 'delete', (state, action) => {
      removeDocument(state, action.meta.arg);
    });
    builder
      .addCase(fetchDocumentPreview.pending, (state, action) => {
        setFileRequest(state, action, 'preview', 'pending');
      })
      .addCase(fetchDocumentPreview.fulfilled, (state, action) => {
        const id = action.payload.documentId;
        if (state.fileRequestIdsByDocumentId[id]?.preview !== action.meta.requestId) return;
        state.fileRequestsByDocumentId[id].preview = 'fulfilled';
        state.fileErrorsByDocumentId[id].preview = null;
        state.previewsByDocumentId[id] = action.payload;
      })
      .addCase(fetchDocumentPreview.rejected, (state, action) => {
        const id = String(action.meta.arg.id);
        if (state.fileRequestIdsByDocumentId[id]?.preview !== action.meta.requestId) return;
        state.fileRequestsByDocumentId[id].preview = action.meta.aborted ? 'idle' : 'rejected';
        state.fileErrorsByDocumentId[id].preview = action.meta.aborted
          ? null
          : action.error?.message || 'The document could not be retrieved.';
      })
      .addCase(downloadDocumentFile.pending, (state, action) => {
        setFileRequest(state, action, 'download', 'pending');
      })
      .addCase(downloadDocumentFile.fulfilled, (state, action) => {
        const id = action.payload.documentId;
        if (state.fileRequestIdsByDocumentId[id]?.download !== action.meta.requestId) return;
        state.fileRequestsByDocumentId[id].download = 'fulfilled';
        state.fileErrorsByDocumentId[id].download = null;
      })
      .addCase(downloadDocumentFile.rejected, (state, action) => {
        const id = String(action.meta.arg.id);
        if (state.fileRequestIdsByDocumentId[id]?.download !== action.meta.requestId) return;
        state.fileRequestsByDocumentId[id].download = action.meta.aborted ? 'idle' : 'rejected';
        state.fileErrorsByDocumentId[id].download = action.meta.aborted
          ? null
          : action.error?.message || 'The document could not be retrieved.';
      });
    resetOnAuthChange(builder, documentsInitialState);
  },
});

export const selectDocumentsState = (state) => state.departmentOfficerDocuments;
const EMPTY_DOCUMENTS = Object.freeze([]);
export const selectDocumentsByApplication = (state, applicationId) =>
  selectDocumentsState(state).byApplicationId[String(applicationId)] || EMPTY_DOCUMENTS;
export const { clearDocumentPreview } = documentsSlice.actions;
export default documentsSlice.reducer;
