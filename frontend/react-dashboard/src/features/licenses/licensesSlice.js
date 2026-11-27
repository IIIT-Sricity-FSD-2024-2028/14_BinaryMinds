import { createSlice } from '@reduxjs/toolkit';
import { licensesApi } from './licensesApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

export const fetchLicenses = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/fetchAll',
  licensesApi.fetchAll,
);
export const fetchLicenseById = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/fetchById',
  licensesApi.fetchById,
);
export const fetchLicenseByApplication = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/fetchByApplication',
  licensesApi.fetchByApplication,
);
export const fetchLicenseByNumber = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/fetchByNumber',
  licensesApi.fetchByNumber,
);
export const createLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/create',
  licensesApi.create,
);
export const updateLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/update',
  licensesApi.update,
);
export const suspendLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/suspend',
  licensesApi.suspend,
);
export const revokeLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/revoke',
  licensesApi.revoke,
);
export const renewLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/renew',
  licensesApi.renew,
);
export const deleteLicense = createDepartmentOfficerThunk(
  'departmentOfficerLicenses/delete',
  licensesApi.delete,
);

export const licensesInitialState = createRequestState({ items: [], current: null, byApplicationId: {}, initialized: false });

function storeLicense(state, value) {
  const license = unwrapItem(value);
  if (!license || license.license_id === undefined || license.license_id === null) return;
  replaceOrAppend(state.items, license, 'license_id');
  state.byApplicationId[String(license.application_id)] = license;
  if (String(state.current?.license_id) === String(license.license_id)) state.current = license;
}

const licensesSlice = createSlice({
  name: 'departmentOfficerLicenses',
  initialState: licensesInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchLicenses, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.initialized = true;
      state.byApplicationId = Object.fromEntries(
        state.items.map((license) => [String(license.application_id), license]),
      );
    }, (state) => {
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchLicenseById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      storeLicense(state, state.current);
    });
    addRequestLifecycle(builder, fetchLicenseByApplication, 'fetchByApplication', (state, action) => {
      const license = unwrapItem(action.payload);
      state.byApplicationId[String(action.meta.arg)] = license;
      if (license?.license_id !== undefined && license?.license_id !== null) storeLicense(state, license);
    });
    addRequestLifecycle(builder, fetchLicenseByNumber, 'fetchByNumber', (state, action) => {
      state.current = unwrapItem(action.payload);
      storeLicense(state, state.current);
    });
    addRequestLifecycle(builder, createLicense, 'create', (state, action) => {
      const license = unwrapItem(action.payload);
      const requestedApplicationId = action.meta.arg.application_id;
      if (
        Number(license?.application_id) !== Number(requestedApplicationId) ||
        !license?.license_number ||
        !license?.issued_date ||
        !license?.expiry_date
      ) return;
      storeLicense(state, license);
    });
    addRequestLifecycle(builder, updateLicense, 'update', (state, action) => storeLicense(state, action.payload));
    addRequestLifecycle(builder, suspendLicense, 'suspend', (state, action) => storeLicense(state, action.payload));
    addRequestLifecycle(builder, revokeLicense, 'revoke', (state, action) => storeLicense(state, action.payload));
    addRequestLifecycle(builder, renewLicense, 'renew', (state, action) => storeLicense(state, action.payload));
    addRequestLifecycle(builder, deleteLicense, 'delete', (state, action) => {
      const id = String(action.meta.arg);
      const existing = state.items.find((license) => String(license.license_id) === id);
      state.items = state.items.filter((license) => String(license.license_id) !== id);
      if (existing && String(state.byApplicationId[existing.application_id]?.license_id) === id) {
        delete state.byApplicationId[String(existing.application_id)];
      }
      if (String(state.current?.license_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, licensesInitialState);
  },
});

export const selectLicensesState = (state) => state.licenses;
export const selectLicenses = (state) => selectLicensesState(state).items;
export const selectLicenseByApplication = (state, applicationId) =>
  selectLicensesState(state).byApplicationId[String(applicationId)] || null;
export default licensesSlice.reducer;
