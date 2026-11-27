import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { documentsApi } from './documentsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

export const fetchDocumentsByApplication = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/fetchByApplication',
  documentsApi.fetchByApplication,
);
export const fetchDocuments = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/fetchAll',
  documentsApi.fetchAll,
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
    const requestIsCurrent = thunkApi.getState().documents.fileRequestIdsByDocumentId[String(id)]?.preview === thunkApi.requestId;
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
  allIds: [],
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
  const id = String(document.document_id);
  const previous = state.byId[id];
  state.byId[id] = document;
  if (!state.allIds.includes(id)) state.allIds.push(id);
  if (previous && String(previous.application_id) !== String(document.application_id)) {
    const previousApplicationId = String(previous.application_id);
    state.byApplicationId[previousApplicationId] = (state.byApplicationId[previousApplicationId] || [])
      .filter((documentId) => documentId !== id);
  }
  const applicationId = String(document.application_id);
  const documents = state.byApplicationId[applicationId] || [];
  if (!documents.includes(id)) documents.push(id);
  state.byApplicationId[applicationId] = documents;
}

function removeDocument(state, id) {
  const key = String(id);
  const document = state.byId[key];
  delete state.byId[key];
  state.allIds = state.allIds.filter((documentId) => documentId !== key);
  if (document) {
    const appKey = String(document.application_id);
    state.byApplicationId[appKey] = (state.byApplicationId[appKey] || [])
      .filter((documentId) => documentId !== key);
  } else {
    Object.keys(state.byApplicationId).forEach((appKey) => {
      state.byApplicationId[appKey] = state.byApplicationId[appKey]
        .filter((documentId) => documentId !== key);
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
    addRequestLifecycle(builder, fetchDocuments, 'fetchAll', (state, action) => {
      const documents = unwrapList(action.payload);
      state.allIds = documents
        .filter((document) => document?.document_id !== undefined && document?.document_id !== null)
        .map((document) => String(document.document_id));
      state.byId = Object.fromEntries(documents
        .filter((document) => document?.document_id !== undefined && document?.document_id !== null)
        .map((document) => [String(document.document_id), document]));
      state.byApplicationId = documents.reduce((byApplicationId, document) => {
        if (document?.document_id === undefined || document?.document_id === null) return byApplicationId;
        const applicationId = String(document.application_id);
        if (!byApplicationId[applicationId]) byApplicationId[applicationId] = [];
        byApplicationId[applicationId].push(String(document.document_id));
        return byApplicationId;
      }, {});
    });
    addRequestLifecycle(builder, fetchDocumentsByApplication, 'fetchByApplication', (state, action) => {
      const documents = unwrapList(action.payload);
      const applicationId = String(action.meta.arg);
      const documentIds = documents
        .filter((document) => document?.document_id !== undefined && document?.document_id !== null)
        .map((document) => String(document.document_id));
      const currentIds = new Set(documentIds);
      (state.byApplicationId[applicationId] || []).forEach((oldId) => {
        if (!currentIds.has(oldId)) {
          delete state.byId[oldId];
          state.allIds = state.allIds.filter((id) => id !== oldId);
        }
      });
      state.byApplicationId[applicationId] = documentIds;
      documents.forEach((document) => {
        if (document?.document_id !== undefined && document?.document_id !== null) {
          state.byId[String(document.document_id)] = document;
          if (!state.allIds.includes(String(document.document_id))) state.allIds.push(String(document.document_id));
        }
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

export const selectDocumentsState = (state) => state.documents;
export const selectDocuments = createSelector(
  [(state) => state.documents.allIds, (state) => state.documents.byId],
  (allIds, byId) => allIds.map((id) => byId[id]).filter(Boolean),
);
export const selectDocumentById = (state, id) => selectDocumentsState(state).byId[String(id)] || null;
const EMPTY_DOCUMENTS = Object.freeze([]);
export const selectDocumentsByApplication = createSelector(
  [
    (state, applicationId) => state.documents.byApplicationId[String(applicationId)] || EMPTY_DOCUMENTS,
    (state) => state.documents.byId,
  ],
  (ids, byId) => ids.map((id) => byId[id]).filter(Boolean),
);
export const { clearDocumentPreview } = documentsSlice.actions;
export default documentsSlice.reducer;
