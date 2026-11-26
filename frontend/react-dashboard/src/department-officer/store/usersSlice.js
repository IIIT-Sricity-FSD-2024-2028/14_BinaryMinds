import { createSlice } from '@reduxjs/toolkit';
import { usersApi } from '../api/usersApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from './requestUtils.js';

export const fetchDepartmentOfficerProfile = createDepartmentOfficerThunk(
  'departmentOfficerUsers/fetchProfile',
  usersApi.fetchProfile,
);
export const fetchDepartmentOfficerUsers = createDepartmentOfficerThunk(
  'departmentOfficerUsers/fetchAll',
  usersApi.fetchAll,
);
export const fetchDepartmentOfficerUserById = createDepartmentOfficerThunk(
  'departmentOfficerUsers/fetchById',
  usersApi.fetchById,
);
export const updateDepartmentOfficerUser = createDepartmentOfficerThunk(
  'departmentOfficerUsers/update',
  usersApi.update,
);
export const deleteDepartmentOfficerUser = createDepartmentOfficerThunk(
  'departmentOfficerUsers/delete',
  usersApi.delete,
);

export const usersInitialState = createRequestState({ profile: null, items: [], byId: {} });

function storeUser(state, value) {
  const user = unwrapItem(value);
  if (!user || user.user_id === undefined || user.user_id === null) return;
  state.byId[String(user.user_id)] = user;
  replaceOrAppend(state.items, user, 'user_id');
}

const usersSlice = createSlice({
  name: 'departmentOfficerUsers',
  initialState: usersInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchDepartmentOfficerProfile, 'fetchProfile', (state, action) => {
      state.profile = unwrapItem(action.payload);
      storeUser(state, state.profile);
    });
    addRequestLifecycle(builder, fetchDepartmentOfficerUsers, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.byId = Object.fromEntries(
        state.items.filter((user) => user?.user_id !== undefined)
          .map((user) => [String(user.user_id), user]),
      );
    });
    addRequestLifecycle(builder, fetchDepartmentOfficerUserById, 'fetchById', (state, action) => {
      storeUser(state, action.payload);
    });
    addRequestLifecycle(builder, updateDepartmentOfficerUser, 'update', (state, action) => {
      const user = unwrapItem(action.payload);
      storeUser(state, user);
      if (String(state.profile?.user_id) === String(user?.user_id)) state.profile = user;
    });
    addRequestLifecycle(builder, deleteDepartmentOfficerUser, 'delete', (state, action) => {
      const id = action.meta.arg;
      state.items = state.items.filter((user) => String(user.user_id) !== String(id));
      delete state.byId[String(id)];
      if (String(state.profile?.user_id) === String(id)) state.profile = null;
    });
    resetOnAuthChange(builder, usersInitialState);
  },
});

export const selectDepartmentOfficerUsersState = (state) => state.departmentOfficerUsers;
export const selectDepartmentOfficerProfile = (state) => selectDepartmentOfficerUsersState(state).profile;
export const selectDepartmentOfficerUserById = (state, id) =>
  selectDepartmentOfficerUsersState(state).byId[String(id)] || null;
export default usersSlice.reducer;
