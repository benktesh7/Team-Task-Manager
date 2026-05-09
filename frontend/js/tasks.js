// ─── TASKS ───────────────────────────────────────────────────
async function renderTasks() {
  setPageAction('');
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> Loading tasks…</div>`;
  try {
    const { data: tasks } = await API.getTasks();
    content.innerHTML = `
      <div class="section-header" style="margin-bottom:16px">
        <h2 class="section-title">My Tasks (${tasks.length})</h2>
      </div>
      <div class="filters-bar">
        <input class="search-input" id="task-search" placeholder="🔍 Search tasks…" oninput="filterTasks()" />
        <select class="filter-select" id="task-status-filter" onchange="filterTasks()">
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
        <select class="filter-select" id="task-priority-filter" onchange="filterTasks()">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <div class="task-list" id="task-list-container">
        ${tasks.length ? tasks.map(t => fullTaskCardHtml(t)).join('') : '<div class="empty-text">No tasks yet</div>'}
      </div>`;
    window._allTasks = tasks;
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

function fullTaskCardHtml(t) {
  return `
    <div class="task-card ${t.status==='DONE'?'done':''}" onclick="openTaskDetail('${t.id}')">
      <div class="task-check">${t.status==='DONE'?'✓':''}</div>
      <div class="task-info">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          ${statusBadge(t.status)} ${priorityBadge(t.priority)}
          <span style="font-size:12px;color:var(--text2)">📁 ${t.project?.name||'Unknown'}</span>
          ${t.dueDate ? `<span class="due-date ${isOverdue(t.dueDate)&&t.status!=='DONE'?'overdue':''}">📅 ${formatDate(t.dueDate)}</span>` : ''}
        </div>
      </div>
      ${t.assignee ? `<div class="member-bubble" title="${t.assignee.name}">${avatarLetter(t.assignee.name)}</div>` : ''}
    </div>`;
}

function filterTasks() {
  const search = document.getElementById('task-search')?.value.toLowerCase() || '';
  const status = document.getElementById('task-status-filter')?.value || '';
  const priority = document.getElementById('task-priority-filter')?.value || '';
  const filtered = (window._allTasks || []).filter(t =>
    (!search || t.title.toLowerCase().includes(search)) &&
    (!status || t.status === status) &&
    (!priority || t.priority === priority)
  );
  const c = document.getElementById('task-list-container');
  if (c) c.innerHTML = filtered.length ? filtered.map(t => fullTaskCardHtml(t)).join('') : '<div class="empty-text">No matching tasks</div>';
}

async function openTaskDetail(id) {
  try {
    const { data: t } = await API.getTask(id);
    const me = currentUser();
    const canEdit = t.creatorId === me.id || t.assigneeId === me.id || isAdmin();
    const tags = parseTags(t.tags);

    openModal(t.title, `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        ${statusBadge(t.status)} ${priorityBadge(t.priority)}
        ${t.dueDate ? `<span class="due-date ${isOverdue(t.dueDate)&&t.status!=='DONE'?'overdue':''}">📅 ${formatDate(t.dueDate)}</span>` : ''}
      </div>
      <div style="font-size:14px;color:var(--text2);margin-bottom:16px;line-height:1.6">${t.description || '<em>No description</em>'}</div>
      <div style="display:flex;gap:16px;font-size:13px;color:var(--text2);margin-bottom:16px;flex-wrap:wrap">
        <span>📁 ${t.project?.name}</span>
        ${t.assignee ? `<span>👤 ${t.assignee.name}</span>` : ''}
        <span>🧑‍💻 Created by ${t.creator?.name}</span>
      </div>
      ${tags.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${tags.map(tag=>`<span class="badge badge-inprogress">#${tag}</span>`).join('')}</div>` : ''}
      ${canEdit ? `
        <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
          <select id="td-status" class="filter-select" onchange="quickUpdateTask('${t.id}','status',this.value)">
            <option ${t.status==='TODO'?'selected':''} value="TODO">To Do</option>
            <option ${t.status==='IN_PROGRESS'?'selected':''} value="IN_PROGRESS">In Progress</option>
            <option ${t.status==='IN_REVIEW'?'selected':''} value="IN_REVIEW">In Review</option>
            <option ${t.status==='DONE'?'selected':''} value="DONE">Done</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="openEditTask(${JSON.stringify(t).replace(/"/g,'&quot;')})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTaskAndClose('${t.id}')">🗑️ Delete</button>
        </div>` : ''}
      <div class="divider"></div>
      <div style="font-size:14px;font-weight:600;margin-bottom:12px">Comments (${t.comments?.length||0})</div>
      <div class="comment-list" id="comment-list">
        ${(t.comments||[]).map(c => commentHtml(c, me.id)).join('') || '<div class="empty-text">No comments yet</div>'}
      </div>
      <form onsubmit="submitComment(event,'${t.id}')" style="display:flex;gap:8px">
        <input id="comment-input" placeholder="Add a comment…" style="flex:1;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font);outline:none" />
        <button type="submit" class="btn btn-primary btn-sm">Send</button>
      </form>`);
  } catch (e) { showToast(e.message, 'error'); }
}

