import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { selectAccessToken, selectCurrentRole } from '../../features/auth/authSelectors.js';
import { API_BASE } from '../../services/baseApi.js';
import { addRequestLifecycle, createRequestState, resetOnAuthChange, replaceOrAppend, unwrapItem, unwrapList } from '../../department-officer/store/requestUtils.js';

const emptyApplicationForm = {
  fullName: '', email: '', phone: '', aadhaar: '', motherName: '', gender: '', fatherName: '', municipalityId: '',
  businessName: '', businessType: 'Retail Shop', shopAddress: '', city: '', district: '', state: '', pincode: '', shopArea: '',
};
const initialWorkflow = () => ({
  applicationForm: { ...emptyApplicationForm }, applicationFormInitialized: false, applicationErrors: {}, applicationError: '',
  files: {}, uploadErrors: {}, uploadedDocumentIds: {}, uploadMessage: '',
  selectedApplicationId: '', paymentMethod: 'upi', paymentMessage: 'This is a simulated payment record. No real money is collected or transferred.', paymentError: '',
  renewalPeriod: '1year', licenseCategory: 'grocery', renewalShopArea: '450', renewalFiles: [null, null, null], renewalValidation: {}, renewalMessage: '',
  resultPayment: null, resultLoading: false, resultError: '', licensePageError: '', statusLicenseIssueDate: '', statusLicenseError: '',
});

async function applicantRequest(path, options = {}, thunkApi) {
  const { getState, signal, rejectWithValue } = thunkApi;
  if (selectCurrentRole(getState()) !== 'applicant') {
    return rejectWithValue({ status: 403, message: 'Only applicants can perform this operation.' });
  }
  const headers = new Headers(options.headers || {});
  const token = selectAccessToken(getState());
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let body;
  if (isFormData) body = options.body;
  else if (options.body !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(options.body); }
  try {
    const response = await fetch(`${API_BASE}${path}`, { method: options.method || 'GET', headers, body, signal });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || payload?.error;
      return rejectWithValue({ status: response.status, message: message || `Request failed (${response.status}).`, data: payload });
    }
    return payload;
  } catch (error) {
    return rejectWithValue({ message: error?.message || 'The request could not be completed.' });
  }
}

export const fetchApplicantApplications = createAsyncThunk('applicantApplications/fetchMine', (_, api) => applicantRequest('/applications/mine', {}, api));
export const fetchApplicantLicenseByApplication = createAsyncThunk(
  'applicantApplications/fetchLicenseByApplication',
  (applicationId, api) => applicantRequest(`/licenses/application/${encodeURIComponent(applicationId)}`, {}, api),
);
export const checkApplicantApplicationsForDuplicates = createAsyncThunk(
  'applicantApplications/checkForDuplicates',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(fetchApplicantApplications()).unwrap();
      return true;
    } catch (error) {
      return rejectWithValue(error || { message: 'Unable to check existing applications.' });
    }
  },
);
export const createApplicantApplication = createAsyncThunk('applicantApplications/create', (body, api) => applicantRequest('/applications', { method: 'POST', body }, api));
export const updateApplicantApplication = createAsyncThunk('applicantApplications/update', ({ id, body }, api) => applicantRequest(`/applications/${encodeURIComponent(id)}`, { method: 'PATCH', body }, api));

