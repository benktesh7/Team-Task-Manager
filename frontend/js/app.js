// ─── APP BOOTSTRAP ───────────────────────────────────────────
const PAGE_TITLES = { dashboard: 'Dashboard', projects: 'Projects', tasks: 'My Tasks', team: 'Team' };
window._currentPage = 'dashboard';

async function initApp(user) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  document.getElementById('topnav-name').textContent = user.name;
  document.getElementById('topnav-role').textContent = user.role;
  document.getElementById('topnav-avatar').textContent = avatarLetter(user.name);

  if (user.role === 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }

  // User menu dropdown
  document.getElementById('user-pill').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('user-dropdown').classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    document.getElementById('user-dropdown')?.classList.add('hidden');
  });

  navigate('dashboard');
  loadNotifications();
  setInterval(loadNotifications, 60000);
}

function navigate(page) {
  window._currentPage = page;
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  document.querySelectorAll('.tnav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Clear page header actions
  const phbActions = document.getElementById('phb-actions');
  if (phbActions) phbActions.innerHTML = '';

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'projects':  renderProjects();  break;
    case 'tasks':     renderTasks();     break;
    case 'team':      renderTeam();      break;
  }
}

function toggleSidebar() {} // no-op (top nav layout)

function setPageAction(html) {
  const el = document.getElementById('phb-actions');
  if (el) el.innerHTML = html;
}

function handleLogout() {
  clearToken();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showTab('login');
}

// Boot: restore session
(async () => {
  const token = getToken();
  if (!token) return;
  try {
    const { data: user } = await API.me();
    localStorage.setItem('tm_user', JSON.stringify(user));
    initApp(user);
  } catch (_) { clearToken(); }
})();
