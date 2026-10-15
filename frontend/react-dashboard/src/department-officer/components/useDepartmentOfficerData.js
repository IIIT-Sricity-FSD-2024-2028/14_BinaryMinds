import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000/api';
export function unwrap(value) { return value?.data ?? value; }
function errorText(body, fallback) { return Array.isArray(body?.message) ? body.message.join(' ') : body?.message || fallback; }

export function useDepartmentOfficerData() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('accessToken');
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialErrors, setPartialErrors] = useState([]);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorText(body, `Request failed (${response.status}).`));
    return unwrap(body);
  }, [token]);

  const reload = useCallback(async () => {
    const results = await Promise.allSettled([
      request('/applications'), request('/inspections'), request('/department-reviews'), request('/licenses'), request('/field-officer-assignments'),
    ]);
    if (results[0].status === 'fulfilled') setApplications(Array.isArray(results[0].value) ? results[0].value : []);
    if (results[1].status === 'fulfilled') setInspections(Array.isArray(results[1].value) ? results[1].value : []);
    if (results[2].status === 'fulfilled') setReviews(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === 'fulfilled') setLicenses(Array.isArray(results[3].value) ? results[3].value : []);
    if (results[4].status === 'fulfilled') setAssignments(Array.isArray(results[4].value) ? results[4].value : []);
    const labels = ['applications', 'inspections', 'reviews', 'licenses', 'assignments'];
    setPartialErrors(results.flatMap((r, i) => r.status === 'rejected' ? [`Could not load ${labels[i]}: ${r.reason?.message || 'request failed'}`] : []));
  }, [request]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) { navigate('/login', { replace: true }); return; }
      try {
        const current = await request('/users/me');
        if (current?.role !== 'department_officer') throw new Error('This portal is available only to Department Officer accounts.');
        if (!active) return;
        setUser(current);
        const results = await Promise.allSettled([request('/applications'), request('/inspections'), request('/department-reviews'), request('/licenses'), request('/field-officer-assignments')]);
        if (!active) return;
        const setters = [setApplications, setInspections, setReviews, setLicenses, setAssignments];
        const labels = ['applications', 'inspections', 'reviews', 'licenses', 'assignments'];
        results.forEach((result, index) => { if (result.status === 'fulfilled') setters[index](Array.isArray(result.value) ? result.value : []); });
        setPartialErrors(results.flatMap((r, i) => r.status === 'rejected' ? [`Could not load ${labels[i]}: ${r.reason?.message || 'request failed'}`] : []));
      } catch (e) { if (active) setError(e.message || 'Unable to verify the Department Officer session.'); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [token, navigate, request]);

  return { user, token, applications, setApplications, inspections, assignments, reviews, setReviews, licenses, setLicenses, loading, error, partialErrors, request, reload };
}
