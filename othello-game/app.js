// オセロゲームクラス
class OthelloGame {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.gameMode = 'pvp';
        this.difficulty = 'normal';
        this.history = [];
        this.soundEnabled = true;
        this.startTime = null;
        this.timerInterval = null;

        this.initializeBoard();
        this.initializeUI();
        this.loadStats();
        this.updateDisplay();
    }

    initializeBoard() {
        // 初期配置
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
    }

    initializeUI() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                boardElement.appendChild(cell);
            }
        }

        // イベントリスナー
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // モーダル
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newGameFromModalBtn').addEventListener('click', () => {
            this.closeModal();
            this.newGame();
        });

        // ゲームモード
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                this.newGame();
            });
        });

        // タイマー開始
        this.startTimer();
    }

    handleCellClick(row, col) {
        if (this.board[row][col] !== null) return;

        const validMoves = this.getValidMoves(this.currentPlayer);
        const move = validMoves.find(m => m.row === row && m.col === col);

        if (move) {
            this.saveState();
            this.makeMove(row, col);
            this.playSound('place');
            this.updateDisplay();

            // CPUのターン
            if (this.gameMode.startsWith('pvc') && this.currentPlayer === 'white') {
                setTimeout(() => this.cpuMove(), 500);
            }
        }
    }

    makeMove(row, col) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        this.board[row][col] = this.currentPlayer;
        const flipped = [];

        directions.forEach(([dx, dy]) => {
            const toFlip = this.checkDirection(row, col, dx, dy, this.currentPlayer);
            flipped.push(...toFlip);
        });

        // アニメーション付きで石を反転
        flipped.forEach((pos, index) => {
            setTimeout(() => {
                this.board[pos.row][pos.col] = this.currentPlayer;
                this.flipStone(pos.row, pos.col);
            }, index * 50);
        });

        setTimeout(() => {
            this.switchPlayer();
            this.checkGameOver();
        }, flipped.length * 50 + 100);
    }

    checkDirection(row, col, dx, dy, player) {
        const toFlip = [];
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (this.board[x][y] === null) break;
            if (this.board[x][y] === player) {
                return toFlip;
            }
            toFlip.push({ row: x, col: y });
            x += dx;
            y += dy;
        }

        return [];
    }

    getValidMoves(player) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] !== null) continue;

                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];

                for (const [dx, dy] of directions) {
                    if (this.checkDirection(row, col, dx, dy, player).length > 0) {
                        moves.push({ row, col });
                        break;
                    }
                }
            }
        }

        return moves;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

        // 有効な手がない場合はスキップ
        if (this.getValidMoves(this.currentPlayer).length === 0) {
            const opponent = this.currentPlayer === 'black' ? 'white' : 'black';
            if (this.getValidMoves(opponent).length > 0) {
                this.showMessage(`${this.currentPlayer === 'black' ? '黒' : '白'}はパス`);
                this.currentPlayer = opponent;
            }
        }

        this.updateDisplay();
    }

    cpuMove() {
        const validMoves = this.getValidMoves(this.currentPlayer);
        if (validMoves.length === 0) return;

        let move;
        if (this.gameMode === 'pvc-easy') {
            move = this.cpuMoveEasy(validMoves);
        } else if (this.gameMode === 'pvc-normal') {
            move = this.cpuMoveNormal(validMoves);
        } else {
            move = this.cpuMoveHard(validMoves);
        }

        this.saveState();
        this.makeMove(move.row, move.col);
        this.playSound('place');
        this.updateDisplay();
    }

    cpuMoveEasy(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    cpuMoveNormal(validMoves) {
        // 角を優先、その次は辺
        const corners = validMoves.filter(m =>
            (m.row === 0 || m.row === 7) && (m.col === 0 || m.col === 7)
        );
        if (corners.length > 0) {
            return corners[Math.floor(Math.random() * corners.length)];
        }

        const edges = validMoves.filter(m =>
            m.row === 0 || m.row === 7 || m.col === 0 || m.col === 7
        );
        if (edges.length > 0) {
            return edges[Math.floor(Math.random() * edges.length)];
        }

        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    cpuMoveHard(validMoves) {
        // ミニマックス的な評価（簡易版）
        let bestMove = null;
        let bestScore = -Infinity;

        const positionWeights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [10, -2, 3, 2, 2, 3, -2, 10],
            [5, -2, 2, 1, 1, 2, -2, 5],
            [5, -2, 2, 1, 1, 2, -2, 5],
            [10, -2, 3, 2, 2, 3, -2, 10],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];

        validMoves.forEach(move => {
            const score = positionWeights[move.row][move.col];
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });

        return bestMove;
    }

    checkGameOver() {
        const blackMoves = this.getValidMoves('black');
        const whiteMoves = this.getValidMoves('white');

        if (blackMoves.length === 0 && whiteMoves.length === 0) {
            this.endGame();
        }
    }

    endGame() {
        this.stopTimer();
        const { black, white } = this.getScore();

        let result;
        if (black > white) {
            result = 'black';
            this.playSound('win');
        } else if (white > black) {
            result = 'white';
            this.playSound('win');
        } else {
            result = 'draw';
            this.playSound('draw');
        }

        this.updateStats(result);
        this.showGameOverModal(black, white, result);
    }

    showGameOverModal(black, white, result) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('resultMessage');

        document.getElementById('finalBlackScore').textContent = black;
        document.getElementById('finalWhiteScore').textContent = white;

        if (result === 'black') {
            title.textContent = '黒の勝利！';
            message.textContent = '🎉 おめでとうございます！';
        } else if (result === 'white') {
            title.textContent = '白の勝利！';
            message.textContent = '🎉 おめでとうございます！';
        } else {
            title.textContent = '引き分け';
            message.textContent = '互角の戦いでした';
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('gameOverModal').classList.remove('active');
    }

    getScore() {
        let black = 0, white = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 'black') black++;
                if (this.board[row][col] === 'white') white++;
            }
        }

        return { black, white };
    }

    updateDisplay() {
        // ボードを更新
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.innerHTML = '';
            cell.classList.remove('valid');

            if (this.board[row][col]) {
                const stone = document.createElement('div');
                stone.className = `stone ${this.board[row][col]}-stone`;
                cell.appendChild(stone);
            }
        });

        // 有効な手を表示
        const validMoves = this.getValidMoves(this.currentPlayer);
        validMoves.forEach(move => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            cell.classList.add('valid');
        });

        // スコアを更新
        const { black, white } = this.getScore();
        document.getElementById('blackScore').textContent = black;
        document.getElementById('whiteScore').textContent = white;

        // ターン表示
        document.getElementById('turnIndicator').querySelector('.turn-text').textContent =
            `${this.currentPlayer === 'black' ? '黒' : '白'}のターン`;

        // プレイヤー情報のアクティブ状態
        document.querySelectorAll('.player-info').forEach(info => {
            info.classList.remove('active');
        });
        document.querySelector(`.player-info.${this.currentPlayer}`).classList.add('active');

        // 元に戻すボタン
        document.getElementById('undoBtn').disabled = this.history.length === 0;
    }

    flipStone(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const stone = cell.querySelector('.stone');
        if (stone) {
            stone.classList.add('flip');
            setTimeout(() => stone.classList.remove('flip'), 600);
        }
    }

    saveState() {
        this.history.push({
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer
        });
    }

    undo() {
        if (this.history.length === 0) return;

        const state = this.history.pop();
        this.board = state.board;
        this.currentPlayer = state.currentPlayer;
        this.updateDisplay();
    }

    showHint() {
        const validMoves = this.getValidMoves(this.currentPlayer);
        if (validMoves.length > 0) {
            const hint = validMoves[0];
            const cell = document.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
            cell.style.animation = 'pulse 0.5s 3';
            setTimeout(() => {
                cell.style.animation = '';
            }, 1500);
        }
    }

    showMessage(message) {
        const overlay = document.getElementById('boardOverlay');
        overlay.textContent = message;
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 1500);
    }

    newGame() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.history = [];
        this.initializeBoard();
        this.updateDisplay();
        this.closeModal();
        this.startTimer();
    }

    startTimer() {
        this.startTime = Date.now();
        this.stopTimer();

        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timer').textContent =
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
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
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const darkIcon = document.getElementById('darkIcon');
        const lightIcon = document.getElementById('lightIcon');

        if (newTheme === 'dark') {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        } else {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'place') {
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } else if (type === 'win') {
            oscillator.frequency.value = 523.25;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('othelloStats')) || {
            totalGames: 0,
            wins: 0,
            draws: 0
        };

        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('wins').textContent = stats.wins;
        document.getElementById('draws').textContent = stats.draws;

        const winRate = stats.totalGames > 0
            ? Math.round((stats.wins / stats.totalGames) * 100)
            : 0;
        document.getElementById('winRate').textContent = `${winRate}%`;
    }

    updateStats(result) {
        const stats = JSON.parse(localStorage.getItem('othelloStats')) || {
            totalGames: 0,
            wins: 0,
            draws: 0
        };

        stats.totalGames++;
        if (result === 'black') stats.wins++;
        if (result === 'draw') stats.draws++;

        localStorage.setItem('othelloStats', JSON.stringify(stats));
        this.loadStats();
    }
}

// テーマ初期化
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'dark') {
    document.getElementById('darkIcon').style.display = 'none';
    document.getElementById('lightIcon').style.display = 'block';
}

// ゲーム初期化
const game = new OthelloGame();
