import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeAuthUser, readAuthStorage, writeAuthUserSnapshot } from './authStorage.js';
import { API_BASE } from '../../services/baseApi.js';

async function postAuthRequest(path, body, thunkApi) {
  const { signal } = thunkApi;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
      return { error: message || `Request failed (${response.status}).` };
    }
    return { payload, status: response.status };
  } catch (error) {
    return { error: error?.message || 'The request could not be completed.' };
  }
}

export const loginApplicant = createAsyncThunk(
  'auth/login',
  async (credentials, thunkApi) => {
    const result = await postAuthRequest('/auth/login', credentials, thunkApi);
    if (result.error) return thunkApi.rejectWithValue(result.error);
    const payload = result.payload;
    if (
      !payload?.accessToken ||
      !normalizeAuthUser(payload.user) ||
      payload.user.role !== credentials.role
    ) {
      return thunkApi.rejectWithValue('The server returned an invalid login response.');
    }
    thunkApi.dispatch(setCredentials({ user: payload.user, accessToken: payload.accessToken }));
    return payload;
  },
);

export const registerApplicant = createAsyncThunk(
  'auth/registerApplicant',
  async (userDetails, thunkApi) => {
    const result = await postAuthRequest('/users/register', userDetails, thunkApi);
    if (result.error) return thunkApi.rejectWithValue(result.error);
    if (result.status !== 201) {
      return thunkApi.rejectWithValue('Registration failed. Please try again.');
    }
    return true;
  },
);

async function requestApplicantUserUpdate(path, body, thunkApi) {
  const { getState, signal } = thunkApi;
  const auth = getState()?.auth;
  if (auth?.user?.role !== 'applicant' || !auth?.accessToken) {
    return { error: 'Your applicant session has expired. Please sign in again.' };
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
      return { error: message || `Request failed (${response.status}).` };
    }
    return { payload };
  } catch (error) {
    return { error: error?.message || 'The request could not be completed.' };
  }
}

export const updateApplicantProfile = createAsyncThunk(
  'auth/updateApplicantProfile',
  async (profile, thunkApi) => {
    const signedInAuth = thunkApi.getState()?.auth;
    const userId = signedInAuth?.user?.userId;
    if (userId === undefined || userId === null || userId === '') {
      return thunkApi.rejectWithValue('Your applicant profile is missing an account ID. Please sign in again.');
    }
    const result = await requestApplicantUserUpdate(
      `/users/${encodeURIComponent(userId)}`,
      profile,
      thunkApi,
    );
    if (result.error) return thunkApi.rejectWithValue(result.error);
    const updatedUser = normalizeAuthUser(result.payload?.data ?? result.payload);
    if (!updatedUser || String(updatedUser.userId) !== String(userId)) {
      return thunkApi.rejectWithValue('The server returned an invalid updated profile.');
    }

    const currentAuth = thunkApi.getState()?.auth;
    let snapshotStatus = 'session-changed';
    if (
      String(currentAuth?.user?.userId) === String(userId) &&
      currentAuth?.accessToken === signedInAuth.accessToken
    ) {
      snapshotStatus = writeAuthUserSnapshot(updatedUser).status;
    }
    return thunkApi.fulfillWithValue(updatedUser, {
      authUserId: String(userId),
      authAccessToken: signedInAuth.accessToken,
      snapshotStatus,
    });
  },
);

export const changeApplicantPassword = createAsyncThunk(
  'auth/changeApplicantPassword',
  async (passwords, thunkApi) => {
    const result = await requestApplicantUserUpdate('/users/me/password', passwords, thunkApi);
    if (result.error) return thunkApi.rejectWithValue(result.error);
    if (result.payload?.success !== true) {
      return thunkApi.rejectWithValue('The server did not confirm the password change.');
    }
    return result.payload;
  },
);

const storedAuth = readAuthStorage();

