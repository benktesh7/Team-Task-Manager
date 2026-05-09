// ─── PROJECTS ────────────────────────────────────────────────
let _currentProjectId = null;

async function renderProjects() {
  setPageAction(`<button class="btn btn-primary btn-sm" onclick="openCreateProject()">＋ New Project</button>`);
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> Loading projects…</div>`;
  try {
    const { data: projects } = await API.getProjects();
    content.innerHTML = projects.length ? `
        <div class="project-grid">
          ${projects.map(p => projectCardHtml(p)).join('')}
        </div>` : `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <br/><button class="btn btn-primary" onclick="openCreateProject()">＋ Create Project</button>
        </div>`;
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

function projectCardHtml(p) {
  const done = p.taskStats?.DONE || 0;
  const total = p._count?.tasks || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const members = p.members?.slice(0, 4) || [];
  return `
    <div class="project-card" onclick="renderProjectDetail('${p.id}')">
      <div class="project-cover" style="background:${p.color}"></div>
      <div class="project-body">
        <div class="project-name">${p.name}</div>
        <div class="project-desc">${p.description || 'No description'}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="font-size:12px;color:var(--text2);margin:4px 0 14px">${pct}% · ${done}/${total} tasks done</div>
        <div class="project-footer">
          <div class="member-stack">
            ${members.map(m => `<div class="member-bubble" title="${m.user?.name}">${avatarLetter(m.user?.name)}</div>`).join('')}
            ${p.members?.length > 4 ? `<div class="member-bubble">+${p.members.length - 4}</div>` : ''}
          </div>
          ${p.dueDate ? `<span class="due-date ${isOverdue(p.dueDate)?'overdue':''}">📅 ${formatDate(p.dueDate)}</span>` : ''}
        </div>
      </div>
    </div>`;
}

async function renderProjectDetail(id) {
  _currentProjectId = id;
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> Loading project…</div>`;
  try {
    const { data: p } = await API.getProject(id);
    const cols = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const colLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
    const tasksByStatus = {};
    cols.forEach(c => { tasksByStatus[c] = p.tasks.filter(t => t.status === c); });

    const isOwnerOrAdmin = p.ownerId === currentUser().id || isAdmin();

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="renderProjects()">← Back</button>
        <div style="width:12px;height:12px;border-radius:50%;background:${p.color}"></div>
        <h2 style="font-size:20px;font-weight:800">${p.name}</h2>
        <div style="flex:1"></div>
        ${isOwnerOrAdmin ? `
          <button class="btn btn-secondary btn-sm" onclick="openAddMember('${p.id}')">＋ Add Member</button>
          <button class="btn btn-secondary btn-sm" onclick="openEditProject(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')">🗑️ Delete</button>` : ''}
        <button class="btn btn-primary btn-sm" onclick="openCreateTask('${p.id}',${JSON.stringify(p.members).replace(/"/g,'&quot;')})">＋ Task</button>
      </div>
      <div class="kanban-board">
        ${cols.map(col => `
          <div class="kanban-col">
            <div class="kanban-col-header">
              <span class="kanban-col-title">${colLabels[col]}</span>
              <span class="kanban-count">${tasksByStatus[col].length}</span>
            </div>
            ${tasksByStatus[col].map(t => `
              <div class="kanban-task" onclick="openTaskDetail('${t.id}')">
                <div class="kanban-task-title">${t.title}</div>
                ${priorityBadge(t.priority)}
                <div class="kanban-task-footer">
                  ${t.assignee ? `<div class="member-bubble" title="${t.assignee.name}">${avatarLetter(t.assignee.name)}</div>` : '<span></span>'}
                  ${t.dueDate ? `<span class="due-date ${isOverdue(t.dueDate)&&t.status!=='DONE'?'overdue':''}" style="font-size:11px">${formatDate(t.dueDate)}</span>` : ''}
                </div>
              </div>`).join('') || '<div style="font-size:12px;color:var(--text3);padding:8px">No tasks</div>'}
          </div>`).join('')}
      </div>
      <div class="divider"></div>
      <div class="section-header"><h2 class="section-title">Members (${p.members.length})</h2></div>
      <div class="team-grid">
        ${p.members.map(m => `
          <div class="team-card">
            <div class="team-avatar">${avatarLetter(m.user?.name)}</div>
            <div class="team-info">
              <div class="team-name">${m.user?.name}</div>
              <div class="team-email">${m.user?.email}</div>
              <span class="badge ${m.role==='ADMIN'?'badge-admin':'badge-member'}" style="margin-top:4px">${m.role}</span>
            </div>
            ${isOwnerOrAdmin && m.user?.id !== p.ownerId ? `
              <button class="btn-icon btn-sm" title="Remove" onclick="removeMember('${p.id}','${m.user?.id}')">✕</button>` : ''}
          </div>`).join('')}
      </div>`;
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

function openCreateProject() {
  openModal('New Project', `
    <form onsubmit="submitCreateProject(event)">
      <div class="form-group"><label>Name *</label><input id="p-name" required placeholder="Project name" /></div>
      <div class="form-group"><label>Description</label><textarea id="p-desc" placeholder="What is this project about?"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Color</label><input id="p-color" type="color" value="#6366f1" style="height:40px;padding:4px" /></div>
        <div class="form-group"><label>Due Date</label><input id="p-due" type="date" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Project</button>
      </div>
    </form>`);
}

async function submitCreateProject(e) {
  e.preventDefault();
  try {
    await API.createProject({
      name: document.getElementById('p-name').value,
      description: document.getElementById('p-desc').value,
      color: document.getElementById('p-color').value,
      dueDate: document.getElementById('p-due').value || null,
    });
    closeModal(); showToast('Project created!', 'success'); renderProjects();
  } catch (err) { showToast(err.message, 'error'); }
}

function openEditProject(p) {
  openModal('Edit Project', `
    <form onsubmit="submitEditProject(event,'${p.id}')">
      <div class="form-group"><label>Name</label><input id="ep-name" value="${p.name}" required /></div>
      <div class="form-group"><label>Description</label><textarea id="ep-desc">${p.description||''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Color</label><input id="ep-color" type="color" value="${p.color}" style="height:40px;padding:4px" /></div>
        <div class="form-group"><label>Due Date</label><input id="ep-due" type="date" value="${p.dueDate?p.dueDate.split('T')[0]:''}" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>`);
}

async function submitEditProject(e, id) {
  e.preventDefault();
  try {
    await API.updateProject(id, {
      name: document.getElementById('ep-name').value,
      description: document.getElementById('ep-desc').value,
      color: document.getElementById('ep-color').value,
      dueDate: document.getElementById('ep-due').value || null,
    });
    closeModal(); showToast('Project updated!', 'success'); renderProjectDetail(id);
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteProject(id) {
  if (!confirm('Delete this project and all its tasks?')) return;
  try { await API.deleteProject(id); showToast('Project deleted', 'success'); renderProjects(); }
  catch (err) { showToast(err.message, 'error'); }
}

function openAddMember(projectId) {
  openModal('Add Member', `
    <form onsubmit="submitAddMember(event,'${projectId}')">
      <div class="form-group"><label>Member Email</label><input id="m-email" type="email" required placeholder="colleague@example.com" /></div>
      <div class="form-group"><label>Role</label>
        <select id="m-role"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Member</button>
      </div>
    </form>`);
}

async function submitAddMember(e, projectId) {
  e.preventDefault();
  try {
    await API.addMember(projectId, { email: document.getElementById('m-email').value, role: document.getElementById('m-role').value });
    closeModal(); showToast('Member added!', 'success'); renderProjectDetail(projectId);
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeMember(projectId, userId) {
  if (!confirm('Remove this member from the project?')) return;
  try { await API.removeMember(projectId, userId); showToast('Member removed', 'success'); renderProjectDetail(projectId); }
  catch (err) { showToast(err.message, 'error'); }
}
