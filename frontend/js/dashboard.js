// ─── DASHBOARD ───────────────────────────────────────────────
async function renderDashboard() {
  setPageAction('');
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> Loading…</div>`;
  try {
    const { data } = await API.dashboard();
    const { stats, myTasks, upcomingDeadlines, recentActivity } = data;

    const bentoCards = [
      { icon:'📁', iconBg:'#ede9fe', val: stats.totalProjects,   lbl:'Total Projects',   chip:null },
      { icon:'✅', iconBg:'#dcfce7', val: stats.completedTasks,  lbl:'Completed Tasks',  chip:null },
      { icon:'🔄', iconBg:'#dbeafe', val: stats.inProgressTasks, lbl:'In Progress',       chip:null },
      { icon:'⚠️', iconBg:'#fee2e2', val: stats.overdueTasks,    lbl:'Overdue Tasks',     chip: stats.overdueTasks > 0 ? 'dn' : null },
    ];

    content.innerHTML = `
      <div class="bento-grid">
        ${bentoCards.map(c => `
          <div class="bento-card">
            <div class="bento-icon" style="background:${c.iconBg}">${c.icon}</div>
            <div class="bento-val">${c.val}</div>
            <div class="bento-lbl">${c.lbl}</div>
            ${c.chip === 'dn' && c.val > 0 ? `<div class="bento-chip chip-dn">↑ Action needed</div>` : ''}
            ${c.chip === 'up' ? `<div class="bento-chip chip-up">↑ Great work!</div>` : ''}
          </div>`).join('')}
      </div>

      <div class="dash-cols">
        <div>
          <div class="card" style="margin-bottom:20px">
            <div class="section-header">
              <span class="section-title">My Tasks</span>
              <button class="btn btn-sm btn-secondary" onclick="navigate('tasks')">View all</button>
            </div>
            <div class="task-list">
              ${myTasks.length ? myTasks.map(t => dashTaskHtml(t)).join('') : '<div class="empty-text">No tasks assigned to you 🎉</div>'}
            </div>
          </div>
          <div class="card">
            <div class="section-header">
              <span class="section-title">Recent Activity</span>
            </div>
            <div class="task-list">
              ${recentActivity.slice(0,6).map(t => `
                <div class="task-card ${t.status==='DONE'?'done':''}" onclick="openTaskDetail('${t.id}')">
                  <div class="task-check">${t.status==='DONE'?'✓':''}</div>
                  <div class="task-info">
                    <div class="task-title">${t.title}</div>
                    <div class="task-meta">${statusBadge(t.status)}<span class="due-date">${relativeTime(t.updatedAt)}</span></div>
                  </div>
                  <span style="font-size:12px;color:var(--text2)">${t.project?.name||''}</span>
                </div>`).join('') || '<div class="empty-text">No activity yet</div>'}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="section-header"><span class="section-title">Upcoming (7 days)</span></div>
            ${upcomingDeadlines.length ? upcomingDeadlines.map(t => `
              <div class="task-card" style="margin-bottom:8px" onclick="openTaskDetail('${t.id}')">
                <div class="task-info">
                  <div class="task-title">${t.title}</div>
                  <div class="task-meta">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.project?.color||'var(--primary)'};flex-shrink:0"></span>
                    <span style="font-size:12px;color:var(--text2)">${t.project?.name}</span>
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  ${priorityBadge(t.priority)}
                  <div class="due-date ${isOverdue(t.dueDate)?'overdue':''}" style="margin-top:4px">📅 ${formatDate(t.dueDate)}</div>
                </div>
              </div>`).join('') : '<div class="empty-text">No deadlines this week 🎉</div>'}
          </div>

          <div class="card" style="margin-top:20px">
            <div class="section-header"><span class="section-title">Task Breakdown</span></div>
            ${[
              { label:'To Do',      val: stats.todoTasks,       color:'#64748b' },
              { label:'In Progress',val: stats.inProgressTasks, color:'#7c3aed' },
              { label:'In Review',  val: stats.inReviewTasks,   color:'#d97706' },
              { label:'Done',       val: stats.completedTasks,  color:'#16a34a' },
            ].map(s => {
              const pct = stats.totalTasks ? Math.round((s.val/stats.totalTasks)*100) : 0;
              return `
                <div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:5px">
                    <span>${s.label}</span><span style="color:var(--text2)">${s.val}</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${s.color}"></div></div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>${e.message}</p></div>`;
  }
}

function dashTaskHtml(t) {
  return `
    <div class="task-card ${t.status==='DONE'?'done':''}" onclick="openTaskDetail('${t.id}')">
      <div class="task-check">${t.status==='DONE'?'✓':''}</div>
      <div class="task-info">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          ${statusBadge(t.status)} ${priorityBadge(t.priority)}
          ${t.dueDate ? `<span class="due-date ${isOverdue(t.dueDate)&&t.status!=='DONE'?'overdue':''}">📅 ${formatDate(t.dueDate)}</span>` : ''}
        </div>
      </div>
    </div>`;
}
