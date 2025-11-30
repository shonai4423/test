// ブロック崩しゲームクラス
class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.difficulties = {
            easy: { ballSpeed: 4, paddleSpeed: 8 },
            normal: { ballSpeed: 6, paddleSpeed: 10 },
            hard: { ballSpeed: 8, paddleSpeed: 12 }
        };

        this.currentDifficulty = 'normal';
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.soundEnabled = true;

        // ゲーム要素
        this.paddle = { width: 120, height: 15, x: 0, y: 0 };
        this.balls = [];
        this.bricks = [];
        this.powerups = [];

        // ゲーム状態
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bricksDestroyed = 0;

        // パワーアップ効果
        this.powerupEffects = {
            expandPaddle: false,
            slowBall: false,
            penetrate: false
        };

        this.mouseX = 0;
        this.keys = {};

        this.initializeUI();
        this.loadStats();
        this.resetGame();
    }

    initializeUI() {
        // ボタンイベント
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

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

        // マウス移動
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        // クリックでボール発射
        this.canvas.addEventListener('click', () => {
            if (!this.gameStarted && !this.gameOver) {
                this.launchBall();
            }
        });

        // キーボード
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    newGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bricksDestroyed = 0;
        this.clearPowerupEffects();
        this.resetGame();
        this.updateDisplay();
        document.getElementById('gameOverlay').classList.remove('active');
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameStatus').textContent = 'マウスで開始';
        this.clearAchievements();
    }

    resetGame() {
        // パドル初期化
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.paddle.y = this.canvas.height - 40;

        // ボール初期化
        this.balls = [{
            x: this.canvas.width / 2,
            y: this.paddle.y - 10,
            radius: 8,
            dx: 0,
            dy: 0,
            launched: false,
            penetrate: false
        }];

        // ブロック生成
        this.createBricks();

        // パワーアップリセット
        this.powerups = [];

        // 描画
        this.draw();
    }

    createBricks() {
        this.bricks = [];
        const brickRowCount = 5 + Math.floor(this.level / 3);
        const brickColumnCount = 10;
        const brickWidth = 70;
        const brickHeight = 25;
        const brickPadding = 5;
        const brickOffsetTop = 60;
        const brickOffsetLeft = (this.canvas.width - (brickColumnCount * (brickWidth + brickPadding))) / 2;

        const brickTypes = [
            { color: '#ef4444', points: 10, hits: 1, powerupChance: 0.1 },  // 赤
            { color: '#f97316', points: 20, hits: 1, powerupChance: 0.15 }, // オレンジ
            { color: '#eab308', points: 30, hits: 1, powerupChance: 0.15 }, // 黄
            { color: '#22c55e', points: 40, hits: 1, powerupChance: 0.2 },  // 緑
            { color: '#3b82f6', points: 50, hits: 1, powerupChance: 0.2 },  // 青
            { color: '#a855f7', points: 60, hits: 1, powerupChance: 0.25 }, // 紫
            { color: '#d1d5db', points: 100, hits: 2, powerupChance: 0.3 }, // 銀
            { color: '#92400e', points: 200, hits: 3, powerupChance: 0.4 }  // 金
        ];

        for (let row = 0; row < brickRowCount; row++) {
            for (let col = 0; col < brickColumnCount; col++) {
                const typeIndex = Math.min(row, brickTypes.length - 1);
                const type = brickTypes[typeIndex];

                const brick = {
                    x: brickOffsetLeft + col * (brickWidth + brickPadding),
                    y: brickOffsetTop + row * (brickHeight + brickPadding),
                    width: brickWidth,
                    height: brickHeight,
                    color: type.color,
                    points: type.points,
                    maxHits: type.hits,
                    hits: type.hits,
                    powerupChance: type.powerupChance,
                    visible: true
                };

                this.bricks.push(brick);
            }
        }
    }

    launchBall() {
        if (this.balls.length > 0 && !this.balls[0].launched) {
            const config = this.difficulties[this.currentDifficulty];
            const angle = (Math.random() * 60 - 30) * Math.PI / 180; // -30° to +30°

            this.balls[0].dx = config.ballSpeed * Math.sin(angle);
            this.balls[0].dy = -config.ballSpeed * Math.cos(angle);
            this.balls[0].launched = true;

            this.gameStarted = true;
            this.gameLoop();
            document.getElementById('gameStatus').textContent = 'プレイ中';
        }
    }

    gameLoop() {
        if (this.gameOver || this.isPaused) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // パドル移動（マウス）
        const config = this.difficulties[this.currentDifficulty];
        const targetX = this.mouseX - this.paddle.width / 2;

        if (Math.abs(this.paddle.x - targetX) > 2) {
            const direction = targetX > this.paddle.x ? 1 : -1;
            this.paddle.x += direction * config.paddleSpeed;
        }

        // パドルを画面内に制限
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));

        // ボール更新
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            if (!ball.launched) {
                // ボールをパドルに追従
                ball.x = this.paddle.x + this.paddle.width / 2;
                ball.y = this.paddle.y - ball.radius;
                continue;
            }

            // ボール移動
            ball.x += ball.dx;
            ball.y += ball.dy;

            // 壁との衝突
            if (ball.x + ball.radius > this.canvas.width || ball.x - ball.radius < 0) {
                ball.dx = -ball.dx;
                this.playSound('wall');
            }

            if (ball.y - ball.radius < 0) {
                ball.dy = -ball.dy;
                this.playSound('wall');
            }

            // パドルとの衝突
            if (ball.dy > 0 &&
                ball.x > this.paddle.x &&
                ball.x < this.paddle.x + this.paddle.width &&
                ball.y + ball.radius > this.paddle.y &&
                ball.y - ball.radius < this.paddle.y + this.paddle.height) {

                // 当たった位置によって角度を変える
                const hitPos = (ball.x - this.paddle.x) / this.paddle.width; // 0 to 1
                const angle = (hitPos - 0.5) * 120 * Math.PI / 180; // -60° to +60°
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

                ball.dx = speed * Math.sin(angle);
                ball.dy = -speed * Math.cos(angle);

                ball.y = this.paddle.y - ball.radius;
                this.playSound('paddle');
            }

            // ブロックとの衝突
            for (let brick of this.bricks) {
                if (!brick.visible) continue;

                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height) {

                    brick.hits--;
                    this.score += brick.points;
                    this.playSound('brick');

                    if (brick.hits <= 0) {
                        brick.visible = false;
                        this.bricksDestroyed++;

                        // パワーアップドロップ
                        if (Math.random() < brick.powerupChance) {
                            this.dropPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        }

                        // 達成項目チェック
                        this.checkAchievements();
                    }

                    // 貫通ボールでない場合は反射
                    if (!ball.penetrate) {
                        ball.dy = -ball.dy;
                    }

                    break;
                }
            }

            // 画面下に落ちた
            if (ball.y - ball.radius > this.canvas.height) {
                this.balls.splice(i, 1);
            }
        }

        // すべてのボールを失った
        if (this.balls.length === 0) {
            this.loseLife();
        }

        // パワーアップ更新
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.y += 3;

            // パドルとの衝突
            if (powerup.x + powerup.radius > this.paddle.x &&
                powerup.x - powerup.radius < this.paddle.x + this.paddle.width &&
                powerup.y + powerup.radius > this.paddle.y &&
                powerup.y - powerup.radius < this.paddle.y + this.paddle.height) {

                this.activatePowerup(powerup.type);
                this.powerups.splice(i, 1);
                this.playSound('powerup');
            }
            // 画面外に出た
            else if (powerup.y - powerup.radius > this.canvas.height) {
                this.powerups.splice(i, 1);
            }
        }

        // レベルクリアチェック
        if (this.bricks.every(brick => !brick.visible)) {
            this.levelComplete();
        }

        this.updateDisplay();
    }

    draw() {
        // 背景
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // ブロック
        for (let brick of this.bricks) {
            if (!brick.visible) continue;

            // グラデーション
            const gradient = this.ctx.createLinearGradient(
                brick.x, brick.y,
                brick.x, brick.y + brick.height
            );
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(1, this.darkenColor(brick.color, 20));

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

            // 枠線
            this.ctx.strokeStyle = this.darkenColor(brick.color, 40);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // 耐久値表示
            if (brick.hits > 1) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 14px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
        }

        // パドル
        const paddleGradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        paddleGradient.addColorStop(0, '#3b82f6');
        paddleGradient.addColorStop(1, '#2563eb');

        this.ctx.fillStyle = paddleGradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // パドルのハイライト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height / 2);

        // ボール
        for (let ball of this.balls) {
            const ballGradient = this.ctx.createRadialGradient(
                ball.x - ball.radius / 3, ball.y - ball.radius / 3, 0,
                ball.x, ball.y, ball.radius
            );

            if (ball.penetrate) {
                ballGradient.addColorStop(0, '#4ade80');
                ballGradient.addColorStop(1, '#22c55e');
            } else {
                ballGradient.addColorStop(0, '#fff');
                ballGradient.addColorStop(1, '#f1f5f9');
            }

            this.ctx.fillStyle = ballGradient;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // パワーアップ
        for (let powerup of this.powerups) {
            this.ctx.fillStyle = powerup.color;
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    dropPowerup(x, y) {
        const types = [
            { type: 'expand', color: '#ef4444' },
            { type: 'slow', color: '#3b82f6' },
            { type: 'multi', color: '#eab308' },
            { type: 'penetrate', color: '#22c55e' }
        ];

        const selected = types[Math.floor(Math.random() * types.length)];

        this.powerups.push({
            x: x,
            y: y,
            radius: 10,
            type: selected.type,
            color: selected.color
        });
    }

    activatePowerup(type) {
        const duration = 10000; // 10秒

        switch (type) {
            case 'expand':
                this.powerupEffects.expandPaddle = true;
                this.paddle.width = 180;
                setTimeout(() => {
                    this.powerupEffects.expandPaddle = false;
                    this.paddle.width = 120;
                }, duration);
                this.addAchievement('🔴 拡大パドル取得！');
                break;

            case 'slow':
                this.powerupEffects.slowBall = true;
                for (let ball of this.balls) {
                    ball.dx *= 0.5;
                    ball.dy *= 0.5;
                }
                setTimeout(() => {
                    this.powerupEffects.slowBall = false;
                    for (let ball of this.balls) {
                        ball.dx *= 2;
                        ball.dy *= 2;
                    }
                }, duration);
                this.addAchievement('🔵 スローボール取得！');
                break;

            case 'multi':
                if (this.balls.length > 0) {
                    const originalBall = this.balls[0];
                    for (let i = 0; i < 2; i++) {
                        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
                        const speed = Math.sqrt(originalBall.dx * originalBall.dx + originalBall.dy * originalBall.dy);

                        this.balls.push({
                            x: originalBall.x,
                            y: originalBall.y,
                            radius: originalBall.radius,
                            dx: speed * Math.sin(angle),
                            dy: -speed * Math.cos(angle),
                            launched: true,
                            penetrate: originalBall.penetrate
                        });
                    }
                }
                this.addAchievement('🟡 マルチボール取得！');
                break;

            case 'penetrate':
                this.powerupEffects.penetrate = true;
                for (let ball of this.balls) {
                    ball.penetrate = true;
                }
                setTimeout(() => {
                    this.powerupEffects.penetrate = false;
                    for (let ball of this.balls) {
                        ball.penetrate = false;
                    }
                }, duration);
                this.addAchievement('🟢 貫通ボール取得！');
                break;
        }
    }

    clearPowerupEffects() {
        this.powerupEffects = {
            expandPaddle: false,
            slowBall: false,
            penetrate: false
        };
        this.paddle.width = 120;
    }

    loseLife() {
        this.lives--;

        if (this.lives <= 0) {
            this.endGame(false);
        } else {
            // ライフ表示更新
            this.updateDisplay();

            // ボールリセット
            const config = this.difficulties[this.currentDifficulty];
            this.balls = [{
                x: this.paddle.x + this.paddle.width / 2,
                y: this.paddle.y - 10,
                radius: 8,
                dx: 0,
                dy: 0,
                launched: false,
                penetrate: false
            }];

            this.playSound('lose');
            document.getElementById('gameStatus').textContent = 'クリックして再開';
        }
    }

    levelComplete() {
        this.level++;
        this.addAchievement(`🎉 レベル${this.level - 1}クリア！`);
        this.playSound('levelup');

        // 次のレベルへ
        setTimeout(() => {
            this.resetGame();
            this.updateDisplay();
        }, 1000);
    }

    endGame(won) {
        this.gameOver = true;
        this.gameStarted = false;

        if (won) {
            document.getElementById('overlayEmoji').textContent = '🎉';
            document.getElementById('overlayTitle').textContent = 'クリア！';
        } else {
            document.getElementById('overlayEmoji').textContent = '💔';
            document.getElementById('overlayTitle').textContent = 'ゲームオーバー';
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverlay').classList.add('active');
        document.getElementById('pauseBtn').disabled = true;

        this.updateStats();
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            document.getElementById('gameStatus').textContent = '一時停止中';
            document.getElementById('pauseBtn').innerHTML = '<span style="font-size: 1.25rem;">▶️</span><span>再開</span>';
        } else {
            document.getElementById('gameStatus').textContent = 'プレイ中';
            document.getElementById('pauseBtn').innerHTML = '<span style="font-size: 1.25rem;">⏸️</span><span>一時停止</span>';
            this.gameLoop();
        }
    }

    updateDisplay() {
        // スコア
        document.getElementById('score').textContent = this.score;

        // ライフ
        const livesDisplay = document.getElementById('lives');
        livesDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const icon = document.createElement('span');
            icon.className = 'life-icon';
            icon.textContent = '❤️';
            if (i >= this.lives) {
                icon.classList.add('lost');
            }
            livesDisplay.appendChild(icon);
        }

        // レベル
        document.getElementById('level').textContent = this.level;

        // レベル進捗（破壊したブロック数）
        const totalBricks = this.bricks.length;
        const destroyedBricks = this.bricks.filter(b => !b.visible).length;
        const progress = totalBricks > 0 ? (destroyedBricks / totalBricks) * 100 : 0;
        document.getElementById('levelProgress').style.width = `${progress}%`;
    }

    checkAchievements() {
        // スコアマイルストーン
        if (this.score === 1000) {
            this.addAchievement('🎯 スコア1000達成！');
        } else if (this.score === 5000) {
            this.addAchievement('🎯 スコア5000達成！');
        } else if (this.score === 10000) {
            this.addAchievement('🎯 スコア10000達成！');
        }

        // ブロック破壊数
        if (this.bricksDestroyed === 50) {
            this.addAchievement('💥 50ブロック破壊！');
        } else if (this.bricksDestroyed === 100) {
            this.addAchievement('💥 100ブロック破壊！');
        }
    }

    addAchievement(text) {
        const list = document.getElementById('achievementsList');

        // プレースホルダーを削除
        const placeholder = list.querySelector('.achievement-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.textContent = text;
        list.insertBefore(item, list.firstChild);

        // 5個を超えたら古いものを削除
        while (list.children.length > 5) {
            list.removeChild(list.lastChild);
        }
    }

    clearAchievements() {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '<div class="achievement-placeholder">まだ達成項目なし</div>';
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
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
            case 'paddle':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'brick':
                oscillator.frequency.value = 880;
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'wall':
                oscillator.frequency.value = 330;
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.08);
                break;
            case 'powerup':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'lose':
                oscillator.frequency.value = 130.81;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'levelup':
                oscillator.frequency.value = 523.25;
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('breakoutStats')) || {
            highScore: 0,
            maxLevel: 1,
            totalGames: 0,
            totalClears: 0
        };

        document.getElementById('highScore').textContent = stats.highScore;
        document.getElementById('maxLevel').textContent = stats.maxLevel;
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('totalClears').textContent = stats.totalClears;
    }

    updateStats() {
        const stats = JSON.parse(localStorage.getItem('breakoutStats')) || {
            highScore: 0,
            maxLevel: 1,
            totalGames: 0,
            totalClears: 0
        };

        stats.totalGames++;

        if (this.score > stats.highScore) {
            stats.highScore = this.score;
            this.addAchievement('🏆 新記録達成！');
        }

        if (this.level > stats.maxLevel) {
            stats.maxLevel = this.level;
        }

        localStorage.setItem('breakoutStats', JSON.stringify(stats));
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
const game = new BreakoutGame();
