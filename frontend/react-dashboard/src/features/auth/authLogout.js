import { baseApi } from '../../services/baseApi.js';
import { clearCredentials } from './authSlice.js';
import { clearAuthStorage } from './authStorage.js';

export function logoutAndResetApi(options = {}) {
  return (dispatch) => {
    clearAuthStorage(options);
    dispatch(clearCredentials());
    dispatch(baseApi.util.resetApiState());
  };
}