function commentHtml(c, myId) {
  return `
    <div class="comment">
      <div class="comment-avatar">${avatarLetter(c.author?.name)}</div>
      <div class="comment-bubble">
        <div class="comment-author">${c.author?.name} <span class="comment-time">${relativeTime(c.createdAt)}</span></div>
        <div class="comment-text">${c.content}</div>
        ${c.authorId === myId ? `<button class="btn-link" style="font-size:11px;color:var(--danger);margin-top:4px" onclick="deleteComment('${c.taskId}','${c.id}')">Delete</button>` : ''}
      </div>
    </div>`;
}

async function submitComment(e, taskId) {
  e.preventDefault();
  const input = document.getElementById('comment-input');
  if (!input.value.trim()) return;
  try {
    const { data: c } = await API.addComment(taskId, { content: input.value.trim() });
    input.value = '';
    const list = document.getElementById('comment-list');
    if (list) {
      if (list.querySelector('.empty-text')) list.innerHTML = '';
      list.insertAdjacentHTML('beforeend', commentHtml(c, currentUser().id));
      list.scrollTop = list.scrollHeight;
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteComment(taskId, commentId) {
  try { await API.deleteComment(taskId, commentId); showToast('Comment deleted', 'success'); openTaskDetail(taskId); }
  catch (err) { showToast(err.message, 'error'); }
}

async function quickUpdateTask(id, field, value) {
  try {
    await API.updateTask(id, { [field]: value });
    showToast('Task updated!', 'success');
    if (window._currentPage === 'dashboard') renderDashboard();
    else if (window._currentPage === 'tasks') renderTasks();
    else if (window._currentPage === 'projects' && _currentProjectId) renderProjectDetail(_currentProjectId);
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteTaskAndClose(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await API.deleteTask(id);
    closeModal(); showToast('Task deleted', 'success');
    if (window._currentPage === 'tasks') renderTasks();
    else if (_currentProjectId) renderProjectDetail(_currentProjectId);
  } catch (err) { showToast(err.message, 'error'); }
}

function openCreateTask(projectId, members) {
  openModal('New Task', `
    <form onsubmit="submitCreateTask(event,'${projectId}')">
      <div class="form-group"><label>Title *</label><input id="ct-title" required placeholder="Task title" /></div>
      <div class="form-group"><label>Description</label><textarea id="ct-desc" placeholder="Details…"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Priority</label>
          <select id="ct-priority">
            <option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option>
            <option value="HIGH">High</option><option value="URGENT">Urgent</option>
          </select>
        </div>
        <div class="form-group"><label>Due Date</label><input id="ct-due" type="date" /></div>
      </div>
      <div class="form-group"><label>Assignee</label>
        <select id="ct-assignee">
          <option value="">Unassigned</option>
          ${(members||[]).map(m=>`<option value="${m.user?.id}">${m.user?.name}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Task</button>
      </div>
    </form>`);
}

async function submitCreateTask(e, projectId) {
  e.preventDefault();
  try {
    await API.createTask({
      title: document.getElementById('ct-title').value,
      description: document.getElementById('ct-desc').value,
      projectId,
      priority: document.getElementById('ct-priority').value,
      dueDate: document.getElementById('ct-due').value || null,
      assigneeId: document.getElementById('ct-assignee').value || null,
    });
    closeModal(); showToast('Task created!', 'success');
    if (_currentProjectId) renderProjectDetail(_currentProjectId);
    else renderTasks();
  } catch (err) { showToast(err.message, 'error'); }
}

function openEditTask(t) {
  closeModal();
  setTimeout(() => openModal('Edit Task', `
    <form onsubmit="submitEditTask(event,'${t.id}')">
      <div class="form-group"><label>Title</label><input id="et-title" value="${t.title}" required /></div>
      <div class="form-group"><label>Description</label><textarea id="et-desc">${t.description||''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Status</label>
          <select id="et-status">
            <option ${t.status==='TODO'?'selected':''} value="TODO">To Do</option>
            <option ${t.status==='IN_PROGRESS'?'selected':''} value="IN_PROGRESS">In Progress</option>
            <option ${t.status==='IN_REVIEW'?'selected':''} value="IN_REVIEW">In Review</option>
            <option ${t.status==='DONE'?'selected':''} value="DONE">Done</option>
          </select>
        </div>
        <div class="form-group"><label>Priority</label>
          <select id="et-priority">
            <option ${t.priority==='LOW'?'selected':''} value="LOW">Low</option>
            <option ${t.priority==='MEDIUM'?'selected':''} value="MEDIUM">Medium</option>
            <option ${t.priority==='HIGH'?'selected':''} value="HIGH">High</option>
            <option ${t.priority==='URGENT'?'selected':''} value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Due Date</label><input id="et-due" type="date" value="${t.dueDate?t.dueDate.split('T')[0]:''}" /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>`), 150);
}

async function submitEditTask(e, id) {
  e.preventDefault();
  try {
    await API.updateTask(id, {
      title: document.getElementById('et-title').value,
      description: document.getElementById('et-desc').value,
      status: document.getElementById('et-status').value,
      priority: document.getElementById('et-priority').value,
      dueDate: document.getElementById('et-due').value || null,
    });
    closeModal(); showToast('Task updated!', 'success');
    if (_currentProjectId) renderProjectDetail(_currentProjectId);
    else renderTasks();
  } catch (err) { showToast(err.message, 'error'); }
}
