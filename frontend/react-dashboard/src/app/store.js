import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../features/auth/authSlice';
import { baseApi } from '../services/baseApi';

const resetApiCacheOnCredentials = ({ dispatch }) => (next) => (action) => {
  const result = next(action);
  if (setCredentials.match(action)) {
    dispatch(baseApi.util.resetApiState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, resetApiCacheOnCredentials),
});
