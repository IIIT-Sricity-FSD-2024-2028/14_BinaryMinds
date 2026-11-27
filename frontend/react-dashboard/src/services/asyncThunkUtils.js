import { createAsyncThunk } from '@reduxjs/toolkit';
import { clearCredentials } from '../features/auth/authActions.js';
import { setCredentials } from '../features/auth/authSlice.js';
import { selectAccessToken } from '../features/auth/authSelectors.js';
import { API_BASE } from './apiClient.js';
import { clearSessionOnUnauthorized } from './unauthorizedSession.js';

async function sendDepartmentOfficerRequest(path, options, thunkApi) {
  const { getState, signal } = thunkApi;
  const token = selectAccessToken(getState());
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else headers.delete('Authorization');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let body;
  if (isFormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body,
    signal,
  });
  clearSessionOnUnauthorized(response, thunkApi);
  return response;
}

async function readErrorResponse(response) {
  const payload = await response.json().catch(() => null);
  const serverMessage = Array.isArray(payload?.message)
    ? payload.message.join(' ')
    : payload?.message || payload?.error;
  return {
    status: response.status,
    message: serverMessage || `Request failed (${response.status}).`,
    data: payload,
  };
}

export async function departmentOfficerRequest(path, options = {}, thunkApi) {
  const { rejectWithValue } = thunkApi;
  try {
    const response = await sendDepartmentOfficerRequest(path, options, thunkApi);
    const payload = response.status === 204
      ? null
      : await response.json().catch(() => null);

    if (!response.ok) {
      const serverMessage = Array.isArray(payload?.message)
        ? payload.message.join(' ')
        : payload?.message || payload?.error;
      return rejectWithValue({
        status: response.status,
        message: serverMessage || `Request failed (${response.status}).`,
        data: payload,
      });
    }

    return payload;
  } catch (error) {
    return rejectWithValue({
      message: error?.message || 'The request could not be completed.',
    });
  }
}

export async function departmentOfficerBinaryRequest(path, options = {}, thunkApi) {
  const response = await sendDepartmentOfficerRequest(path, options, thunkApi);
  if (!response.ok) {
    const error = await readErrorResponse(response);
    const requestError = new Error(error.message);
    requestError.status = error.status;
    requestError.data = error.data;
    throw requestError;
  }

  const blob = await response.blob();
  return { blob, mimeType: response.headers.get('content-type') || blob.type || '' };
}

export function addRequestLifecycle(builder, thunk, operation, onFulfilled, onRejected) {
  builder
    .addCase(thunk.pending, (state) => {
      state.requests[operation] = 'pending';
      state.errors[operation] = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.requests[operation] = 'fulfilled';
      state.errors[operation] = null;
      onFulfilled?.(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      state.requests[operation] = 'rejected';
      state.errors[operation] = action.payload?.message || action.error?.message || 'Request failed.';
      onRejected?.(state, action);
    });
}

export function resetOnAuthChange(builder, initialState) {
  const reset = () => structuredClone(initialState);
  builder
    .addCase(setCredentials, reset)
    .addCase(clearCredentials, reset);
}

export function createRequestState(collectionFields = {}) {
  return {
    ...collectionFields,
    requests: {},
    errors: {},
  };
}

export function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export function unwrapItem(response) {
  return response?.data ?? response;
}

export function isDepartmentDecisionConfirmed(response, requestedStatus) {
  const expectedApplicationStatus = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CLARIFICATION_REQUESTED: 'department_review',
  }[requestedStatus];
  return Boolean(
    expectedApplicationStatus &&
    response?.review?.status === requestedStatus &&
    response?.application?.application_status === expectedApplicationStatus,
  );
}

export function replaceOrAppend(items, item, idField) {
  if (!item || item[idField] === undefined || item[idField] === null) return items;
  const index = items.findIndex((existing) => String(existing[idField]) === String(item[idField]));
  if (index < 0) items.push(item);
  else items[index] = item;
  return items;
}

export function createDepartmentOfficerThunk(typePrefix, repositoryRequest) {
  return createAsyncThunk(typePrefix, (argument, thunkApi) =>
    repositoryRequest(argument, thunkApi),
  );
}
