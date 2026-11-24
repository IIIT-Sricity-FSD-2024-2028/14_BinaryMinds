import { createSlice } from '@reduxjs/toolkit';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  isDepartmentDecisionConfirmed,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from './requestUtils.js';

export const fetchDepartmentReviews = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchAll',
  () => ({ path: '/department-reviews' }),
);
export const fetchDepartmentReviewById = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchById',
  (id) => ({ path: `/department-reviews/${encodeURIComponent(id)}` }),
);
export const createDepartmentReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/create',
  (body) => ({ path: '/department-reviews', options: { method: 'POST', body } }),
);
export const updateDepartmentReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/update',
  ({ id, body }) => ({ path: `/department-reviews/${encodeURIComponent(id)}`, options: { method: 'PATCH', body } }),
);
export const recordDepartmentDecision = createDepartmentOfficerThunk(
  'departmentOfficerReviews/recordDecision',
  ({ applicationId, status, comments }) => ({
    path: `/department-reviews/application/${encodeURIComponent(applicationId)}/decision`,
    options: { method: 'POST', body: { status, comments } },
  }),
);
export const signDepartmentOfficerReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/sign',
  ({ id, digital_signature }) => ({
    path: `/department-reviews/${encodeURIComponent(id)}/sign`,
    options: { method: 'POST', body: { digital_signature } },
  }),
);

export const departmentReviewsInitialState = createRequestState({
  items: [],
  current: null,
  lastDecision: null,
  initialized: false,
});

const departmentReviewsSlice = createSlice({
  name: 'departmentOfficerReviews',
  initialState: departmentReviewsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    addRequestLifecycle(builder, fetchDepartmentReviews, 'fetchAll', (state, action) => {
      state.items = unwrapList(action.payload);
      state.initialized = true;
    }, (state) => {
      state.initialized = true;
    });
    addRequestLifecycle(builder, fetchDepartmentReviewById, 'fetchById', (state, action) => {
      state.current = unwrapItem(action.payload);
      replaceOrAppend(state.items, state.current, 'review_id');
    });
    addRequestLifecycle(builder, createDepartmentReview, 'create', (state, action) => {
      replaceOrAppend(state.items, unwrapItem(action.payload), 'review_id');
    });
    addRequestLifecycle(builder, updateDepartmentReview, 'update', (state, action) => {
      const review = unwrapItem(action.payload);
      replaceOrAppend(state.items, review, 'review_id');
      if (String(state.current?.review_id) === String(review?.review_id)) state.current = review;
    });
    addRequestLifecycle(builder, recordDepartmentDecision, 'recordDecision', (state, action) => {
      if (!isDepartmentDecisionConfirmed(action.payload, action.meta.arg.status)) return;
      state.lastDecision = action.payload;
      replaceOrAppend(state.items, action.payload?.review, 'review_id');
      if (String(state.current?.review_id) === String(action.payload?.review?.review_id)) {
        state.current = action.payload.review;
      }
    });
    addRequestLifecycle(builder, signDepartmentOfficerReview, 'sign', (state, action) => {
      const review = unwrapItem(action.payload);
      replaceOrAppend(state.items, review, 'review_id');
      if (String(state.current?.review_id) === String(review?.review_id)) state.current = review;
    });
    resetOnAuthChange(builder, departmentReviewsInitialState);
  },
});

export const selectDepartmentReviewsState = (state) => state.departmentOfficerReviews;
export const selectDepartmentReviews = (state) => selectDepartmentReviewsState(state).items;
export default departmentReviewsSlice.reducer;
