// データ管理
class DataManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.pomodoroStats = JSON.parse(localStorage.getItem('pomodoroStats')) || {
            total: 0,
            today: 0,
            lastDate: new Date().toDateString()
        };
        this.activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
        this.checkNewDay();
    }

    checkNewDay() {
        const today = new Date().toDateString();
        if (this.pomodoroStats.lastDate !== today) {
            this.pomodoroStats.today = 0;
            this.pomodoroStats.lastDate = today;
            this.save();
        }
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('pomodoroStats', JSON.stringify(this.pomodoroStats));
        localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
    }

    addTask(text, priority) {
        const task = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(task);
        this.addActivity(`タスクを追加: ${text}`, 'task');
        this.save();
        return task;
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.addActivity(
                `タスクを${task.completed ? '完了' : '未完了に戻す'}: ${task.text}`,
                task.completed ? 'complete' : 'task'
            );
            this.save();
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.addActivity(`タスクを削除: ${task.text}`, 'delete');
            this.save();
        }
    }

    completePomodoro() {
        this.pomodoroStats.total++;
        this.pomodoroStats.today++;
        this.addActivity('ポモドーロを完了', 'pomodoro');
        this.save();
    }

    addActivity(title, type) {
        this.activityLog.unshift({
            title,
            type,
            time: new Date().toISOString()
        });
        if (this.activityLog.length > 20) {
            this.activityLog = this.activityLog.slice(0, 20);
        }
        this.save();
    }

    getTasks(filter = 'all') {
        if (filter === 'all') return this.tasks;
        if (filter === 'active') return this.tasks.filter(t => !t.completed);
        if (filter === 'completed') return this.tasks.filter(t => t.completed);
        return this.tasks;
    }

    getTasksByPriority(priority, filter = 'all') {
        return this.getTasks(filter).filter(t => t.priority === priority);
    }
}

const dataManager = new DataManager();

// ナビゲーション
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const viewName = item.dataset.view;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        views.forEach(v => v.classList.remove('active'));
        document.getElementById(`${viewName}View`).classList.add('active');

        if (viewName === 'stats') {
            updateStats();
        }
    });
});

// テーマ切り替え
const themeToggle = document.getElementById('themeToggle');
const darkIcon = document.getElementById('darkIcon');
const lightIcon = document.getElementById('lightIcon');
let currentTheme = localStorage.getItem('theme') || 'light';

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        darkIcon.style.display = 'none';
        lightIcon.style.display = 'block';
    } else {
        darkIcon.style.display = 'block';
        lightIcon.style.display = 'none';
    }
}

setTheme(currentTheme);

