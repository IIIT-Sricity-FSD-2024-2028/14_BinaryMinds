import { logoutAndResetApi } from '../features/auth/authLogout.js';
import { selectAccessToken } from '../features/auth/authSelectors.js';

export function clearSessionOnUnauthorized(response, thunkApi) {
  if (response?.status !== 401 || !selectAccessToken(thunkApi.getState())) return;
  thunkApi.dispatch(logoutAndResetApi());
}
