// ─── TEAM (Admin only) ───────────────────────────────────────
async function renderTeam() {
  setPageAction('');
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> Loading team…</div>`;
  try {
    const { data: users } = await API.getUsers();
    content.innerHTML = `
      <div class="section-header" style="margin-bottom:20px">
        <h2 class="section-title">Team Members (${users.length})</h2>
      </div>
      <div class="team-grid">
        ${users.map(u => `
          <div class="team-card">
            <div class="team-avatar">${avatarLetter(u.name)}</div>
            <div class="team-info">
              <div class="team-name">${u.name}</div>
              <div class="team-email">${u.email}</div>
              <span class="badge ${u.role==='ADMIN'?'badge-admin':'badge-member'}" style="margin-top:4px">${u.role}</span>
            </div>
            ${u.id !== currentUser().id ? `
              <div style="display:flex;flex-direction:column;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="toggleUserRole('${u.id}','${u.role}')">
                  ${u.role === 'ADMIN' ? '→ Member' : '→ Admin'}
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteTeamUser('${u.id}')">Delete</button>
              </div>` : '<span style="font-size:12px;color:var(--text3)">You</span>'}
          </div>`).join('')}
      </div>`;
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
  if (!confirm(`Change role to ${newRole}?`)) return;
  try { await API.updateUserRole(userId, { role: newRole }); showToast('Role updated', 'success'); renderTeam(); }
  catch (err) { showToast(err.message, 'error'); }
}

async function deleteTeamUser(userId) {
  if (!confirm('Delete this user permanently?')) return;
  try { await API.deleteUser(userId); showToast('User deleted', 'success'); renderTeam(); }
  catch (err) { showToast(err.message, 'error'); }
}
