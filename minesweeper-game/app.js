// マインスイーパーゲームクラス
class MinesweeperGame {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.currentDifficulty = 'medium';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.won = false;
        this.soundEnabled = true;

        this.timer = 0;
        this.timerInterval = null;

        this.initializeUI();
        this.loadStats();
        this.newGame();
    }

    initializeUI() {
        // ボタンイベント
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // 難易度選択
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentDifficulty = btn.dataset.difficulty;
                this.newGame();
            });
        });

        // モーダル
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
    }

    newGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.won = false;
        this.timer = 0;
        clearInterval(this.timerInterval);

        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;

        this.createBoard();
        this.renderBoard();
        this.updateDisplay();

        document.getElementById('gameFace').textContent = '😊';
        document.getElementById('gameMessage').textContent = 'クリックしてスタート';
        document.getElementById('gameOverlay').classList.remove('active');
    }

    createBoard() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;

        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            // 最初にクリックした場所とその周囲は避ける
            if (Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1) {
                continue;
            }

            if (this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;

                // 周囲のセルの数字を増やす
                this.forEachNeighbor(row, col, (r, c) => {
                    if (this.board[r][c] !== -1) {
                        this.board[r][c]++;
                    }
                });
            }
        }
    }

    forEachNeighbor(row, col, callback) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const r = row + dr;
                const c = col + dc;

                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    callback(r, c);
                }
            }
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('gameBoard');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        boardEl.style.gridTemplateRows = `repeat(${this.rows}, var(--cell-size))`;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                cell.addEventListener('click', () => this.handleLeftClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });

                boardEl.appendChild(cell);
            }
        }
    }

    handleLeftClick(row, col) {
        if (this.gameOver || this.flagged[row][col] === 1) return;

        if (!this.gameStarted) {
            this.placeMines(row, col);
            this.gameStarted = true;
            this.startTimer();
            document.getElementById('gameMessage').textContent = 'がんばって！';
        }

        if (this.revealed[row][col]) return;

        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.revealMines();
            this.endGame(false);
            return;
        }

        this.revealCell(row, col);
        this.checkWin();
        this.updateDisplay();
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;

        // 0: なし, 1: 旗, 2: はてな
        this.flagged[row][col] = (this.flagged[row][col] + 1) % 3;

        const cell = this.getCell(row, col);
        cell.classList.remove('flagged', 'question');

        if (this.flagged[row][col] === 1) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else if (this.flagged[row][col] === 2) {
            cell.classList.add('question');
            cell.textContent = '❓';
        } else {
            cell.textContent = '';
        }

        this.updateDisplay();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        if (this.revealed[row][col] || this.flagged[row][col] === 1) return;

        this.revealed[row][col] = true;
        const cell = this.getCell(row, col);
        cell.classList.add('opened');

        const value = this.board[row][col];

        if (value > 0) {
            cell.textContent = value;
            cell.dataset.number = value;
        } else {
            cell.dataset.number = 0;
            // 0の場合は周囲も開く
            this.forEachNeighbor(row, col, (r, c) => {
                this.revealCell(r, c);
            });
        }

        this.playSound('reveal');
    }

    revealMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getCell(row, col);

                if (this.board[row][col] === -1) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (this.flagged[row][col] === 1 && this.board[row][col] !== -1) {
                    cell.classList.add('mine-wrong');
                    cell.textContent = '❌';
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col]) {
                    revealedCount++;
                }
            }
        }

        const totalCells = this.rows * this.cols;
        if (revealedCount === totalCells - this.totalMines) {
            this.won = true;
            this.gameOver = true;
            this.endGame(true);
        }
    }

    endGame(won) {
        clearInterval(this.timerInterval);

        if (won) {
            document.getElementById('gameFace').textContent = '😎';
            document.getElementById('gameMessage').textContent = 'クリア！';
            document.getElementById('overlayEmoji').textContent = '🎉';
            document.getElementById('overlayTitle').textContent = 'クリア！';
            this.playSound('win');
        } else {
            document.getElementById('gameFace').textContent = '😵';
            document.getElementById('gameMessage').textContent = 'ゲームオーバー';
            document.getElementById('overlayEmoji').textContent = '💥';
            document.getElementById('overlayTitle').textContent = 'ゲームオーバー';
            this.playSound('lose');
        }

        document.getElementById('finalTime').textContent = String(this.timer).padStart(3, '0');
        document.getElementById('gameOverlay').classList.add('active');

        this.updateStats(won);
    }

    getCell(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    updateDisplay() {
        // 残り地雷数
        let flagCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.flagged[row][col] === 1) {
                    flagCount++;
                }
            }
        }

        const minesLeft = Math.max(0, this.totalMines - flagCount);
        document.getElementById('minesLeft').textContent = minesLeft;

        // タイマー
        document.getElementById('timer').textContent = String(this.timer).padStart(3, '0');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            if (this.timer > 999) {
                this.timer = 999;
            }
            this.updateDisplay();
        }, 1000);
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
            case 'reveal':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'win':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'lose':
                oscillator.frequency.value = 130.81;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('minesweeperStats')) || {
            totalWins: 0,
            totalGames: 0,
            bestTime: null
        };

        document.getElementById('totalWins').textContent = stats.totalWins;
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('bestTime').textContent = stats.bestTime ? String(stats.bestTime).padStart(3, '0') : '---';

        const winRate = stats.totalGames > 0
            ? Math.round((stats.totalWins / stats.totalGames) * 100)
            : 0;
        document.getElementById('winRate').textContent = `${winRate}%`;
    }

    updateStats(won) {
        const stats = JSON.parse(localStorage.getItem('minesweeperStats')) || {
            totalWins: 0,
            totalGames: 0,
            bestTime: null
        };

        stats.totalGames++;

        if (won) {
            stats.totalWins++;

            if (stats.bestTime === null || this.timer < stats.bestTime) {
                stats.bestTime = this.timer;
            }
        }

        localStorage.setItem('minesweeperStats', JSON.stringify(stats));
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
const game = new MinesweeperGame();