const initialState = {
  user: storedAuth.user,
  accessToken: storedAuth.accessToken,
  status: storedAuth.user && storedAuth.accessToken ? 'authenticated' : 'anonymous',
  loginStatus: 'idle',
  loginError: null,
  registrationStatus: 'idle',
  registrationError: null,
  profileUpdateStatus: 'idle',
  profileUpdateError: null,
  passwordChangeStatus: 'idle',
  passwordChangeError: null,
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
        state.profileUpdateStatus = 'idle';
        state.profileUpdateError = null;
        return;
      }

      state.user = user;
      state.accessToken = accessToken;
      state.status = 'authenticated';
      state.profileUpdateStatus = 'idle';
      state.profileUpdateError = null;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
      state.loginStatus = 'idle';
      state.loginError = null;
      state.profileUpdateStatus = 'idle';
      state.profileUpdateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginApplicant.pending, (state) => {
        state.loginStatus = 'pending';
        state.loginError = null;
      })
      .addCase(loginApplicant.fulfilled, (state, action) => {
        const accessToken = action.payload?.accessToken;
        const user = normalizeAuthUser(action.payload?.user);
        if (typeof accessToken !== 'string' || !accessToken.trim() || !user) {
          state.loginStatus = 'rejected';
          state.loginError = 'The server returned an invalid login response.';
          return;
        }
        state.user = user;
        state.accessToken = accessToken;
        state.status = 'authenticated';
        state.loginStatus = 'fulfilled';
        state.loginError = null;
      })
      .addCase(loginApplicant.rejected, (state, action) => {
        state.loginStatus = 'rejected';
        state.loginError = action.payload || action.error?.message || 'Unable to sign in.';
      })
      .addCase(registerApplicant.pending, (state) => {
        state.registrationStatus = 'pending';
        state.registrationError = null;
      })
      .addCase(registerApplicant.fulfilled, (state) => {
        state.registrationStatus = 'fulfilled';
        state.registrationError = null;
      })
      .addCase(registerApplicant.rejected, (state, action) => {
        state.registrationStatus = 'rejected';
        state.registrationError = action.payload || action.error?.message || 'Unable to register.';
      })
      .addCase(updateApplicantProfile.pending, (state) => {
        state.profileUpdateStatus = 'pending';
        state.profileUpdateError = null;
      })
      .addCase(updateApplicantProfile.fulfilled, (state, action) => {
        const sameAuthSession =
          String(state.user?.userId) === action.meta.authUserId &&
          state.accessToken === action.meta.authAccessToken;
        if (!sameAuthSession) return;

        if (action.meta.snapshotStatus === 'persisted' || action.meta.snapshotStatus === 'invalidated') {
          state.user = action.payload;
          state.profileUpdateError = action.meta.snapshotStatus === 'invalidated'
            ? 'Profile saved, but the local session snapshot could not be refreshed. Sign in again before refreshing this page.'
            : null;
        } else {
          state.profileUpdateError = 'Profile saved, but browser session storage could not be updated or cleared. Your current profile remains unchanged in Redux.';
        }
        state.profileUpdateStatus = 'fulfilled';
      })
      .addCase(updateApplicantProfile.rejected, (state, action) => {
        state.profileUpdateStatus = 'rejected';
        state.profileUpdateError = action.payload || action.error?.message || 'Unable to update profile.';
      })
      .addCase(changeApplicantPassword.pending, (state) => {
        state.passwordChangeStatus = 'pending';
        state.passwordChangeError = null;
      })
      .addCase(changeApplicantPassword.fulfilled, (state) => {
        state.passwordChangeStatus = 'fulfilled';
        state.passwordChangeError = null;
      })
      .addCase(changeApplicantPassword.rejected, (state, action) => {
        state.passwordChangeStatus = 'rejected';
        state.passwordChangeError = action.payload || action.error?.message || 'Unable to change password.';
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const selectLoginStatus = (state) => state.auth.loginStatus;
export const selectLoginError = (state) => state.auth.loginError;
export const selectRegistrationStatus = (state) => state.auth.registrationStatus;
export const selectRegistrationError = (state) => state.auth.registrationError;
export const selectApplicantProfileUpdateStatus = (state) => state.auth.profileUpdateStatus;
export const selectApplicantProfileUpdateError = (state) => state.auth.profileUpdateError;
export const selectApplicantPasswordChangeStatus = (state) => state.auth.passwordChangeStatus;
export const selectApplicantPasswordChangeError = (state) => state.auth.passwordChangeError;
export default authSlice.reducer;
