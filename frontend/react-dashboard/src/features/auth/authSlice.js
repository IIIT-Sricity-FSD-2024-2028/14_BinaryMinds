import { createSlice } from '@reduxjs/toolkit';
import { normalizeAuthUser, readAuthStorage } from './authStorage.js';

const storedAuth = readAuthStorage();

const initialState = {
  user: storedAuth.user,
  accessToken: storedAuth.accessToken,
  status: storedAuth.user && storedAuth.accessToken ? 'authenticated' : 'anonymous',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const accessToken = action.payload?.accessToken;
      const user = normalizeAuthUser(action.payload?.user);

      if (typeof accessToken !== 'string' || !accessToken.trim() || !user) {
        state.user = null;
        state.accessToken = null;
        state.status = 'anonymous';
        return;
      }

      state.user = user;
      state.accessToken = accessToken;
      state.status = 'authenticated';
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
