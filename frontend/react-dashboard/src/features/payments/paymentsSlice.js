import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createRequestState,
  departmentOfficerRequest,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../department-officer/store/requestUtils.js';

const roles = {
  collection: ['department_officer', 'field_officer', 'municipal_commissioner', 'platform_admin'],
  byApplication: ['applicant', 'department_officer', 'field_officer', 'municipal_commissioner', 'platform_admin'],
  byId: ['applicant', 'department_officer', 'field_officer', 'municipal_commissioner', 'platform_admin'],
  create: ['applicant', 'department_officer', 'municipal_commissioner', 'platform_admin'],
  update: ['department_officer', 'applicant', 'municipal_commissioner', 'platform_admin'],
  applicantSimulation: ['applicant'],
  verify: ['department_officer', 'municipal_commissioner', 'platform_admin'],
  remove: ['department_officer', 'municipal_commissioner', 'platform_admin'],
};

function request(type, allowed, path, options, condition) {
  return createAsyncThunk(type, (arg, thunkApi) => {
    if (!allowed.includes(thunkApi.getState()?.auth?.user?.role)) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot perform this payment operation.' });
    }
    return departmentOfficerRequest(
      typeof path === 'function' ? path(arg) : path,
      typeof options === 'function' ? options(arg) : options || {},
      thunkApi,
    );
  }, condition ? { condition } : undefined);
}

function allowOneApplicantAttempt(applicationId, { getState }) {
  const state = getState();
  if (state?.auth?.user?.role !== 'applicant') return true;
  return Boolean(applicationId && !state.payments.submittingByApplication[String(applicationId)]);
}

export const fetchPayments = request('payments/fetchAll', roles.collection, '/payments');
export const fetchPaymentsByApplication = request(
  'payments/fetchByApplication', roles.byApplication,
  ({ applicationId }) => `/payments/application/${encodeURIComponent(applicationId)}`,
);
export const fetchPaymentById = request(
  'payments/fetchById', roles.byId,
  ({ id }) => `/payments/${encodeURIComponent(id)}`,
);
export const createPayment = request(
  'payments/create', roles.create, '/payments', ({ body }) => ({ method: 'POST', body }),
  ({ body }, thunkApi) => allowOneApplicantAttempt(body?.application_id, thunkApi),
);
export const updatePayment = request(
  'payments/update', roles.update,
  ({ id }) => `/payments/${encodeURIComponent(id)}`,
  ({ body }) => ({ method: 'PATCH', body }),
  ({ applicationId }, thunkApi) => allowOneApplicantAttempt(applicationId, thunkApi),
);
export const simulateApplicantPayment = request(
  'payments/simulateApplicant', roles.applicantSimulation, '/payments/simulate',
  ({ body }) => ({ method: 'POST', body }),
  ({ body }, thunkApi) => allowOneApplicantAttempt(body?.application_id, thunkApi),
);
export const verifyPayment = request(
  'payments/verify', roles.verify,
  ({ id }) => `/payments/${encodeURIComponent(id)}/verify`,
  ({ body }) => ({ method: 'POST', body }),
);
export const deletePayment = request(
  'payments/delete', roles.remove,
  ({ id }) => `/payments/${encodeURIComponent(id)}`,
  () => ({ method: 'DELETE' }),
);

export const paymentsInitialState = {
  ...createRequestState({ items: [], byId: {}, current: null }),
  applicationRequests: {},
  applicationErrors: {},
  submittingByApplication: {},
  submissionErrorsByApplication: {},
};

function storePayment(state, response) {
  const payment = unwrapItem(response);
  if (!payment || payment.payment_id === undefined || payment.payment_id === null) return;
  state.byId[String(payment.payment_id)] = payment;
  replaceOrAppend(state.items, payment, 'payment_id');
  state.current = payment;
}

