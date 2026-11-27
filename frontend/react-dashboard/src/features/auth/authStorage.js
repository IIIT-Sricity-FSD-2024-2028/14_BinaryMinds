const SESSION_TOKEN_KEY = 'accessToken';
const SESSION_USER_KEY = 'loggedInUser';

const ROLE_ALIASES = {
  applicant: 'applicant',
  field_officer: 'field_officer',
  fieldofficer: 'field_officer',
  officer: 'field_officer',
  department_officer: 'department_officer',
  departmentofficer: 'department_officer',
  municipal_commissioner: 'municipal_commissioner',
  municipalcommissioner: 'municipal_commissioner',
  super_user: 'municipal_commissioner',
  superuser: 'municipal_commissioner',
  platform_admin: 'platform_admin',
  platformadmin: 'platform_admin',
};

function firstAvailable(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function hasIdentifier(value) {
  return (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && Number.isFinite(value));
}

export function normalizeAuthRole(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ROLE_ALIASES[normalized] ?? null;
}

export function normalizeAuthUser(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const role = normalizeAuthRole(value.role);
  const userId = firstAvailable(value.userId, value.user_id, value.id);
  const email = firstAvailable(value.email);
  if (!role || (!hasIdentifier(userId) && !hasIdentifier(email))) return null;

  const user = { role };
  const fields = {
    userId,
    name: firstAvailable(value.name, value.full_name, value.fullName),
    email,
    phone: firstAvailable(value.phone),
    employeeId: firstAvailable(value.employeeId, value.employee_id, value.empId),
    municipalityId: firstAvailable(value.municipalityId, value.municipality_id),
  };

  Object.entries(fields).forEach(([key, fieldValue]) => {
    if (fieldValue !== undefined && fieldValue !== null) user[key] = fieldValue;
  });

  return user;
}

function readStorageItem(key) {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readAuthStorage() {
  const accessToken = readStorageItem(SESSION_TOKEN_KEY);
  const storedUser = readStorageItem(SESSION_USER_KEY);

  if (typeof accessToken !== 'string' || !accessToken.trim() || !storedUser) {
    return { user: null, accessToken: null };
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(storedUser);
  } catch {
    return { user: null, accessToken: null };
  }

  const user = normalizeAuthUser(parsedUser);
  if (!user) return { user: null, accessToken: null };

  return { user, accessToken };
}

export function writeAuthSession(value, accessToken) {
  const user = normalizeAuthUser(value);
  if (!user || typeof accessToken !== 'string' || !accessToken.trim()) return { status: 'unavailable' };
  try {
    if (typeof sessionStorage === 'undefined') return { status: 'unavailable' };
    sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify({
      id: user.userId, user_id: user.userId, name: user.name, full_name: user.name,
      email: user.email, phone: user.phone ?? '', role: user.role,
    }));
    return { status: 'persisted' };
  } catch {
    clearAuthStorage();
    return { status: 'unavailable' };
  }
}

export function writeAuthUserSnapshot(value) {
  const user = normalizeAuthUser(value);
  if (!user) return { status: 'unavailable' };

  if (typeof sessionStorage === 'undefined') return { status: 'unavailable' };

  const invalidateStaleSnapshot = () => {
    try {
      sessionStorage.removeItem(SESSION_USER_KEY);
      return { status: 'invalidated' };
    } catch {
      return { status: 'unavailable' };
    }
  };

  let existing = {};
  try {
    const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    if (parsedUser && typeof parsedUser === 'object' && !Array.isArray(parsedUser)) {
      existing = parsedUser;
    }
  } catch {
    return invalidateStaleSnapshot();
  }

  const snapshot = {
    ...existing,
    id: user.userId,
    user_id: user.userId,
    name: user.name ?? existing.name ?? existing.full_name,
    full_name: user.name ?? existing.full_name ?? existing.name,
    email: user.email ?? existing.email,
    phone: user.phone ?? existing.phone ?? '',
    role: existing.role ?? user.role,
  };

  try {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(snapshot));
    return { status: 'persisted' };
  } catch {
    return invalidateStaleSnapshot();
  }
}

export function clearAuthStorage() {
  try {
    if (typeof sessionStorage === 'undefined') return;

    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}
