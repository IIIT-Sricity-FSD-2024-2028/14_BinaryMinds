import { createSlice } from '@reduxjs/toolkit';
import { resetOnAuthChange } from '../../services/asyncThunkUtils.js';

const initialState = { departmentOfficerForm: null, fieldOfficerForm: null, fieldOfficerEditingId: null };
const slice = createSlice({
  name: 'commissionerUi',
  initialState,
  reducers: {
    setDepartmentOfficerForm(state, action) { state.departmentOfficerForm = action.payload; },
    setDepartmentOfficerFormField(state, action) {
      if (state.departmentOfficerForm) state.departmentOfficerForm[action.payload.field] = action.payload.value;
    },
    setFieldOfficerEditor(state, action) {
      state.fieldOfficerForm = action.payload.form;
      state.fieldOfficerEditingId = action.payload.editingId ?? null;
    },
    setFieldOfficerFormField(state, action) {
      if (state.fieldOfficerForm) state.fieldOfficerForm[action.payload.field] = action.payload.value;
    },
  },
  extraReducers: (builder) => resetOnAuthChange(builder, initialState),
});

export const {
  setDepartmentOfficerForm,
  setDepartmentOfficerFormField,
  setFieldOfficerEditor,
  setFieldOfficerFormField,
} = slice.actions;
export const selectCommissionerUi = (state) => state.commissionerUi;
export default slice.reducer;
