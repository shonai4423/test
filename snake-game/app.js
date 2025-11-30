// スネークゲームクラス
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.gridSize = 30;
        this.tileCount = 20;

        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.food = this.generateFood();

        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.soundEnabled = true;

        this.difficulty = 'normal';
        this.gameMode = 'classic';
        this.speed = 150;

        this.lastRenderTime = 0;
        this.gameLoop = null;

        this.achievements = [];

        this.initializeUI();
        this.loadStats();
        this.draw();
    }

    initializeUI() {
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        document.addEventListener('keypress', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
                e.preventDefault();
            }
        });

        // ボタンイベント
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // 難易度選択
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameStarted) {
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.difficulty = btn.dataset.difficulty;
                    this.updateSpeed();
                }
            });
        });

        // モード選択
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameStarted) {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.gameMode = btn.dataset.mode;
                }
            });
        });
    }

    start() {
        if (this.gameStarted) return;

        this.gameStarted = true;
        this.gameOver = false;
        this.isPaused = false;
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 1, y: 0 }; // 右向きでスタート
        this.food = this.generateFood();
        this.score = 0;
        this.achievements = [];

        this.updateSpeed();
        this.updateDisplay();

        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameStatus').textContent = '矢印キーで操作';

        this.lastRenderTime = 0;
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    update(currentTime) {
        if (this.gameOver) {
            cancelAnimationFrame(this.gameLoop);
            return;
        }

        if (this.isPaused) {
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
            return;
        }

        const timeSinceLastRender = currentTime - this.lastRenderTime;

        if (timeSinceLastRender < this.speed) {
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
            return;
        }

        this.lastRenderTime = currentTime;

        this.direction = { ...this.nextDirection };

        if (this.direction.x === 0 && this.direction.y === 0) {
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
            return;
        }

        this.moveSnake();
        this.draw();

        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    handleKeyPress(e) {
        // 矢印キーの場合はデフォルト動作（スクロール）を防止
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
            e.preventDefault();
        }

        if (!this.gameStarted && (e.key.startsWith('Arrow') || e.key === ' ')) {
            this.start();
            return;
        }

        if (this.gameOver) return;

        switch (e.key) {
            case 'ArrowUp':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
            case ' ':
                this.togglePause();
                break;
        }
    }

    moveSnake() {
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // 壁の処理
        if (this.gameMode === 'classic') {
            // 壁を抜けて反対側に出る
            if (head.x < 0) head.x = this.tileCount - 1;
            if (head.x >= this.tileCount) head.x = 0;
            if (head.y < 0) head.y = this.tileCount - 1;
            if (head.y >= this.tileCount) head.y = 0;
        } else {
            // 壁に当たったらゲームオーバー
            if (head.x < 0 || head.x >= this.tileCount ||
                head.y < 0 || head.y >= this.tileCount) {
                this.endGame();
                return;
            }
        }

        // 自分自身との衝突チェック
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // フードを食べたかチェック
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
    }

    eatFood() {
        this.score += 10;
        this.food = this.generateFood();
        this.playSound('eat');

        // 達成項目の追加
        const length = this.snake.length;
        if (length === 10) {
            this.addAchievement('長さ10に到達！');
        } else if (length === 25) {
            this.addAchievement('長さ25に到達！');
        } else if (length === 50) {
            this.addAchievement('長さ50に到達！すごい！');
        } else if (length === 100) {
            this.addAchievement('長さ100！レジェンド級！');
        }

        // スピードアップ
        if (length % 5 === 0) {
            this.updateSpeed();
            this.addAchievement(`スピードレベル${this.getSpeedLevel()}に上昇`);
        }

        this.updateDisplay();
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment =>
            segment.x === newFood.x && segment.y === newFood.y
        ));
        return newFood;
    }

    updateSpeed() {
        const baseSpeed = {
            easy: 200,
            normal: 150,
            hard: 100
        };

        const length = this.snake.length;
        const speedReduction = Math.floor(length / 5) * 10;
        this.speed = Math.max(50, baseSpeed[this.difficulty] - speedReduction);

        const speedLevel = this.getSpeedLevel();
        document.getElementById('speed').textContent = speedLevel;
        document.getElementById('speedFill').style.width = `${Math.min(100, speedLevel * 10)}%`;
    }

    getSpeedLevel() {
        return Math.floor(this.snake.length / 5) + 1;
    }

    draw() {
        // 背景
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // フード
        const foodGradient = this.ctx.createRadialGradient(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            0,
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2
        );
        foodGradient.addColorStop(0, '#ff6b6b');
        foodGradient.addColorStop(1, '#ee5a6f');

        this.ctx.fillStyle = foodGradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // スネーク
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                segment.x * this.gridSize + this.gridSize,
                segment.y * this.gridSize + this.gridSize
            );

            if (isHead) {
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#059669');
            } else {
                gradient.addColorStop(0, '#34d399');
                gradient.addColorStop(1, '#10b981');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );

            // ハイライト
            if (isHead) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    (this.gridSize - 4) / 3
                );
            }
        });
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.snake.length;
    }

    addAchievement(text) {
        this.achievements.unshift(text);
        if (this.achievements.length > 5) {
            this.achievements.pop();
        }

        const listEl = document.getElementById('achievementsList');
        listEl.innerHTML = '';
        this.achievements.forEach(achievement => {
            const div = document.createElement('div');
            div.className = 'achievement-item';
            div.textContent = achievement;
            listEl.appendChild(div);
        });
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            document.getElementById('gameStatus').textContent = '一時停止中';
        } else {
            document.getElementById('gameStatus').textContent = '矢印キーで操作';
        }
    }

    reset() {
        cancelAnimationFrame(this.gameLoop);

        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.achievements = [];

        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('gameStatus').textContent = '矢印キーでスタート';
        document.getElementById('gameOverlay').classList.remove('active');
        document.getElementById('achievementsList').innerHTML = '<div class="achievement-placeholder">ゲームを開始してください</div>';

        this.updateSpeed();
        this.updateDisplay();
        this.draw();
    }

    restart() {
        this.reset();
        setTimeout(() => this.start(), 100);
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        this.playSound('gameover');

        // 統計更新
        this.updateStats();

        // ゲームオーバー表示
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLength').textContent = this.snake.length;
        document.getElementById('gameOverlay').classList.add('active');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('gameStatus').textContent = 'ゲームオーバー';
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundOn = document.getElementById('soundOn');
        const soundOff = document.getElementById('soundOff');

        if (this.soundEnabled) {
            soundOn.style.display = 'block';
            soundOff.style.display = 'none';
        } else {
            soundOn.style.display = 'none';
            soundOff.style.display = 'block';
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const darkIcon = document.getElementById('darkIcon');
        const lightIcon = document.getElementById('lightIcon');

        if (newTheme === 'light') {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        } else {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'eat':
                oscillator.frequency.value = 523.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'gameover':
                oscillator.frequency.value = 130.81;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('snakeStats')) || {
            highScore: 0,
            totalGames: 0,
            maxLength: 1,
            totalFood: 0
        };

        document.getElementById('highScore').textContent = stats.highScore;
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('maxLength').textContent = stats.maxLength;
        document.getElementById('totalFood').textContent = stats.totalFood;
    }

    updateStats() {
        const stats = JSON.parse(localStorage.getItem('snakeStats')) || {
            highScore: 0,
            totalGames: 0,
            maxLength: 1,
            totalFood: 0
        };

        stats.totalGames++;
        stats.totalFood += Math.floor(this.score / 10);

        if (this.score > stats.highScore) {
            stats.highScore = this.score;
            this.addAchievement('新記録達成！');
        }

        if (this.snake.length > stats.maxLength) {
            stats.maxLength = this.snake.length;
        }

        localStorage.setItem('snakeStats', JSON.stringify(stats));
        this.loadStats();
    }
}

// テーマ初期化
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'light') {
    document.getElementById('darkIcon').style.display = 'block';
    document.getElementById('lightIcon').style.display = 'none';
} else {
    document.getElementById('darkIcon').style.display = 'none';
    document.getElementById('lightIcon').style.display = 'block';
}

// ゲーム初期化
const game = new SnakeGame();
