import { createSlice } from '@reduxjs/toolkit';
import { resetOnAuthChange } from '../../services/asyncThunkUtils.js';

const emptyMunicipalHeadForm = () => ({ full_name: '', email: '', phone: '', password: '' });
const initialState = {
  corporationForm: null,
  municipalHeadForm: emptyMunicipalHeadForm(),
  feeSettingsForm: null,
};
const slice = createSlice({
  name: 'platformAdminUi',
  initialState,
  reducers: {
    setCorporationForm(state, action) { state.corporationForm = action.payload; },
    setCorporationFormField(state, action) {
      if (state.corporationForm) state.corporationForm[action.payload.field] = action.payload.value;
    },
    setMunicipalHeadFormField(state, action) {
      state.municipalHeadForm[action.payload.field] = action.payload.value;
    },
    resetMunicipalHeadForm(state) { state.municipalHeadForm = emptyMunicipalHeadForm(); },
    setFeeSettingsForm(state, action) { state.feeSettingsForm = action.payload; },
    setFeeSettingsFormField(state, action) {
      if (state.feeSettingsForm) state.feeSettingsForm[action.payload.field] = action.payload.value;
    },
  },
  extraReducers: (builder) => resetOnAuthChange(builder, initialState),
});

export const {
  setCorporationForm,
  setCorporationFormField,
  setMunicipalHeadFormField,
  resetMunicipalHeadForm,
  setFeeSettingsForm,
  setFeeSettingsFormField,
} = slice.actions;
export const selectPlatformAdminUi = (state) => state.platformAdminUi;
export default slice.reducer;
