import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  selectAccessToken, selectCurrentUser, selectIsFieldOfficer,
} from '../../features/auth/authSelectors.js';
import {
  fetchApplicationsByFieldOfficer, selectApplicationsByFieldOfficer, selectApplicationsState, selectApplicationById,
} from '../../features/applications/applicationsSlice.js';
import {
  fetchDocumentsByApplication, selectDocumentsByApplication, selectDocumentsState,
} from '../../features/documents/documentsSlice.js';
import {
  fetchAssignmentsByFieldOfficer, selectFieldOfficerAssignmentsState,
} from '../../features/fieldOfficerAssignments/fieldOfficerAssignmentsSlice.js';
import { fetchInspectionsByFieldOfficer, selectInspectionsState } from '../../features/inspections/inspectionsSlice.js';
import {
  fetchDepartmentOfficerProfile, selectDepartmentOfficerProfile, selectDepartmentOfficerUsersState,
} from '../../features/users/usersSlice.js';
import { useFieldOfficerState } from '../hooks/useFieldOfficerState.js';

export function useFieldOfficerData(loadDocuments = false) {
  const { officerId, recordId } = useParams();
  const activeApplicationId = recordId || new URLSearchParams(window.location.search).get('applicationId') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector(selectAccessToken);
  const user = useSelector(selectCurrentUser);
  const isFieldOfficer = useSelector(selectIsFieldOfficer);
  const profileRecord = useSelector(selectDepartmentOfficerProfile);
  const profile = profileRecord || user;
  const applications = useSelector((state) => selectApplicationsByFieldOfficer(state, officerId));
  const applicationsState = useSelector(selectApplicationsState);
  const assignmentsState = useSelector(selectFieldOfficerAssignmentsState);
  const inspectionsState = useSelector(selectInspectionsState);
  const usersState = useSelector(selectDepartmentOfficerUsersState);
  const documentsState = useSelector(selectDocumentsState);
  const assignments = assignmentsState.byFieldOfficerId[String(officerId)] || [];
  const inspections = inspectionsState.items.filter((inspection) =>
    assignments.some((assignment) => String(assignment.assignment_id) === String(inspection.assignment_id)),
  );
  const documents = useSelector((state) => selectDocumentsByApplication(state, activeApplicationId));
  const [error, setError] = useFieldOfficerState('');
  const [message, setMessage] = useFieldOfficerState('');
  const [saving, setSaving] = useFieldOfficerState(false);

  useEffect(() => {
    if (!token || !user || !isFieldOfficer || String(user.userId) !== String(officerId)) {
      navigate('/login', { replace: true });
      return;
    }
    if (!profileRecord && !['pending', 'fulfilled', 'rejected'].includes(usersState.requests.fetchProfile)) dispatch(fetchDepartmentOfficerProfile());
    if (!Object.hasOwn(applicationsState.byFieldOfficerId, String(officerId)) && !['pending', 'fulfilled', 'rejected'].includes(applicationsState.requests.fetchByFieldOfficer)) {
      dispatch(fetchApplicationsByFieldOfficer(officerId));
    }
    if (!Object.hasOwn(assignmentsState.byFieldOfficerId, String(officerId)) && !['pending', 'fulfilled', 'rejected'].includes(assignmentsState.requests.fetchByFieldOfficer)) {
      dispatch(fetchAssignmentsByFieldOfficer(officerId));
    }
    if (!['pending', 'fulfilled', 'rejected'].includes(inspectionsState.requests.fetchByFieldOfficer)) {
      dispatch(fetchInspectionsByFieldOfficer(officerId));
    }
  }, [dispatch, isFieldOfficer, navigate, officerId, token, user, profileRecord, usersState.requests.fetchProfile, applicationsState.byFieldOfficerId, applicationsState.requests.fetchByFieldOfficer, assignmentsState.byFieldOfficerId, assignmentsState.requests.fetchByFieldOfficer, inspectionsState.requests.fetchByFieldOfficer]);

  useEffect(() => {
    if (loadDocuments && activeApplicationId) dispatch(fetchDocumentsByApplication(activeApplicationId));
  }, [dispatch, loadDocuments, activeApplicationId]);

  return {
    officerId,
    recordId,
    activeApplicationId,
    navigate,
    token,
    profile,
    applications,
    applicationById: useSelector((state) => selectApplicationById(state, activeApplicationId)),
    assignments,
    inspections,
    inspectionsState,
    documents,
    loading: applicationsState.requests.fetchByFieldOfficer === 'pending' && !applications.length,
    saving,
    setSaving,
    error: error || usersState.errors.fetchProfile || applicationsState.errors.fetchByFieldOfficer || assignmentsState.errors.fetchByFieldOfficer || inspectionsState.errors.fetchByFieldOfficer || '',
    setError,
    message,
    setMessage,
    documentsState,
    dispatch,
  };
}
