import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  unwrapList,
} from '../../department-officer/store/requestUtils.js';

const readRoles = ['municipal_commissioner', 'platform_admin'];

export const fetchOfficers = createAsyncThunk(
  'officers/fetchAll',
  (_, thunkApi) => {
    if (!readRoles.includes(thunkApi.getState()?.auth?.user?.role)) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot access the officers listing.' });
    }
    return departmentOfficerRequest('/officers', {}, thunkApi);
  },
);

export const officersInitialState = createRequestState({ items: [], byId: {} });

const officersSlice = createSlice({
  name: 'officers',
  initialState: officersInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchOfficers, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.byId = Object.fromEntries(
        state.items.filter((item) => item?.id !== undefined)
          .map((item) => [String(item.id), item]),
      );
    });
    resetOnAuthChange(builder, officersInitialState);
  },
});

export const selectOfficersState = (state) => state.officers;
export const selectOfficers = (state) => selectOfficersState(state).items;
export const selectOfficerById = (state, id) => selectOfficersState(state).byId[String(id)] || null;
export const selectOfficersRequest = (state) => selectOfficersState(state).requests.fetchAll;
export const selectOfficersError = (state) => selectOfficersState(state).errors.fetchAll;

export default officersSlice.reducer;
