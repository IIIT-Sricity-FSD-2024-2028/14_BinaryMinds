import { createSlice } from '@reduxjs/toolkit';
import { departmentReviewsApi } from '../api/departmentReviewsApi.js';
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
  departmentReviewsApi.fetchAll,
);
export const fetchDepartmentReviewById = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchById',
  departmentReviewsApi.fetchById,
);
export const createDepartmentReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/create',
  departmentReviewsApi.create,
);
export const updateDepartmentReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/update',
  departmentReviewsApi.update,
);
export const recordDepartmentDecision = createDepartmentOfficerThunk(
  'departmentOfficerReviews/recordDecision',
  departmentReviewsApi.recordDecision,
);
export const signDepartmentOfficerReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/sign',
  departmentReviewsApi.sign,
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
