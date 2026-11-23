import { normalizeAuthRole } from './authStorage.js';

export const selectCurrentUser = (state) => state?.auth?.user ?? null;
export const selectAccessToken = (state) => state?.auth?.accessToken ?? null;
export const selectCurrentRole = (state) => selectCurrentUser(state)?.role ?? null;
export const selectMunicipalityId = (state) => selectCurrentUser(state)?.municipalityId ?? null;
export const selectOfficerId = (state) => {
  const user = selectCurrentUser(state);
  return user?.role === 'field_officer' ? user.userId ?? null : null;
};
export const selectIsAuthenticated = (state) =>
  state?.auth?.status === 'authenticated' &&
  Boolean(selectCurrentUser(state)) &&
  Boolean(selectAccessToken(state));
export const selectHasRole = (state, role) => {
  const expectedRole = normalizeAuthRole(role);
  return Boolean(expectedRole && selectCurrentRole(state) === expectedRole);
};

export const selectIsApplicant = (state) => selectHasRole(state, 'applicant');
export const selectIsFieldOfficer = (state) => selectHasRole(state, 'field_officer');
export const selectIsDepartmentOfficer = (state) => selectHasRole(state, 'department_officer');
export const selectIsCommissioner = (state) => selectHasRole(state, 'municipal_commissioner');
export const selectIsPlatformAdmin = (state) => selectHasRole(state, 'platform_admin');