themeToggle.addEventListener('click', () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// タスク管理
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskBtn = document.getElementById('addTaskBtn');
const filterSelect = document.getElementById('filterSelect');

function renderTasks() {
    const filter = filterSelect.value;
    const priorities = ['high', 'medium', 'low'];

    priorities.forEach(priority => {
        const container = document.getElementById(`${priority}PriorityTasks`);
        const tasks = dataManager.getTasksByPriority(priority, filter);

        container.innerHTML = '';

        tasks.forEach(task => {
            const taskEl = createTaskElement(task);
            container.appendChild(taskEl);
        });

        if (tasks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">タスクがありません</p>';
        }
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;

    const timeAgo = getTimeAgo(new Date(task.createdAt));

    div.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-text">${task.text}</div>
            <div class="task-time">${timeAgo}</div>
        </div>
        <div class="task-actions">
            <button class="task-btn delete-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    const checkbox = div.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
        dataManager.toggleTask(task.id);
        renderTasks();
    });

    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        dataManager.deleteTask(task.id);
        renderTasks();
    });

    return div;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'たった今';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}日前`;
    return date.toLocaleDateString('ja-JP');
}

addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) {
        alert('タスクを入力してください');
        return;
    }

    dataManager.addTask(text, prioritySelect.value);
    taskInput.value = '';
    renderTasks();
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTaskBtn.click();
    }
});

filterSelect.addEventListener('change', renderTasks);

// ポモドーロタイマー
class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;
        this.timeLeft = this.workDuration;
        this.isRunning = false;
        this.isWorkMode = true;
        this.interval = null;

        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerMode = document.getElementById('timerMode');
        this.timerProgress = document.getElementById('timerProgress');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');

        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
        this.autoStartBreak = document.getElementById('autoStartBreak');
        this.soundEnabled = document.getElementById('soundEnabled');

        this.setupEventListeners();
        this.updateDisplay();
        this.updatePomodoroStats();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.workDurationInput.addEventListener('change', (e) => {
            this.workDuration = parseInt(e.target.value) * 60;
            if (this.isWorkMode && !this.isRunning) {
                this.timeLeft = this.workDuration;
                this.updateDisplay();
            }
        });

        this.breakDurationInput.addEventListener('change', (e) => {
            this.breakDuration = parseInt(e.target.value) * 60;
            if (!this.isWorkMode && !this.isRunning) {
                this.timeLeft = this.breakDuration;
                this.updateDisplay();
            }
        });
    }

    start() {
        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        this.startBtn.style.display = 'flex';
        this.pauseBtn.style.display = 'none';
        clearInterval(this.interval);
    }

    reset() {
        this.pause();
        this.timeLeft = this.isWorkMode ? this.workDuration : this.breakDuration;
        this.updateDisplay();
    }

    complete() {
        this.pause();

        if (this.soundEnabled.checked) {
            this.playSound();
        }

        if (this.isWorkMode) {
            dataManager.completePomodoro();
            this.updatePomodoroStats();
            alert('ポモドーロ完了！休憩時間です。');
            this.isWorkMode = false;
            this.timeLeft = this.breakDuration;

            if (this.autoStartBreak.checked) {
                setTimeout(() => this.start(), 1000);
            }
        } else {
            alert('休憩終了！次のポモドーロを開始しましょう。');
            this.isWorkMode = true;
            this.timeLeft = this.workDuration;
        }

        this.timerMode.textContent = this.isWorkMode ? '作業時間' : '休憩時間';
        this.updateDisplay();
    }

    playSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const totalTime = this.isWorkMode ? this.workDuration : this.breakDuration;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 565.48;
        this.timerProgress.style.strokeDashoffset = progress;
    }

    updatePomodoroStats() {
        document.getElementById('todayPomodoros').textContent = dataManager.pomodoroStats.today;
        document.getElementById('totalPomodoros').textContent = dataManager.pomodoroStats.total;
    }
}

// SVGグラデーション追加
const svg = document.querySelector('.timer-circle');
const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
gradient.setAttribute('id', 'gradient');
gradient.innerHTML = `
    <stop offset="0%" stop-color="#667eea"/>
    <stop offset="100%" stop-color="#764ba2"/>
`;
defs.appendChild(gradient);
svg.insertBefore(defs, svg.firstChild);

const pomodoroTimer = new PomodoroTimer();

// 統計情報
function updateStats() {
    const totalTasks = dataManager.tasks.length;
    const activeTasks = dataManager.tasks.filter(t => !t.completed).length;
    const completedTasks = dataManager.tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('activeTasks').textContent = activeTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('totalPomodorosStats').textContent = dataManager.pomodoroStats.total;

    document.getElementById('completionProgress').style.width = `${completionRate}%`;
    document.getElementById('completionPercentage').textContent = `${completionRate}%`;

    renderActivityLog();
}

function renderActivityLog() {
    const activityLog = document.getElementById('activityLog');
    activityLog.innerHTML = '';

    if (dataManager.activityLog.length === 0) {
        activityLog.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">アクティビティがありません</p>';
        return;
    }

    dataManager.activityLog.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'activity-item';

        const time = new Date(activity.time);
        const timeStr = getTimeAgo(time);

        div.innerHTML = `
            <div class="activity-title">${activity.title}</div>
            <div class="activity-time">${timeStr}</div>
        `;

        activityLog.appendChild(div);
    });
}

// 初期化
renderTasks();
updateStats();
