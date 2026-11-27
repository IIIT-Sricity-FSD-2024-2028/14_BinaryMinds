import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginApplicant } from '../../features/auth/authSlice.js';
import { checkApplicantApplicationsForDuplicates } from '../../features/applications/applicationsSlice.js';
import { selectAccessToken, selectCurrentRole } from '../../features/auth/authSelectors.js';
import { API_BASE } from '../../services/apiClient.js';
import { createRequestState, resetOnAuthChange, unwrapItem } from '../../services/asyncThunkUtils.js';
import { clearSessionOnUnauthorized } from '../../services/unauthorizedSession.js';

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
  else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET', headers, body, signal,
    });
    clearSessionOnUnauthorized(response, thunkApi);
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

export const fetchApplicantLicenseByApplication = createAsyncThunk(
  'applicantWorkflow/fetchLicenseByApplication',
  (applicationId, api) => applicantRequest(`/licenses/application/${encodeURIComponent(applicationId)}`, {}, api),
);

export const applicantWorkflowInitialState = createRequestState({
  workflow: initialWorkflow(),
  licensesByApplicationId: {},
  licenseRequestsByApplicationId: {},
  licenseErrorsByApplicationId: {},
  licenseRequestIdsByApplicationId: {},
});

const applicantWorkflowSlice = createSlice({
  name: 'applicantWorkflow',
  initialState: applicantWorkflowInitialState,
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
    builder
      .addCase(checkApplicantApplicationsForDuplicates.pending, (state) => {
        state.licensesByApplicationId = {};
        state.licenseRequestsByApplicationId = {};
        state.licenseErrorsByApplicationId = {};
        state.licenseRequestIdsByApplicationId = {};
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
    resetOnAuthChange(builder, applicantWorkflowInitialState);
    builder.addCase(loginApplicant.fulfilled, () => structuredClone(applicantWorkflowInitialState));
  },
});

export const {
  updateApplicationField, setApplicationForm, setApplicationErrors, setApplicationError, resetApplicationForm,
  setUploadFile, setUploadError, setUploadedDocumentIds, setUploadMessage, clearUploadWorkflow,
  setSelectedApplicationId, setPaymentMethod, setPaymentMessage, setPaymentError, setRenewalField, setRenewalFile,
  setRenewalValidation, setRenewalMessage, setResultState, setLicensePageError, setStatusLicense,
} = applicantWorkflowSlice.actions;

export const selectApplicantApplicationWorkflow = (state) => state.applicantWorkflow.workflow;
export const selectApplicantLicensesByApplicationId = (state) => state.applicantWorkflow.licensesByApplicationId;
export const selectApplicantLicenseRequestsByApplicationId = (state) => state.applicantWorkflow.licenseRequestsByApplicationId;
export const selectApplicantLicenseErrorsByApplicationId = (state) => state.applicantWorkflow.licenseErrorsByApplicationId;

export default applicantWorkflowSlice.reducer;