export const applicantApplicationsInitialState = createRequestState({
  items: [], current: null, initialized: false, workflow: initialWorkflow(),
  licensesByApplicationId: {}, licenseRequestsByApplicationId: {}, licenseErrorsByApplicationId: {}, licenseRequestIdsByApplicationId: {},
});
const slice = createSlice({
  name: 'applicantApplications', initialState: applicantApplicationsInitialState,
  reducers: {
    updateApplicationField(state, action) { const { field, value } = action.payload; if (field in state.workflow.applicationForm) state.workflow.applicationForm[field] = value; delete state.workflow.applicationErrors[field]; state.workflow.applicationError = ''; },
    setApplicationForm(state, action) {
      if (state.workflow.applicationFormInitialized) return;
      state.workflow.applicationForm = { ...emptyApplicationForm, ...action.payload };
      state.workflow.applicationFormInitialized = true;
    },
    setApplicationErrors(state, action) { state.workflow.applicationErrors = action.payload || {}; },
    setApplicationError(state, action) { state.workflow.applicationError = action.payload || ''; },
    resetApplicationForm(state) { state.workflow.applicationForm = { ...emptyApplicationForm }; state.workflow.applicationFormInitialized = false; state.workflow.applicationErrors = {}; state.workflow.applicationError = ''; },
    setUploadFile(state, action) { const { type, file } = action.payload; state.workflow.files[type] = file || null; delete state.workflow.uploadErrors[type]; },
    setUploadError(state, action) { const { type, message } = action.payload; state.workflow.uploadErrors[type] = message || ''; },
    setUploadedDocumentIds(state, action) { state.workflow.uploadedDocumentIds = action.payload || {}; },
    setUploadMessage(state, action) { state.workflow.uploadMessage = action.payload || ''; },
    clearUploadWorkflow(state) { state.workflow.files = {}; state.workflow.uploadErrors = {}; state.workflow.uploadedDocumentIds = {}; state.workflow.uploadMessage = ''; },
    setSelectedApplicationId(state, action) { state.workflow.selectedApplicationId = String(action.payload || ''); },
    setPaymentMethod(state, action) { state.workflow.paymentMethod = action.payload; },
    setPaymentMessage(state, action) { state.workflow.paymentMessage = action.payload || ''; },
    setPaymentError(state, action) { state.workflow.paymentError = action.payload || ''; },
    setRenewalField(state, action) { const { field, value } = action.payload; if (field === 'renewalPeriod') state.workflow.renewalPeriod = value; if (field === 'licenseCategory') state.workflow.licenseCategory = value; if (field === 'renewalShopArea') state.workflow.renewalShopArea = value; state.workflow.renewalMessage = ''; },
    setRenewalFile(state, action) { const { index, file } = action.payload; state.workflow.renewalFiles[index] = file || null; state.workflow.renewalValidation = {}; state.workflow.renewalMessage = ''; },
    setRenewalValidation(state, action) { state.workflow.renewalValidation = action.payload || {}; },
    setRenewalMessage(state, action) { state.workflow.renewalMessage = action.payload || ''; },
    setResultState(state, action) { Object.assign(state.workflow, action.payload); },
    setLicensePageError(state, action) { state.workflow.licensePageError = action.payload || ''; },
    setStatusLicense(state, action) { state.workflow.statusLicenseIssueDate = action.payload?.issuedDate || ''; state.workflow.statusLicenseError = action.payload?.error || ''; },
  },
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchApplicantApplications, 'fetchMine', (state, action) => { state.items = unwrapList(action.payload); state.initialized = true; }, (state) => { state.initialized = true; });
    builder
      .addCase(checkApplicantApplicationsForDuplicates.pending, (state) => {
        state.requests.checkForDuplicates = 'pending';
        state.errors.checkForDuplicates = null;
        state.licensesByApplicationId = {};
        state.licenseRequestsByApplicationId = {};
        state.licenseErrorsByApplicationId = {};
        state.licenseRequestIdsByApplicationId = {};
      })
      .addCase(checkApplicantApplicationsForDuplicates.fulfilled, (state) => {
        state.requests.checkForDuplicates = 'fulfilled';
        state.errors.checkForDuplicates = null;
      })
      .addCase(checkApplicantApplicationsForDuplicates.rejected, (state, action) => {
        state.requests.checkForDuplicates = 'rejected';
        state.errors.checkForDuplicates = action.payload?.message || action.error?.message || 'Request failed.';
      })
      .addCase(fetchApplicantLicenseByApplication.pending, (state, action) => {
        const id = String(action.meta.arg);
        state.licenseRequestsByApplicationId[id] = 'pending';
        state.licenseRequestIdsByApplicationId[id] = action.meta.requestId;
        delete state.licenseErrorsByApplicationId[id];
      })
      .addCase(fetchApplicantLicenseByApplication.fulfilled, (state, action) => {
        const id = String(action.meta.arg);
        if (state.licenseRequestIdsByApplicationId[id] !== action.meta.requestId) return;
        state.licenseRequestsByApplicationId[id] = 'fulfilled';
        state.licensesByApplicationId[id] = unwrapItem(action.payload);
        delete state.licenseErrorsByApplicationId[id];
      })
      .addCase(fetchApplicantLicenseByApplication.rejected, (state, action) => {
        const id = String(action.meta.arg);
        if (state.licenseRequestIdsByApplicationId[id] !== action.meta.requestId) return;
        if (action.payload?.status === 404) {
          state.licenseRequestsByApplicationId[id] = 'fulfilled';
          state.licensesByApplicationId[id] = null;
          delete state.licenseErrorsByApplicationId[id];
          return;
        }
        state.licenseRequestsByApplicationId[id] = 'rejected';
        state.licenseErrorsByApplicationId[id] = action.payload?.message || action.error?.message || 'Unable to verify the existing license.';
      });
    addRequestLifecycle(builder, createApplicantApplication, 'create', (state, action) => { state.current = unwrapItem(action.payload); replaceOrAppend(state.items, state.current, 'application_id'); });
    addRequestLifecycle(builder, updateApplicantApplication, 'update', (state, action) => { state.current = unwrapItem(action.payload); replaceOrAppend(state.items, state.current, 'application_id'); });
    resetOnAuthChange(builder, applicantApplicationsInitialState);
  },
});

export const {
  updateApplicationField, setApplicationForm, setApplicationErrors, setApplicationError, resetApplicationForm,
  setUploadFile, setUploadError, setUploadedDocumentIds, setUploadMessage, clearUploadWorkflow,
  setSelectedApplicationId, setPaymentMethod, setPaymentMessage, setPaymentError, setRenewalField, setRenewalFile,
  setRenewalValidation, setRenewalMessage, setResultState, setLicensePageError, setStatusLicense,
} = slice.actions;
export const selectApplicantApplications = (state) => state.applicantApplications.items;
export const selectApplicantLicensesByApplicationId = (state) => state.applicantApplications.licensesByApplicationId;
export const selectApplicantLicenseRequestsByApplicationId = (state) => state.applicantApplications.licenseRequestsByApplicationId;
export const selectApplicantLicenseErrorsByApplicationId = (state) => state.applicantApplications.licenseErrorsByApplicationId;
export const selectApplicantApplicationWorkflow = (state) => state.applicantApplications.workflow;
export const selectApplicantApplicationsRequest = (state, operation) => state.applicantApplications.requests[operation];
export const selectApplicantApplicationsError = (state, operation) => state.applicantApplications.errors[operation];
export default slice.reducer;
