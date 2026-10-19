const API = '/api/tasks';
const AI_API = '/api/ai/plan-task';
const $ = (id) => document.getElementById(id);
let tasks = [];
let currentFilter = 'all';

// ---------- GREETING ----------
(function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';
  $('greeting-text').textContent = g;
})();

// ---------- TOAST ----------
function toast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 3000);
}

// ---------- NAV ----------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const sec = btn.dataset.section;
    if (sec === 'tasks') $('tasks-section').scrollIntoView({ behavior: 'smooth' });
    else if (sec === 'ai') $('ai-section').scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

$('btn-add-task').addEventListener('click', () => {
  $('form-card').scrollIntoView({ behavior: 'smooth' });
  $('title').focus();
});

// ---------- STATUS TOGGLE ----------
document.querySelectorAll('.status-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.status-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    $('status').value = btn.dataset.val;
  });
});

// ---------- FILTERS ----------
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});
$('search').addEventListener('input', renderTasks);

// ---------- HELPERS ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(d) {
  return d && new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();
}

function updateStats() {
  $('stat-total').textContent = tasks.length;
  $('stat-pending').textContent = tasks.filter((t) => t.status === 'pending').length;
  $('stat-progress').textContent = tasks.filter((t) => t.status === 'in-progress').length;
  $('stat-done').textContent = tasks.filter((t) => t.status === 'completed').length;
  const pct = tasks.length ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0;
  $('progress-pct').textContent = pct + '%';
  $('progress-fill').style.width = pct + '%';
}

// ---------- LOAD TASKS ----------
async function loadTasks() {
  $('loader').hidden = false;
  $('empty').hidden = true;
  try {
    const res = await fetch(API);
    const json = await res.json();
    tasks = json.data || [];
    renderTasks();
    updateStats();
  } catch {
    toast('Failed to load tasks', 'error');
  } finally {
    $('loader').hidden = true;
  }
}

// ---------- RENDER ----------
function renderTasks() {
  const q = $('search').value.toLowerCase();
  let filtered = tasks;
  if (currentFilter !== 'all') filtered = filtered.filter((t) => t.status === currentFilter);
  if (q) filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));

  $('empty').hidden = filtered.length > 0;
  $('task-list').innerHTML = filtered
    .map(
      (t) => `
    <div class="task-item ${t.status}" data-id="${t._id}">
      <button class="task-check" onclick="toggleComplete('${t._id}')" title="Toggle complete">✓</button>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ''}
        ${t.dueDate ? `<div class="task-due ${isOverdue(t.dueDate) && t.status !== 'completed' ? 'overdue' : ''}">📅 ${fmtDate(t.dueDate)}${isOverdue(t.dueDate) && t.status !== 'completed' ? ' — Overdue!' : ''}</div>` : ''}
      </div>
      <span class="badge ${t.status}">${t.status.replace('-', ' ')}</span>
      <div class="task-actions">
        <button class="icon-btn" title="Edit" onclick="editTask('${t._id}')">✎</button>
        <button class="icon-btn danger" title="Delete" onclick="deleteTask('${t._id}')">🗑</button>
      </div>
    </div>`
    )
    .join('');
}

// ---------- CRUD ----------
window.toggleComplete = async function (id) {
  const t = tasks.find((x) => x._id === id);
  if (!t) return;
  const newStatus = t.status === 'completed' ? 'pending' : 'completed';
  try {
    await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    toast(newStatus === 'completed' ? 'Task completed! 🎉' : 'Task reopened');
    loadTasks();
  } catch {
    toast('Failed to update task', 'error');
  }
};

window.deleteTask = async function (id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    toast('Task deleted');
    loadTasks();
  } catch (e) {
    toast(e.message, 'error');
  }
};

window.editTask = function (id) {
  const t = tasks.find((x) => x._id === id);
  if (!t) return;
  $('task-id').value = t._id;
  $('title').value = t.title;
  $('description').value = t.description || '';
  $('dueDate').value = t.dueDate ? t.dueDate.slice(0, 10) : '';
  $('status').value = t.status;
  document.querySelectorAll('.status-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.val === t.status);
  });
  $('form-title').textContent = '✏️ Edit Task';
  $('submit-btn').querySelector('.btn-text').textContent = '💾 Update Task';
  $('cancel-btn').hidden = false;
  $('form-card').scrollIntoView({ behavior: 'smooth' });
  $('title').focus();
};

function resetForm() {
  $('task-form').reset();
  $('task-id').value = '';
  $('status').value = 'pending';
  document.querySelectorAll('.status-btn').forEach((b) => b.classList.toggle('active', b.dataset.val === 'pending'));
  $('form-title').textContent = '✨ Create New Task';
  $('submit-btn').querySelector('.btn-text').textContent = '🚀 Add Task';
  $('cancel-btn').hidden = true;
}

$('cancel-btn').addEventListener('click', resetForm);

$('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('task-id').value;
  const body = {
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    status: $('status').value,
    dueDate: $('dueDate').value || null,
  };
  try {
    const res = await fetch(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    toast(id ? 'Task updated!' : 'Task created!');
    resetForm();
    loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ---------- AI PLANNER ----------
$('ai-btn').addEventListener('click', async () => {
  const description = $('ai-description').value.trim();
  const resultBox = $('ai-result');

  if (!description) {
    toast('Please enter a task description', 'error');
    return;
  }

  const btn = $('ai-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:#fff"></span> Thinking...';
  resultBox.hidden = true;

  try {
    const res = await fetch(AI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'AI request failed');

    const p = json.plan;
    resultBox.innerHTML = `
      <div class="ai-summary">${esc(p.summary)}</div>
      <div class="ai-meta">
        <span class="ai-pill ${p.priority}">${p.priority} priority</span>
        <span class="ai-pill hours">⏱ ~${p.estimatedHours} hrs</span>
      </div>
      <ol class="ai-steps">
        ${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}
      </ol>
      <button class="btn-use-plan" onclick='useAsTask(${JSON.stringify(JSON.stringify(p))})'>
        ➕ Save as Task
      </button>`;
    resultBox.hidden = false;
    toast('AI plan generated! ✨');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="ai-sparkle">✦</span> Generate AI Plan';
  }
});

window.useAsTask = function (planStr) {
  const p = typeof planStr === 'string' ? JSON.parse(planStr) : planStr;
  $('title').value = p.summary;
  $('description').value = p.steps.join(' → ');
  $('form-title').textContent = '✨ Create from AI Plan';
  $('form-card').scrollIntoView({ behavior: 'smooth' });
  $('title').focus();
  toast('Plan loaded into form!');
};

// ---------- INIT ----------
loadTasks();
