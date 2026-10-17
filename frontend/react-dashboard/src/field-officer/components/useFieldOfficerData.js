import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API = 'http://localhost:3000/api';
const unwrap = (value) => value?.data ?? value;
const messageOf = (payload, fallback) => Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message || fallback;

export function useFieldOfficerData(loadDocuments = false) {
  const { officerId, recordId } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('accessToken');
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function request(path, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(messageOf(payload, `Request failed (${response.status}).`));
    return unwrap(payload);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) { navigate('/login', { replace: true }); return; }
      try {
        const user = await request('/users/me');
        if (user.role !== 'field_officer' || Number(user.user_id) !== Number(officerId)) throw new Error('This Field Officer page is not available for the current account.');
        const [appResult, assignmentResult, inspectionResult] = await Promise.allSettled([
          request(`/applications/officer/${encodeURIComponent(officerId)}`),
          request(`/field-officer-assignments/field-officer/${encodeURIComponent(officerId)}`),
          request(`/inspections/field-officer/${encodeURIComponent(officerId)}`),
        ]);
        if (!active) return;
        if (appResult.status === 'rejected') throw appResult.reason;
        setApplications(Array.isArray(appResult.value) ? appResult.value : []);
        setAssignments(assignmentResult.status === 'fulfilled' && Array.isArray(assignmentResult.value) ? assignmentResult.value : []);
        setInspections(inspectionResult.status === 'fulfilled' && Array.isArray(inspectionResult.value) ? inspectionResult.value : []);
        setProfile(user);
        if (assignmentResult.status === 'rejected' || inspectionResult.status === 'rejected') setMessage('Some inspection information could not be loaded. Affected sections may be incomplete.');
      } catch (e) { if (active) setError(e.message || 'Unable to load Field Officer data.'); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [officerId, token, navigate]);

  useEffect(() => {
    let active = true;
    const applicationId = recordId || sessionStorage.getItem('selectedApp');
    if (!loadDocuments || !applicationId || !token) return undefined;
    request(`/documents/application/${encodeURIComponent(applicationId)}`).then((rows) => { if (active) setDocuments(Array.isArray(rows) ? rows : []); })
      .catch((e) => { if (active) setError(e.message || 'Unable to load application documents.'); });
    return () => { active = false; };
  }, [loadDocuments, recordId, token]);

  return { officerId, recordId, navigate, token, profile, applications, setApplications, assignments, setAssignments, inspections, setInspections, documents, loading, saving, setSaving, error, setError, message, setMessage, request };
}
