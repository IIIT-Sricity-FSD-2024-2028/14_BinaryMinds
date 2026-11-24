import { createSlice } from '@reduxjs/toolkit';
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
  (applicationId) => ({ path: `/documents/application/${encodeURIComponent(applicationId)}` }),
);
export const fetchDocumentById = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/fetchById',
  (id) => ({ path: `/documents/${encodeURIComponent(id)}` }),
);
export const createDocument = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/create',
  ({ application_id, document_type, file }) => {
    const body = new FormData();
    body.append('application_id', String(application_id));
    body.append('document_type', document_type);
    body.append('file', file);
    return { path: '/documents', options: { method: 'POST', body } };
  },
);
export const updateDocumentStatus = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/updateStatus',
  ({ id, status, rejection_reason }) => ({
    path: `/documents/${encodeURIComponent(id)}/status`,
    options: { method: 'PATCH', body: { status, rejection_reason } },
  }),
);
export const deleteDocument = createDepartmentOfficerThunk(
  'departmentOfficerDocuments/delete',
  (id) => ({ path: `/documents/${encodeURIComponent(id)}`, options: { method: 'DELETE' } }),
);

export const documentsInitialState = createRequestState({ byApplicationId: {}, byId: {} });

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
  reducers: {},
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
    resetOnAuthChange(builder, documentsInitialState);
  },
});

export const selectDocumentsState = (state) => state.departmentOfficerDocuments;
const EMPTY_DOCUMENTS = Object.freeze([]);
export const selectDocumentsByApplication = (state, applicationId) =>
  selectDocumentsState(state).byApplicationId[String(applicationId)] || EMPTY_DOCUMENTS;
export default documentsSlice.reducer;
