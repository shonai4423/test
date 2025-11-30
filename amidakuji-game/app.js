class AmidakujiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.soundEnabled = true;
        this.lineCount = 5;
        this.ladderCount = 10;

        this.options = ['A', 'B', 'C', 'D', 'E'];
        this.prizes = ['1等', '2等', '3等', '4等', '5等'];

        this.ladders = [];
        this.paths = [];
        this.animating = false;
        this.selectedLine = -1;

        this.initializeUI();
        this.setupCanvas();
        this.generateLadders();
        this.draw();
    }

    initializeUI() {
        document.getElementById('lineCount').addEventListener('change', (e) => {
            this.lineCount = parseInt(e.target.value);
            this.updateOptions();
            this.generateLadders();
            this.draw();
        });

        document.getElementById('ladderCount').addEventListener('change', (e) => {
            this.ladderCount = parseInt(e.target.value);
            this.generateLadders();
            this.draw();
        });

        document.getElementById('generateBtn').addEventListener('click', () => this.generateLadders());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        this.updateOptions();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 40;

        this.canvas.width = Math.min(800, maxWidth);
        this.canvas.height = Math.min(600, maxHeight);
    }

    updateOptions() {
        const defaultOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const defaultPrizes = ['1等', '2等', '3等', '4等', '5等', '6等', '7等', '8等'];

        this.options = defaultOptions.slice(0, this.lineCount);
        this.prizes = defaultPrizes.slice(0, this.lineCount);

        // オプション入力欄を生成
        const optionInputs = document.getElementById('optionInputs');
        optionInputs.innerHTML = '';

        this.options.forEach((option, i) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'option-input';
            input.value = option;
            input.placeholder = `選択肢 ${i + 1}`;
            input.addEventListener('input', (e) => {
                this.options[i] = e.target.value;
                this.draw();
            });
            optionInputs.appendChild(input);
        });

        // 景品入力欄を生成
        const prizeInputs = document.getElementById('prizeInputs');
        prizeInputs.innerHTML = '';

        this.prizes.forEach((prize, i) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'prize-input';
            input.value = prize;
            input.placeholder = `景品 ${i + 1}`;
            input.addEventListener('input', (e) => {
                this.prizes[i] = e.target.value;
                this.draw();
            });
            prizeInputs.appendChild(input);
        });
    }

    generateLadders() {
        this.ladders = [];
        this.selectedLine = -1;
        this.hideResult();

        const spacing = this.canvas.width / (this.lineCount + 1);
        const startY = 100;
        const endY = this.canvas.height - 100;
        const sectionHeight = (endY - startY) / (this.ladderCount + 1);

        // 各セクションにランダムに横線を配置
        for (let section = 1; section <= this.ladderCount; section++) {
            const y = startY + section * sectionHeight;
            const availablePositions = [];

            for (let i = 0; i < this.lineCount - 1; i++) {
                availablePositions.push(i);
            }

            // ランダムに横線を配置（約50%の確率）
            availablePositions.forEach(pos => {
                if (Math.random() > 0.5) {
                    this.ladders.push({
                        from: pos,
                        to: pos + 1,
                        y: y
                    });
                }
            });
        }

        this.playSound('generate');
        this.draw();
    }

    handleCanvasClick(e) {
        if (this.animating) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const spacing = this.canvas.width / (this.lineCount + 1);
        const startY = 100;

        // 上部の選択肢をクリックしたか判定
        if (y < startY) {
            for (let i = 0; i < this.lineCount; i++) {
                const lineX = (i + 1) * spacing;
                if (Math.abs(x - lineX) < 30) {
                    this.selectedLine = i;
                    this.animatePath(i);
                    break;
                }
            }
        }
    }

    animatePath(startLine) {
        this.animating = true;
        this.paths = [];

        const spacing = this.canvas.width / (this.lineCount + 1);
        const startY = 100;
        const endY = this.canvas.height - 100;

        let currentLine = startLine;
        let currentY = startY;

        this.paths.push({ x: (currentLine + 1) * spacing, y: currentY });

        // パスを計算
        const sortedLadders = [...this.ladders].sort((a, b) => a.y - b.y);

        for (const ladder of sortedLadders) {
            if (currentY < ladder.y) {
                // 横線まで縦に移動
                this.paths.push({ x: (currentLine + 1) * spacing, y: ladder.y });
                currentY = ladder.y;
            }

            // 横線を渡る
            if (ladder.from === currentLine) {
                currentLine = ladder.to;
                this.paths.push({ x: (currentLine + 1) * spacing, y: currentY });
            } else if (ladder.to === currentLine) {
                currentLine = ladder.from;
                this.paths.push({ x: (currentLine + 1) * spacing, y: currentY });
            }
        }

        // 最後まで縦に移動
        this.paths.push({ x: (currentLine + 1) * spacing, y: endY });

        // アニメーション
        let pathIndex = 0;
        const animateStep = () => {
            if (pathIndex < this.paths.length) {
                this.draw(pathIndex);
                pathIndex++;
                this.playSound('move');
                setTimeout(animateStep, 100);
            } else {
                this.animating = false;
                this.showResult(currentLine);
            }
        };

        animateStep();
    }

    draw(pathProgress = 0) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const spacing = this.canvas.width / (this.lineCount + 1);
        const startY = 100;
        const endY = this.canvas.height - 100;

        // 縦線を描画
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim();
        ctx.lineWidth = 3;

        for (let i = 0; i < this.lineCount; i++) {
            const x = (i + 1) * spacing;

            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();

            // 上部の選択肢
            ctx.fillStyle = i === this.selectedLine ? '#3b82f6' :
                getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.options[i], x, startY - 20);

            // 選択可能な円
            if (i === this.selectedLine) {
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(x, startY - 40, 25, 0, Math.PI * 2);
                ctx.fill();
            }

            // 下部の景品
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-primary').trim();
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(this.prizes[i], x, endY + 35);
        }

        // 横線を描画
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        this.ladders.forEach(ladder => {
            const x1 = (ladder.from + 1) * spacing;
            const x2 = (ladder.to + 1) * spacing;

            ctx.beginPath();
            ctx.moveTo(x1, ladder.y);
            ctx.lineTo(x2, ladder.y);
            ctx.stroke();
        });

        // パスを描画（アニメーション中）
        if (pathProgress > 0 && this.paths.length > 0) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(this.paths[0].x, this.paths[0].y);

            for (let i = 1; i <= Math.min(pathProgress, this.paths.length - 1); i++) {
                ctx.lineTo(this.paths[i].x, this.paths[i].y);
            }

            ctx.stroke();

            // 現在位置を示す円
            if (pathProgress < this.paths.length) {
                const currentPos = this.paths[pathProgress];
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(currentPos.x, currentPos.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    showResult(resultLine) {
        const resultPanel = document.getElementById('resultPanel');
        const resultText = document.getElementById('resultText');

        resultText.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>${this.options[this.selectedLine]}</strong> を選びました
            </div>
            <div style="font-size: 2rem; margin: 1rem 0;">
                ↓
            </div>
            <div style="font-size: 2rem;">
                🎉 <strong>${this.prizes[resultLine]}</strong> 🎉
            </div>
        `;

        resultPanel.style.display = 'block';
        this.playSound('result');
    }

    hideResult() {
        document.getElementById('resultPanel').style.display = 'none';
    }

    reset() {
        this.selectedLine = -1;
        this.paths = [];
        this.hideResult();
        this.draw();
        this.playSound('reset');
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

        this.draw();
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'generate':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'move':
                oscillator.frequency.value = 523.25;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'result':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'reset':
                oscillator.frequency.value = 329.63;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
        }
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
const game = new AmidakujiGame();

// リサイズ対応
window.addEventListener('resize', () => {
    game.setupCanvas();
    game.draw();
});
