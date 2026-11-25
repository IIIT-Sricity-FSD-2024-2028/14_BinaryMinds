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
  verify: ['department_officer', 'municipal_commissioner', 'platform_admin'],
  remove: ['department_officer', 'municipal_commissioner', 'platform_admin'],
};

function request(type, allowed, path, options) {
  return createAsyncThunk(type, (arg, thunkApi) => {
    if (!allowed.includes(thunkApi.getState()?.auth?.user?.role)) {
      return thunkApi.rejectWithValue({ status: 403, message: 'Your role cannot perform this payment operation.' });
    }
    return departmentOfficerRequest(
      typeof path === 'function' ? path(arg) : path,
      typeof options === 'function' ? options(arg) : options || {},
      thunkApi,
    );
  });
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
export const createPayment = request('payments/create', roles.create, '/payments', ({ body }) => ({ method: 'POST', body }));
export const updatePayment = request(
  'payments/update', roles.update,
  ({ id }) => `/payments/${encodeURIComponent(id)}`,
  ({ body }) => ({ method: 'PATCH', body }),
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

export const paymentsInitialState = createRequestState({ items: [], byId: {}, current: null });

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
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchPayments, 'fetchAll', (state, action) => storePaymentList(state, action.payload, true));
    addRequestLifecycle(builder, fetchPaymentsByApplication, 'fetchByApplication', (state, action) => storePaymentList(state, action.payload));
    addRequestLifecycle(builder, fetchPaymentById, 'fetchById', (state, action) => storePayment(state, action.payload));
    addRequestLifecycle(builder, createPayment, 'create', (state, action) => storePayment(state, action.payload));
    addRequestLifecycle(builder, updatePayment, 'update', (state, action) => storePayment(state, action.payload));
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

export default paymentsSlice.reducer;
