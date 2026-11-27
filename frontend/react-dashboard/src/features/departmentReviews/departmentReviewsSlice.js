import { createSelector, createSlice } from '@reduxjs/toolkit';
import { departmentReviewsApi } from './departmentReviewsApi.js';
import {
  addRequestLifecycle,
  createDepartmentOfficerThunk,
  createRequestState,
  isDepartmentDecisionConfirmed,
  resetOnAuthChange,
  replaceOrAppend,
  unwrapItem,
  unwrapList,
} from '../../services/asyncThunkUtils.js';

export const fetchDepartmentReviews = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchAll',
  departmentReviewsApi.fetchAll,
);
export const fetchDepartmentReviewById = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchById',
  departmentReviewsApi.fetchById,
);
export const fetchDepartmentReviewsByApplication = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchByApplication',
  departmentReviewsApi.fetchByApplication,
);
export const fetchDepartmentReviewsByReviewer = createDepartmentOfficerThunk(
  'departmentOfficerReviews/fetchByReviewer',
  departmentReviewsApi.fetchByReviewer,
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
export const deleteDepartmentReview = createDepartmentOfficerThunk(
  'departmentOfficerReviews/delete',
  departmentReviewsApi.delete,
);

export const departmentReviewsInitialState = createRequestState({
  items: [],
  current: null,
  lastDecision: null,
  initialized: false,
  byApplicationId: {},
  byReviewerId: {},
});

function storeQueryIds(state, key, value, rows) {
  state[key][String(value)] = unwrapList(rows)
    .map((review) => review?.review_id)
    .filter((id) => id !== undefined && id !== null)
    .map(String);
}

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
    addRequestLifecycle(builder, fetchDepartmentReviewsByApplication, 'fetchByApplication', (state, action) => {
      const rows = unwrapList(action.payload);
      rows.forEach((review) => replaceOrAppend(state.items, review, 'review_id'));
      storeQueryIds(state, 'byApplicationId', action.meta.arg, rows);
    });
    addRequestLifecycle(builder, fetchDepartmentReviewsByReviewer, 'fetchByReviewer', (state, action) => {
      const rows = unwrapList(action.payload);
      rows.forEach((review) => replaceOrAppend(state.items, review, 'review_id'));
      storeQueryIds(state, 'byReviewerId', action.meta.arg, rows);
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
    addRequestLifecycle(builder, deleteDepartmentReview, 'delete', (state, action) => {
      const id = String(action.meta.arg);
      state.items = state.items.filter((review) => String(review.review_id) !== id);
      Object.keys(state.byApplicationId).forEach((key) => {
        state.byApplicationId[key] = state.byApplicationId[key].filter((reviewId) => reviewId !== id);
      });
      Object.keys(state.byReviewerId).forEach((key) => {
        state.byReviewerId[key] = state.byReviewerId[key].filter((reviewId) => reviewId !== id);
      });
      if (String(state.current?.review_id) === id) state.current = null;
    });
    resetOnAuthChange(builder, departmentReviewsInitialState);
  },
});

export const selectDepartmentReviewsState = (state) => state.departmentReviews;
export const selectDepartmentReviews = (state) => selectDepartmentReviewsState(state).items;
export const selectDepartmentReviewsByApplication = createSelector(
  [
    (state, applicationId) => selectDepartmentReviewsState(state).byApplicationId[String(applicationId)] || [],
    (state) => selectDepartmentReviewsState(state).items,
  ],
  (ids, items) => {
    const byId = new Map(items.map((review) => [String(review.review_id), review]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  },
);
export const selectDepartmentReviewsByReviewer = createSelector(
  [
    (state, reviewerId) => selectDepartmentReviewsState(state).byReviewerId[String(reviewerId)] || [],
    (state) => selectDepartmentReviewsState(state).items,
  ],
  (ids, items) => {
    const byId = new Map(items.map((review) => [String(review.review_id), review]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  },
);
export default departmentReviewsSlice.reducer;
