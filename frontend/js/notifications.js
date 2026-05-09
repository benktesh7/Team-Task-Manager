// ─── NOTIFICATIONS ───────────────────────────────────────────
async function loadNotifications() {
  try {
    const { data, unreadCount } = await API.getNotifications();
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
    list.innerHTML = data.length ? data.map(n => `
      <div class="notif-item ${n.isRead ? '' : 'unread'}">
        ${!n.isRead ? '<div class="notif-dot"></div>' : '<div style="width:8px"></div>'}
        <div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${relativeTime(n.createdAt)}</div>
        </div>
      </div>`).join('') : '<div class="empty-text">No notifications</div>';
  } catch (_) {}
}

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) loadNotifications();
}

async function markAllRead() {
  try {
    await API.markAllRead();
    document.getElementById('notif-badge').classList.add('hidden');
    loadNotifications();
  } catch (_) {}
}

// Close panel when clicking outside
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && !e.target.closest('.notif-btn')) {
    panel.classList.add('hidden');
  }
});
