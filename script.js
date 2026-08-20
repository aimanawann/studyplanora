let tasks = JSON.parse(localStorage.getItem('studyplanora_tasks')) || [];
let totalCreatedCount = parseInt(localStorage.getItem('studyplanora_total_created')) || 0;

document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  updateProgress();
  
  if (localStorage.getItem('studyplanora_theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggleBtn').innerText = 'Switch to Light Mode';
  }
});

function openSection(sectionId) {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('subView').classList.remove('hidden');

  document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
}

function showMainMenu() {
  document.getElementById('subView').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
}

document.getElementById('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const subject = document.getElementById('subject').value;
  const taskName = document.getElementById('taskName').value;
  const dueDate = document.getElementById('dueDate').value;

  const newTask = {
    id: Date.now(),
    subject,
    taskName,
    dueDate,
    completed: false
  };

  tasks.push(newTask);
  totalCreatedCount++;
  saveData();
  
  document.getElementById('taskForm').reset();
  openSection('deadlines');
});

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#555;">No upcoming tasks! 🎉</p>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-card-banner';
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" onchange="toggleTaskDone(${task.id})">
        <div class="task-info-text">
          <strong>Subject ${escapeHtml(task.subject)}: ${escapeHtml(task.taskName)}</strong>
          <small>📅 Due: ${task.dueDate}</small>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="editTask(${task.id})">✏️</button>
        <button class="icon-btn" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function toggleTaskDone(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newSubject = prompt('Edit Subject:', task.subject);
  const newName = prompt('Edit Task Name:', task.taskName);
  const newDate = prompt('Edit Deadline (YYYY-MM-DD):', task.dueDate);

  if (newName && newSubject && newDate) {
    task.taskName = newName;
    task.subject = newSubject;
    task.dueDate = newDate;
    saveData();
  }
}

function updateProgress() {
  const completedCount = totalCreatedCount - tasks.length;
  let percent = 0;

  if (totalCreatedCount > 0) {
    percent = Math.round((completedCount / totalCreatedCount) * 100);
    percent = Math.max(0, Math.min(100, percent));
  }

  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressPercentage').innerText = `${percent}% Completed`;
}

function saveData() {
  localStorage.setItem('studyplanora_tasks', JSON.stringify(tasks));
  localStorage.setItem('studyplanora_total_created', totalCreatedCount);
  renderTasks();
  updateProgress();
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('themeToggleBtn');

  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('studyplanora_theme', 'light');
    btn.innerText = 'Switch to Dark Mode';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('studyplanora_theme', 'dark');
    btn.innerText = 'Switch to Light Mode';
  }
}

function toggleNotifications() {
  const btn = document.getElementById('notifToggleBtn');
  if (btn.innerText.includes('Enable')) {
    btn.innerText = 'Disable Notifications';
    alert('Notifications enabled!');
  } else {
    btn.innerText = 'Enable Notifications';
    alert('Notifications disabled.');
  }
}

function resetPlanner() {
  if (confirm('Are you sure you want to reset all tasks and settings?')) {
    localStorage.clear();
    tasks = [];
    totalCreatedCount = 0;
    document.documentElement.removeAttribute('data-theme');
    saveData();
    alert('Planner has been reset!');
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}