// ─── HELPERS ─────────────────────────────────────────────────
function statusBadge(s) {
  const map = { TODO:'badge-todo', IN_PROGRESS:'badge-inprogress', IN_REVIEW:'badge-inreview', DONE:'badge-done' };
  const labels = { TODO:'To Do', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review', DONE:'Done' };
  return `<span class="badge ${map[s]||''}">${labels[s]||s}</span>`;
}
function priorityBadge(p) {
  const map = { LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high', URGENT:'badge-urgent' };
  return `<span class="badge ${map[p]||''}">${p}</span>`;
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function isOverdue(d) { return d && new Date(d) < new Date() ? true : false; }
function relativeTime(d) {
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff/60000), h = Math.floor(m/60), days = Math.floor(h/24);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
}
function avatarLetter(name) { return (name || '?')[0].toUpperCase(); }
function currentUser() { return JSON.parse(localStorage.getItem('tm_user') || '{}'); }
function isAdmin() { return currentUser().role === 'ADMIN'; }
function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(80px)'; t.style.transition='0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ─── MODAL ───────────────────────────────────────────────────
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
