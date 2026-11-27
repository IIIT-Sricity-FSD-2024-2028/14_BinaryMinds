import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectIsDepartmentOfficer,
} from '../../features/auth/authSelectors.js';
import { normalizeAuthRole } from '../../features/auth/authStorage.js';
import {
  fetchApplications,
  selectApplications,
  selectApplicationsState,
} from '../../features/applications/applicationsSlice.js';
import {
  fetchDepartmentReviews,
  selectDepartmentReviews,
  selectDepartmentReviewsState,
} from '../store/departmentReviewsSlice.js';
import {
  fetchFieldOfficerAssignments,
  selectFieldOfficerAssignments,
  selectFieldOfficerAssignmentsState,
} from '../store/fieldOfficerAssignmentsSlice.js';
import {
  fetchInspections,
  selectInspections,
  selectInspectionsState,
} from '../store/inspectionsSlice.js';
import {
  fetchLicenses,
  selectLicenses,
  selectLicensesState,
} from '../store/licensesSlice.js';
import {
  fetchDepartmentOfficerProfile,
  selectDepartmentOfficerProfile,
  selectDepartmentOfficerUsersState,
} from '../store/usersSlice.js';

function errorText(value, fallback) {
  if (typeof value === 'string') return value;
  const message = value?.message;
  return Array.isArray(message) ? message.join(' ') : message || value?.error || fallback;
}

export const selectDepartmentOfficerPortalStatus = createSelector(
  [
    selectIsAuthenticated,
    selectIsDepartmentOfficer,
    selectDepartmentOfficerProfile,
    selectDepartmentOfficerUsersState,
    selectApplicationsState,
    selectInspectionsState,
    selectDepartmentReviewsState,
    selectLicensesState,
    selectFieldOfficerAssignmentsState,
  ],
  (isAuthenticated, isDepartmentOfficer, profile, usersState, applicationsState, inspectionsState, reviewsState, licensesState, assignmentsState) => {
    const profileStatus = usersState.requests.fetchProfile || 'idle';
    const profileValid = isDepartmentOfficer &&
      normalizeAuthRole(profile?.role) === 'department_officer';
    const profileError = usersState.requests.fetchProfile === 'rejected'
      ? errorText(usersState.errors.fetchProfile, 'Unable to verify the Department Officer session.')
      : isAuthenticated && profile && !profileValid
        ? 'This portal is available only to Department Officer accounts.'
        : '';
    const collectionStates = [
      ['applications', applicationsState],
      ['inspections', inspectionsState],
      ['reviews', reviewsState],
      ['licenses', licensesState],
      ['assignments', assignmentsState],
    ];
    const hasLoadedCollections = profileValid &&
      applicationsState.initialized && inspectionsState.initialized && reviewsState.initialized &&
      licensesState.initialized && assignmentsState.initialized;
    const loading = isAuthenticated && !profileError && (
      profileStatus === 'idle' || profileStatus === 'pending' ||
      (profileValid && !hasLoadedCollections)
    );
    const partialErrors = profileError ? [] : collectionStates.flatMap(([label, state]) =>
      state.requests.fetchAll === 'rejected'
        ? [`Could not load ${label}: ${errorText(state.errors.fetchAll, 'request failed')}`]
        : [],
    );
    return { loading, error: profileError, partialErrors };
  },
);

export function useDepartmentOfficerData() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isDepartmentOfficer = useSelector(selectIsDepartmentOfficer);
  const initialRequests = useRef({ token: null, started: new Set() });

  const usersState = useSelector(selectDepartmentOfficerUsersState);
  const applicationsState = useSelector(selectApplicationsState);
  const inspectionsState = useSelector(selectInspectionsState);
  const reviewsState = useSelector(selectDepartmentReviewsState);
  const licensesState = useSelector(selectLicensesState);
  const assignmentsState = useSelector(selectFieldOfficerAssignmentsState);

  const profile = useSelector(selectDepartmentOfficerProfile);
  const applications = useSelector(selectApplications);
  const inspections = useSelector(selectInspections);
  const reviews = useSelector(selectDepartmentReviews);
  const licenses = useSelector(selectLicenses);
  const assignments = useSelector(selectFieldOfficerAssignments);

  const profileStatus = usersState.requests.fetchProfile || 'idle';
  const portalStatus = useSelector(selectDepartmentOfficerPortalStatus);
  const profileValid = isDepartmentOfficer &&
    normalizeAuthRole(profile?.role) === 'department_officer';

  useEffect(() => {
    if (initialRequests.current.token !== token) {
      initialRequests.current = { token, started: new Set() };
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && profileStatus === 'idle' && !initialRequests.current.started.has('profile')) {
      initialRequests.current.started.add('profile');
      dispatch(fetchDepartmentOfficerProfile());
    }
  }, [dispatch, isAuthenticated, profileStatus]);

  const applicationsStatus = applicationsState.requests.fetchAll || 'idle';
  const inspectionsStatus = inspectionsState.requests.fetchAll || 'idle';
  const reviewsStatus = reviewsState.requests.fetchAll || 'idle';
  const licensesStatus = licensesState.requests.fetchAll || 'idle';
  const assignmentsStatus = assignmentsState.requests.fetchAll || 'idle';

  useEffect(() => {
    if (!profileValid) return;
    const initialLoads = [
      ['applications', applicationsStatus, fetchApplications],
      ['inspections', inspectionsStatus, fetchInspections],
      ['reviews', reviewsStatus, fetchDepartmentReviews],
      ['licenses', licensesStatus, fetchLicenses],
      ['assignments', assignmentsStatus, fetchFieldOfficerAssignments],
    ];
    initialLoads.forEach(([name, status, thunk]) => {
      if (status === 'idle' && !initialRequests.current.started.has(name)) {
        initialRequests.current.started.add(name);
        dispatch(thunk());
      }
    });
  }, [
    dispatch,
    profileValid,
    applicationsStatus,
    inspectionsStatus,
    reviewsStatus,
    licensesStatus,
    assignmentsStatus,
  ]);

  const reload = useCallback(() => {
    if (!profileValid) return Promise.resolve([]);
    return Promise.allSettled([
      dispatch(fetchApplications()),
      dispatch(fetchInspections()),
      dispatch(fetchDepartmentReviews()),
      dispatch(fetchLicenses()),
      dispatch(fetchFieldOfficerAssignments()),
    ]);
  }, [dispatch, profileValid]);

  return {
    user: profileValid ? profile : null,
    applications,
    inspections,
    assignments,
    reviews,
    licenses,
    ...portalStatus,
    reload,
  };
}
