// テトリスゲームクラス
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');

        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;

        this.board = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.soundEnabled = true;

        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.gameLoop = null;

        this.achievements = [];

        this.pieces = {
            'I': {
                shape: [[1, 1, 1, 1]],
                color: '#00f0f0'
            },
            'O': {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#f0f000'
            },
            'T': {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            'S': {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000'
            },
            'Z': {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000'
            },
            'J': {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000f0'
            },
            'L': {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#f0a000'
            }
        };

        this.initializeBoard();
        this.initializeUI();
        this.loadStats();
    }

    initializeBoard() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
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
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // モーダル
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // レベル選択
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.gameOver || !this.currentPiece) {
                    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.level = parseInt(btn.dataset.level);
                    this.updateDropInterval();
                    this.updateDisplay();
                }
            });
        });
    }

    start() {
        if (this.currentPiece) return;

        this.initializeBoard();
        this.score = 0;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.achievements = [];
        this.canHold = true;
        this.holdPiece = null;

        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();

        this.updateDisplay();
        this.updateDropInterval();

        // 初期化
        this.dropCounter = 0;
        this.lastTime = 0;

        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameStatus').style.display = 'none';

        requestAnimationFrame((time) => this.update(time));
    }

    update(currentTime = 0) {
        if (this.gameOver) {
            cancelAnimationFrame(this.gameLoop);
            return;
        }

        if (this.isPaused) {
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
            return;
        }

        const deltaTime = currentTime - this.lastTime;

        // ブロック落下処理
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.moveDown();
            this.dropCounter = 0;
        }

        this.lastTime = currentTime;
        this.draw();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    createPiece() {
        const pieces = Object.keys(this.pieces);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        const pieceData = this.pieces[type];

        return {
            type: type,
            shape: pieceData.shape,
            color: pieceData.color,
            x: Math.floor(this.COLS / 2) - Math.floor(pieceData.shape[0].length / 2),
            y: 0
        };
    }

    handleKeyPress(e) {
        // 矢印キーの場合はデフォルト動作（スクロール）を防止
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
            e.preventDefault();
        }

        if (this.gameOver || !this.currentPiece) {
            if (e.code === 'Space') {
                this.start();
            }
            return;
        }

        if (this.isPaused && e.code !== 'KeyP') return;

        switch (e.code) {
            case 'ArrowLeft':
                this.move(-1);
                break;
            case 'ArrowRight':
                this.move(1);
                break;
            case 'ArrowDown':
                this.moveDown(true);
                break;
            case 'ArrowUp':
            case 'Space':
                this.rotate();
                break;
            case 'KeyC':
                this.hold();
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
    }

    move(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
        }
    }

    moveDown(soft = false) {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.merge();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createPiece();
            this.canHold = true;

            if (this.collision()) {
                this.endGame();
            }
        } else if (soft) {
            this.score += 1;
            this.updateDisplay();
        }
        this.dropCounter = 0;
    }

    rotate() {
        const piece = this.currentPiece;
        const originalShape = piece.shape;

        // 回転
        piece.shape = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        );

        // 壁キック
        let offset = 0;
        while (this.collision()) {
            piece.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > piece.shape[0].length) {
                piece.shape = originalShape;
                piece.x -= offset;
                return;
            }
        }
    }

    hold() {
        if (!this.canHold) return;

        if (this.holdPiece === null) {
            this.holdPiece = this.currentPiece;
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createPiece();
        } else {
            [this.holdPiece, this.currentPiece] = [this.currentPiece, this.holdPiece];
        }

        // 位置をリセット
        this.currentPiece.x = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;

        this.canHold = false;
        this.playSound('hold');
    }

    collision() {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;

                    if (newX < 0 || newX >= this.COLS ||
                        newY >= this.ROWS ||
                        (newY >= 0 && this.board[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = piece.color;
                    }
                }
            }
        }
        this.playSound('drop');
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            // 得点計算
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;

            this.playSound('clear');

            // 達成の追加
            if (linesCleared === 4) {
                this.addAchievement('テトリス！4ラインクリア');
            } else if (linesCleared === 3) {
                this.addAchievement(`トリプル！${linesCleared}ラインクリア`);
            } else if (linesCleared === 2) {
                this.addAchievement(`ダブル！${linesCleared}ラインクリア`);
            }

            // レベルアップ
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateDropInterval();
                this.addAchievement(`レベル${this.level}に到達！`);
                this.playSound('levelup');
            }

            this.updateDisplay();
        }
    }

    updateDropInterval() {
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
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

    draw() {
        // ボードをクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド線
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }

        // ボードを描画
        this.drawBoard();

        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);

            // ゴーストピース
            this.drawGhost();
        }

        // 次のピース
        this.drawNextPiece();

        // ホールドピース
        this.drawHoldPiece();
    }

    drawBoard() {
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.board[y][x] !== 0) {
                    this.drawBlock(this.ctx, x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.board[y][x]);
                }
            }
        }
    }

    drawPiece(ctx, piece, offsetX, offsetY, blockSize = this.BLOCK_SIZE) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    this.drawBlock(
                        ctx,
                        (offsetX + x) * blockSize,
                        (offsetY + y) * blockSize,
                        piece.color,
                        blockSize
                    );
                }
            }
        }
    }

    drawBlock(ctx, x, y, color, size = this.BLOCK_SIZE) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 1, y + 1, size - 2, size / 3);
    }

    drawGhost() {
        // 現在のピースの位置を保存
        const originalY = this.currentPiece.y;

        // ゴースト位置を計算
        let ghostY = originalY;
        while (true) {
            this.currentPiece.y = ghostY + 1;
            if (this.collision()) {
                break;
            }
            ghostY++;
        }

        // 現在のピースの位置を元に戻す
        this.currentPiece.y = originalY;

        // ゴーストピースを描画
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] !== 0) {
                    this.ctx.strokeStyle = this.currentPiece.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(
                        (this.currentPiece.x + x) * this.BLOCK_SIZE + 2,
                        (ghostY + y) * this.BLOCK_SIZE + 2,
                        this.BLOCK_SIZE - 4,
                        this.BLOCK_SIZE - 4
                    );
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const offsetX = (4 - this.nextPiece.shape[0].length) / 2;
            const offsetY = (4 - this.nextPiece.shape.length) / 2;
            this.drawPiece(this.nextCtx, this.nextPiece, offsetX, offsetY, 30);
        }
    }

    drawHoldPiece() {
        this.holdCtx.fillStyle = '#000';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

        if (this.holdPiece) {
            const offsetX = (4 - this.holdPiece.shape[0].length) / 2;
            const offsetY = (4 - this.holdPiece.shape.length) / 2;
            this.drawPiece(this.holdCtx, this.holdPiece, offsetX, offsetY, 30);
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    togglePause() {
        if (!this.currentPiece || this.gameOver) return;

        this.isPaused = !this.isPaused;
        const statusEl = document.getElementById('gameStatus');

        if (this.isPaused) {
            statusEl.querySelector('.status-text').textContent = '一時停止中';
            statusEl.style.display = 'block';
        } else {
            statusEl.style.display = 'none';
        }
    }

    reset() {
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.initializeBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.achievements = [];

        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('gameStatus').style.display = 'block';
        document.getElementById('gameStatus').querySelector('.status-text').textContent = 'スペースキーでスタート';
        document.getElementById('gameOverlay').classList.remove('active');
        document.getElementById('achievementsList').innerHTML = '<div class="achievement-placeholder">プレイしてください</div>';

        this.updateDisplay();
        this.draw();
    }

    restart() {
        this.reset();
        this.start();
    }

    endGame() {
        this.gameOver = true;
        this.playSound('gameover');

        // 統計更新
        this.updateStats();

        // ゲームオーバー表示
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverlay').classList.add('active');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    showHelp() {
        document.getElementById('helpModal').classList.add('active');
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
            case 'drop':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'clear':
                oscillator.frequency.value = 523.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'levelup':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'gameover':
                oscillator.frequency.value = 130.81;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.8);
                break;
            case 'hold':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('tetrisStats')) || {
            highScore: 0,
            totalGames: 0,
            totalLines: 0
        };

        document.getElementById('highScore').textContent = stats.highScore;
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('totalLines').textContent = stats.totalLines;
    }

    updateStats() {
        const stats = JSON.parse(localStorage.getItem('tetrisStats')) || {
            highScore: 0,
            totalGames: 0,
            totalLines: 0
        };

        stats.totalGames++;
        stats.totalLines += this.lines;

        if (this.score > stats.highScore) {
            stats.highScore = this.score;
            this.addAchievement('新記録達成！');
        }

        localStorage.setItem('tetrisStats', JSON.stringify(stats));
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
const game = new TetrisGame();
