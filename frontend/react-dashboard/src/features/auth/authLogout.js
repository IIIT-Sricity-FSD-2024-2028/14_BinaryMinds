import { clearCredentials } from './authActions.js';
import { clearAuthStorage } from './authStorage.js';

export function logoutAndResetApi() {
  return (dispatch) => {
    clearAuthStorage();
    dispatch(clearCredentials());
  };
}
