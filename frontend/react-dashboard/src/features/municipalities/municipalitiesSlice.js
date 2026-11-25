import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../department-officer/store/requestUtils.js';

const isPlatformAdmin = (state) => state?.auth?.user?.role === 'platform_admin';

function request(type, method, path, bodyArg) {
  return createAsyncThunk(type, (arg, thunkApi) => {
    if (method && !isPlatformAdmin(thunkApi.getState())) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Only Platform Admin can change municipalities.' });
    }
    const url = typeof path === 'function' ? path(arg) : path;
    const options = method ? { method, ...(bodyArg ? { body: bodyArg(arg) } : {}) } : {};
    return departmentOfficerRequest(url, options, thunkApi);
  });
}

export const fetchActiveMunicipalities = request('municipalities/fetchActive', null, '/municipalities');
export const fetchAllMunicipalities = request('municipalities/fetchAll', null, '/municipalities/all');
export const fetchMunicipalityById = request(
  'municipalities/fetchById', null,
  ({ id }) => `/municipalities/${encodeURIComponent(id)}`,
);
export const createMunicipality = request('municipalities/create', 'POST', '/municipalities', ({ body }) => body);
export const updateMunicipality = request(
  'municipalities/update', 'PATCH',
  ({ id }) => `/municipalities/${encodeURIComponent(id)}`,
  ({ body }) => body,
);
export const deleteMunicipality = request(
  'municipalities/delete', 'DELETE',
  ({ id }) => `/municipalities/${encodeURIComponent(id)}`,
);

export const municipalitiesInitialState = createRequestState({ items: [], byId: {}, current: null });

function storeMunicipality(state, response) {
  const item = unwrapItem(response);
  if (!item || item.municipality_id === undefined || item.municipality_id === null) return;
  state.byId[String(item.municipality_id)] = item;
  replaceOrAppend(state.items, item, 'municipality_id');
  state.current = item;
}

function storeMunicipalityList(state, response, replace = false) {
  const items = unwrapList(response);
  if (replace) {
    state.items = items;
    state.byId = Object.fromEntries(
      items.filter((item) => item?.municipality_id !== undefined && item?.municipality_id !== null)
        .map((item) => [String(item.municipality_id), item]),
    );
    if (state.current) {
      state.current = state.byId[String(state.current.municipality_id)] || null;
    }
    return;
  }
  items.forEach((item) => replaceOrAppend(state.items, item, 'municipality_id'));
  items.forEach((item) => {
    if (item?.municipality_id !== undefined && item?.municipality_id !== null) {
      state.byId[String(item.municipality_id)] = item;
    }
  });
}

const municipalitiesSlice = createSlice({
  name: 'municipalities',
  initialState: municipalitiesInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchActiveMunicipalities, 'fetchActive', (state, action) => storeMunicipalityList(state, action.payload, true));
    addRequestLifecycle(builder, fetchAllMunicipalities, 'fetchAll', (state, action) => storeMunicipalityList(state, action.payload, true));
    addRequestLifecycle(builder, fetchMunicipalityById, 'fetchById', (state, action) => storeMunicipality(state, action.payload));
    addRequestLifecycle(builder, createMunicipality, 'create', (state, action) => storeMunicipality(state, action.payload));
    addRequestLifecycle(builder, updateMunicipality, 'update', (state, action) => storeMunicipality(state, action.payload));
    addRequestLifecycle(builder, deleteMunicipality, 'delete', (state, action) => {
      const id = String(action.meta.arg.id);
      state.items = state.items.filter((item) => String(item.municipality_id) !== id);
      delete state.byId[id];
      if (String(state.current?.municipality_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, municipalitiesInitialState);
  },
});

export const selectMunicipalitiesState = (state) => state.municipalities;
export const selectMunicipalities = (state) => selectMunicipalitiesState(state).items;
export const selectMunicipalityById = (state, id) => selectMunicipalitiesState(state).byId[String(id)] || null;
export const selectCurrentMunicipality = (state) => selectMunicipalitiesState(state).current;
export const selectMunicipalitiesRequest = (state, operation) => selectMunicipalitiesState(state).requests[operation];
export const selectMunicipalitiesError = (state, operation) => selectMunicipalitiesState(state).errors[operation];

export default municipalitiesSlice.reducer;
