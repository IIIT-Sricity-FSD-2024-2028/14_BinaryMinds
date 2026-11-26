import { createAsyncThunk } from '@reduxjs/toolkit';
import { setCredentials } from '../features/auth/authSlice.js';
import { platformAdminRequest } from '../services/platformAdminApi.js';

export const loginPlatformAdmin = createAsyncThunk(
  'platformAdmin/login',
  async ({ email, password }, thunkApi) => {
    try {
      const result = await platformAdminRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, role: 'platform_admin' }),
      });

      if (result?.user?.role !== 'platform_admin' || !result.accessToken) {
        return thunkApi.rejectWithValue('Invalid Platform Admin credentials.');
      }

      try {
        sessionStorage.setItem('accessToken', result.accessToken);
        sessionStorage.setItem('loggedInUser', JSON.stringify({
          id: result.user.user_id,
          name: result.user.full_name,
          email: result.user.email,
          role: result.user.role,
          accessToken: result.accessToken,
        }));
      } catch (error) {
        try {
          sessionStorage.removeItem('accessToken');
        } catch {
          // Continue cleanup if this storage operation is unavailable.
        }
        try {
          sessionStorage.removeItem('loggedInUser');
        } catch {
          // Continue cleanup if this storage operation is unavailable.
        }
        return thunkApi.rejectWithValue(error?.message || 'Unable to sign in.');
      }

      thunkApi.dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      return result;
    } catch (error) {
      return thunkApi.rejectWithValue(error?.message || 'Unable to sign in.');
    }
  },
);
