import { createSlice } from '@reduxjs/toolkit';
import { clearCredentials, setCredentials } from '../../features/auth/authSlice.js';

const initialState = { values: {} };

const fieldOfficerUiSlice = createSlice({
  name: 'fieldOfficerUi',
  initialState,
  reducers: {
    setFieldOfficerValue(state, action) {
      state.values[action.payload.id] = action.payload.value;
    },
    clearFieldOfficerValue(state, action) {
      delete state.values[action.payload];
    },
    clearFieldOfficerUi() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, () => initialState);
    builder.addCase(clearCredentials, () => initialState);
  },
});

export const { setFieldOfficerValue, clearFieldOfficerValue, clearFieldOfficerUi } = fieldOfficerUiSlice.actions;
export const selectFieldOfficerValue = (state, id, fallback) => state.fieldOfficerUi.values[id] ?? fallback;
export default fieldOfficerUiSlice.reducer;