function storePaymentList(state, response, replace = false) {
  const payments = unwrapList(response);
  if (replace) {
    state.items = payments;
    state.byId = Object.fromEntries(
      payments.filter((payment) => payment?.payment_id !== undefined && payment?.payment_id !== null)
        .map((payment) => [String(payment.payment_id), payment]),
    );
    if (state.current) {
      state.current = state.byId[String(state.current.payment_id)] || null;
    }
    return;
  }
  payments.forEach((payment) => replaceOrAppend(state.items, payment, 'payment_id'));
  payments.forEach((payment) => {
    if (payment?.payment_id !== undefined && payment?.payment_id !== null) {
      state.byId[String(payment.payment_id)] = payment;
    }
  });
}

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: paymentsInitialState,
  reducers: {
    clearApplicantPaymentAttempt(state, action) {
      delete state.submittingByApplication[String(action.payload)];
    },
  },
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchPayments, 'fetchAll', (state, action) => storePaymentList(state, action.payload, true));
    builder
      .addCase(fetchPaymentsByApplication.pending, (state, action) => {
        const id = String(action.meta.arg.applicationId);
        state.requests.fetchByApplication = 'pending';
        state.errors.fetchByApplication = null;
        state.applicationRequests[id] = 'pending';
        delete state.applicationErrors[id];
      })
      .addCase(fetchPaymentsByApplication.fulfilled, (state, action) => {
        const id = String(action.meta.arg.applicationId);
        state.requests.fetchByApplication = 'fulfilled';
        state.errors.fetchByApplication = null;
        state.applicationRequests[id] = 'fulfilled';
        delete state.applicationErrors[id];
        storePaymentList(state, action.payload);
      })
      .addCase(fetchPaymentsByApplication.rejected, (state, action) => {
        const id = String(action.meta.arg.applicationId);
        const message = action.payload?.message || action.error?.message || 'Request failed.';
        state.requests.fetchByApplication = 'rejected';
        state.errors.fetchByApplication = message;
        state.applicationRequests[id] = 'rejected';
        state.applicationErrors[id] = message;
      })
      .addCase(createPayment.pending, (state, action) => {
        const id = String(action.meta.arg.body?.application_id || '');
        state.requests.create = 'pending';
        state.errors.create = null;
        if (id) {
          state.submittingByApplication[id] = true;
          delete state.submissionErrorsByApplication[id];
        }
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        const id = String(action.meta.arg.body?.application_id || '');
        state.requests.create = 'fulfilled';
        state.errors.create = null;
        storePayment(state, action.payload);
        if (id) delete state.submissionErrorsByApplication[id];
      })
      .addCase(createPayment.rejected, (state, action) => {
        if (action.meta.condition) return;
        const id = String(action.meta.arg.body?.application_id || '');
        state.requests.create = 'rejected';
        state.errors.create = action.payload?.message || action.error?.message || 'Request failed.';
        if (id) {
          delete state.submittingByApplication[id];
          state.submissionErrorsByApplication[id] = state.errors.create;
        }
      })
      .addCase(updatePayment.pending, (state, action) => {
        const id = String(action.meta.arg.applicationId || '');
        state.requests.update = 'pending';
        state.errors.update = null;
        if (id) {
          state.submittingByApplication[id] = true;
          delete state.submissionErrorsByApplication[id];
        }
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        const id = String(action.meta.arg.applicationId || '');
        state.requests.update = 'fulfilled';
        state.errors.update = null;
        storePayment(state, action.payload);
        if (id) delete state.submissionErrorsByApplication[id];
      })
      .addCase(updatePayment.rejected, (state, action) => {
        if (action.meta.condition) return;
        const id = String(action.meta.arg.applicationId || '');
        state.requests.update = 'rejected';
        state.errors.update = action.payload?.message || action.error?.message || 'Request failed.';
        if (id) {
          delete state.submittingByApplication[id];
          state.submissionErrorsByApplication[id] = state.errors.update;
        }
      })
      .addCase(simulateApplicantPayment.pending, (state, action) => {
        const id = String(action.meta.arg.body?.application_id || '');
        state.requests.simulateApplicant = 'pending';
        state.errors.simulateApplicant = null;
        if (id) {
          state.submittingByApplication[id] = true;
          delete state.submissionErrorsByApplication[id];
        }
      })
      .addCase(simulateApplicantPayment.fulfilled, (state, action) => {
        const id = String(action.meta.arg.body?.application_id || '');
        state.requests.simulateApplicant = 'fulfilled';
        state.errors.simulateApplicant = null;
        storePayment(state, action.payload);
        if (id) delete state.submissionErrorsByApplication[id];
      })
      .addCase(simulateApplicantPayment.rejected, (state, action) => {
        if (action.meta.condition) return;
        const id = String(action.meta.arg.body?.application_id || '');
        const message = action.payload?.message || action.error?.message || 'Request failed.';
        state.requests.simulateApplicant = 'rejected';
        state.errors.simulateApplicant = message;
        if (id) {
          delete state.submittingByApplication[id];
          state.submissionErrorsByApplication[id] = message;
        }
      });
    addRequestLifecycle(builder, fetchPaymentById, 'fetchById', (state, action) => storePayment(state, action.payload));
    addRequestLifecycle(builder, verifyPayment, 'verify', (state, action) => storePayment(state, action.payload));
    addRequestLifecycle(builder, deletePayment, 'delete', (state, action) => {
      const id = String(action.meta.arg.id);
      state.items = state.items.filter((payment) => String(payment.payment_id) !== id);
      delete state.byId[id];
      if (String(state.current?.payment_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, paymentsInitialState);
  },
});

export const selectPaymentsState = (state) => state.payments;
export const selectPayments = (state) => selectPaymentsState(state).items;
export const selectPaymentById = (state, id) => selectPaymentsState(state).byId[String(id)] || null;
export const selectCurrentPayment = (state) => selectPaymentsState(state).current;
export const selectPaymentsRequest = (state, operation) => selectPaymentsState(state).requests[operation];
export const selectPaymentsError = (state, operation) => selectPaymentsState(state).errors[operation];
export const { clearApplicantPaymentAttempt } = paymentsSlice.actions;

export default paymentsSlice.reducer;
