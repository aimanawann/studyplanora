let tasks = JSON.parse(localStorage.getItem('studyplanora_tasks')) || [];
let notificationsEnabled = JSON.parse(localStorage.getItem('studyplanora_notifs')) || false;
let notifiedTaskIds = JSON.parse(localStorage.getItem('studyplanora_notified_ids')) || [];

document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  updateProgress();
  updateNotifUI();

  if (localStorage.getItem('studyplanora_theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeToggleBtn').innerText = 'Switch to Light Mode';
  }

  // Check 12-hour notification reminders every minute
  setInterval(check12HourReminders, 60000);
});

function openSection(sectionId) {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('subView').classList.remove('hidden');

  document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');

  if (sectionId === 'addTask') {
    resetTaskForm();
  }
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
  const dueTime = document.getElementById('dueTime').value;

  const newTask = {
    id: Date.now(),
    subject,
    taskName,
    dueDate,
    dueTime,
    completed: false
  };

  tasks.push(newTask);
  saveData();

  // Hide form, show post-addition menu prompt
  document.getElementById('taskForm').classList.add('hidden');
  document.getElementById('addPrompt').classList.remove('hidden');
});

function resetTaskForm() {
  document.getElementById('taskForm').reset();
  document.getElementById('taskForm').classList.remove('hidden');
  document.getElementById('addPrompt').classList.add('hidden');
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = '<p style="text-align:center;">No upcoming tasks! 🎉</p>';
    return;
  }

  // Sort tasks by date & time (nearest deadline first)
  tasks.sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`));

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-card-banner ${task.completed ? 'task-completed' : ''}`;
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskDone(${task.id})">
        <div class="task-info-text">
          <strong>${escapeHtml(task.subject)}: ${escapeHtml(task.taskName)}</strong>
          <small>📅 ${task.dueDate} at ${task.dueTime}</small>
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
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveData();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newSubject = prompt('Edit Subject Choice:', task.subject);
  const newName = prompt('Edit Task Name:', task.taskName);
  const newDate = prompt('Edit Deadline Date (YYYY-MM-DD):', task.dueDate);
  const newTime = prompt('Edit Deadline Time (HH:MM in 24h):', task.dueTime);

  if (newName && newSubject && newDate && newTime) {
    task.subject = newSubject;
    task.taskName = newName;
    task.dueDate = newDate;
    task.dueTime = newTime;
    saveData();
  }
}

// Progress calculation based ONLY on currently existing tasks
function updateProgress() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  let percent = 0;
  if (totalTasks > 0) {
    percent = Math.round((completedTasks / totalTasks) * 100);
  }

  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressPercentage').innerText = `${percent}% Completed`;
  document.getElementById('progressStats').innerText = `${completedTasks} of ${totalTasks} current tasks completed`;
}

function saveData() {
  localStorage.setItem('studyplanora_tasks', JSON.stringify(tasks));
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
  if (!notificationsEnabled) {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          notificationsEnabled = true;
          saveNotifState();
          alert('12-Hour Deadline Notifications Enabled!');
          check12HourReminders();
        } else {
          alert('Please allow notification permissions in your browser settings.');
        }
      });
    } else {
      alert('Browser notifications are not supported on this device.');
    }
  } else {
    notificationsEnabled = false;
    saveNotifState();
    alert('Notifications disabled.');
  }
}

function saveNotifState() {
  localStorage.setItem('studyplanora_notifs', JSON.stringify(notificationsEnabled));
  updateNotifUI();
}

function updateNotifUI() {
  const badge = document.getElementById('notifBadge');
  const btn = document.getElementById('notifToggleBtn');

  if (notificationsEnabled) {
    badge.innerText = 'ON';
    badge.className = 'status-badge status-on';
    btn.innerText = 'Disable Notifications';
  } else {
    badge.innerText = 'OFF';
    badge.className = 'status-badge status-off';
    btn.innerText = 'Enable 12h Reminders';
  }
}

function check12HourReminders() {
  if (!notificationsEnabled || Notification.permission !== 'granted') return;

  const now = new Date().getTime();
  const twelveHoursInMs = 12 * 60 * 60 * 1000;

  tasks.forEach(task => {
    if (task.completed || notifiedTaskIds.includes(task.id)) return;

    const taskTime = new Date(`${task.dueDate}T${task.dueTime}`).getTime();
    const timeDiff = taskTime - now;

    if (timeDiff > 0 && timeDiff <= twelveHoursInMs) {
      new Notification('⏰ StudyPlanOra Reminder!', {
        body: `Your task "${task.taskName}" for ${task.subject} is due in less than 12 hours!`,
        icon: 'box.png'
      });
      notifiedTaskIds.push(task.id);
      localStorage.setItem('studyplanora_notified_ids', JSON.stringify(notifiedTaskIds));
    }
  });
}

function resetPlanner() {
  if (confirm('Are you sure you want to reset all tasks and settings?')) {
    localStorage.clear();
    tasks = [];
    notificationsEnabled = false;
    notifiedTaskIds = [];
    document.documentElement.removeAttribute('data-theme');
    saveData();
    updateNotifUI();
    alert('Planner has been reset!');
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}