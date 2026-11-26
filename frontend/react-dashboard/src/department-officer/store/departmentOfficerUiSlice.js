import { createSlice } from '@reduxjs/toolkit';
import { resetOnAuthChange } from './requestUtils.js';

const emptyForm = Object.freeze({ reason: '', notice: '', fileError: '' });
const emptySigningForm = Object.freeze({ signature: '', expiryDate: '', notice: '', busy: false });

export const departmentOfficerUiInitialState = {
  searches: {
    dashboard: '',
    worklist: '',
    authorization: '',
    compliance: '',
    generatedLicenses: '',
  },
  worklistFilter: 'all',
  worklistNotice: '',
  authorization: {
    selectedApplicationId: null,
    reason: '',
    notice: '',
  },
  reviewFormsByApplicationId: {},
  inspectionReportByApplicationId: {},
  signingFormsByApplicationId: {},
};

const departmentOfficerUiSlice = createSlice({
  name: 'departmentOfficerUi',
  initialState: departmentOfficerUiInitialState,
  reducers: {
    setPageSearch(state, action) {
      const { page, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.searches, page)) state.searches[page] = value;
    },
    setWorklistFilter(state, action) {
      state.worklistFilter = action.payload;
    },
    setWorklistNotice(state, action) {
      state.worklistNotice = action.payload;
    },
    setAuthorizationSelectedApplication(state, action) {
      state.authorization.selectedApplicationId = action.payload.applicationId;
      state.authorization.reason = action.payload.applicationId == null ? '' : action.payload.reason || '';
      state.authorization.notice = '';
    },
    setAuthorizationReason(state, action) {
      state.authorization.reason = action.payload;
    },
    setAuthorizationNotice(state, action) {
      state.authorization.notice = action.payload;
    },
    setReviewReason(state, action) {
      const id = String(action.payload.applicationId);
      state.reviewFormsByApplicationId[id] = {
        ...emptyForm,
        ...state.reviewFormsByApplicationId[id],
        reason: action.payload.value,
      };
    },
    setReviewNotice(state, action) {
      const id = String(action.payload.applicationId);
      state.reviewFormsByApplicationId[id] = {
        ...emptyForm,
        ...state.reviewFormsByApplicationId[id],
        notice: action.payload.value,
      };
    },
    setReviewFileError(state, action) {
      const id = String(action.payload.applicationId);
      state.reviewFormsByApplicationId[id] = {
        ...emptyForm,
        ...state.reviewFormsByApplicationId[id],
        fileError: action.payload.value,
      };
    },
    setInspectionReportFileError(state, action) {
      const id = String(action.payload.applicationId);
      state.inspectionReportByApplicationId[id] = action.payload.value;
    },
    initializeSigningForm(state, action) {
      const id = String(action.payload.applicationId);
      const current = state.signingFormsByApplicationId[id];
      state.signingFormsByApplicationId[id] = {
        ...emptySigningForm,
        ...current,
        expiryDate: current?.expiryDate || action.payload.expiryDate,
        notice: current?.notice || action.payload.notice || '',
      };
    },
    setSigningSignature(state, action) {
      const id = String(action.payload.applicationId);
      state.signingFormsByApplicationId[id] = {
        ...emptySigningForm,
        ...state.signingFormsByApplicationId[id],
        signature: action.payload.value,
      };
    },
    setSigningExpiryDate(state, action) {
      const id = String(action.payload.applicationId);
      state.signingFormsByApplicationId[id] = {
        ...emptySigningForm,
        ...state.signingFormsByApplicationId[id],
        expiryDate: action.payload.value,
      };
    },
    setSigningNotice(state, action) {
      const id = String(action.payload.applicationId);
      state.signingFormsByApplicationId[id] = {
        ...emptySigningForm,
        ...state.signingFormsByApplicationId[id],
        notice: action.payload.value,
      };
    },
    setSigningBusy(state, action) {
      const id = String(action.payload.applicationId);
      state.signingFormsByApplicationId[id] = {
        ...emptySigningForm,
        ...state.signingFormsByApplicationId[id],
        busy: action.payload.value,
      };
    },
  },
  extraReducers: (builder) => {
    resetOnAuthChange(builder, departmentOfficerUiInitialState);
  },
});

export const {
  initializeSigningForm,
  setAuthorizationNotice,
  setAuthorizationReason,
  setAuthorizationSelectedApplication,
  setInspectionReportFileError,
  setPageSearch,
  setReviewFileError,
  setReviewNotice,
  setReviewReason,
  setSigningExpiryDate,
  setSigningBusy,
  setSigningNotice,
  setSigningSignature,
  setWorklistFilter,
  setWorklistNotice,
} = departmentOfficerUiSlice.actions;

export const selectDepartmentOfficerUi = (state) => state.departmentOfficerUi;
export const selectPageSearch = (state, page) => selectDepartmentOfficerUi(state).searches[page] || '';
export const selectWorklistFilter = (state) => selectDepartmentOfficerUi(state).worklistFilter;
export const selectWorklistNotice = (state) => selectDepartmentOfficerUi(state).worklistNotice;
export const selectAuthorizationUi = (state) => selectDepartmentOfficerUi(state).authorization;
export const selectReviewForm = (state, applicationId) =>
  selectDepartmentOfficerUi(state).reviewFormsByApplicationId[String(applicationId)] || emptyForm;
export const selectInspectionReportFileError = (state, applicationId) =>
  selectDepartmentOfficerUi(state).inspectionReportByApplicationId[String(applicationId)] || '';
export const selectSigningForm = (state, applicationId) =>
  selectDepartmentOfficerUi(state).signingFormsByApplicationId[String(applicationId)] || emptySigningForm;

export default departmentOfficerUiSlice.reducer;
