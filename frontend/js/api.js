// ─── API layer ────────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

function getToken() { return localStorage.getItem('tm_token'); }
function setToken(t) { localStorage.setItem('tm_token', t); }
function clearToken() { localStorage.removeItem('tm_token'); localStorage.removeItem('tm_user'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', data };
  return data;
}

const API = {
  // Auth
  signup:  (body) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login:   (body) => apiFetch('/auth/login',  { method: 'POST', body: JSON.stringify(body) }),
  me:      ()     => apiFetch('/auth/me'),
  changePassword: (body) => apiFetch('/auth/change-password', { method: 'PATCH', body: JSON.stringify(body) }),

  // Projects
  getProjects:      (q='') => apiFetch(`/projects${q}`),
  createProject:    (b)    => apiFetch('/projects',    { method: 'POST',   body: JSON.stringify(b) }),
  getProject:       (id)   => apiFetch(`/projects/${id}`),
  updateProject:    (id,b) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteProject:    (id)   => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
  addMember:        (id,b) => apiFetch(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(b) }),
  removeMember:     (id,uid) => apiFetch(`/projects/${id}/members/${uid}`, { method: 'DELETE' }),
  updateMemberRole: (id,uid,b) => apiFetch(`/projects/${id}/members/${uid}`, { method: 'PATCH', body: JSON.stringify(b) }),

  // Tasks
  getTasks:    (q='') => apiFetch(`/tasks${q}`),
  createTask:  (b)    => apiFetch('/tasks',    { method: 'POST',   body: JSON.stringify(b) }),
  getTask:     (id)   => apiFetch(`/tasks/${id}`),
  updateTask:  (id,b) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteTask:  (id)   => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  addComment:  (id,b) => apiFetch(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify(b) }),
  deleteComment:(tid,cid) => apiFetch(`/tasks/${tid}/comments/${cid}`, { method: 'DELETE' }),

  // Dashboard
  dashboard: () => apiFetch('/dashboard'),

  // Users
  getUsers:       ()      => apiFetch('/users'),
  updateMe:       (b)     => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(b) }),
  updateUserRole: (id, b) => apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteUser:     (id)    => apiFetch(`/users/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  markAllRead:      () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
  markRead:         (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
};
