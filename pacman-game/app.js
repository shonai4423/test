// パックマンゲームクラス
class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.tileSize = 20;
        this.cols = 28;
        this.rows = 31;

        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.soundEnabled = true;

        // ゲーム状態
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.dotsEaten = 0;
        this.totalDotsEaten = 0;
        this.ghostsEatenCount = 0;

        // パワーモード
        this.powerMode = false;
        this.powerTimer = 0;
        this.powerDuration = 10;

        // プレイヤー
        this.pacman = {
            x: 14,
            y: 23,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            mouthOpen: 0,
            speed: 0.15
        };

        // ゴースト
        this.ghosts = [];

        // マップとドット
        this.map = [];
        this.dots = [];
        this.powerPellets = [];
        this.fruits = [];

        // キー入力
        this.keys = {};

        // ゲームループ
        this.lastTime = 0;
        this.gameLoop = null;

        this.initializeUI();
        this.loadStats();
        this.createMap();
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

        // モーダル
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        document.addEventListener('keypress', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
                e.preventDefault();
            }
        });

        // キーボード
        document.addEventListener('keydown', (e) => {
            // 矢印キーの場合はデフォルト動作（スクロール）を防止
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
                e.preventDefault();
            }

            this.keys[e.key] = true;

            if (e.key === ' ') {
                this.togglePause();
            }

            if (!this.gameStarted && !this.gameOver) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.startGame();
                }
            }

            // 方向キー
            if (e.key === 'ArrowUp') {
                this.pacman.nextDirection = { x: 0, y: -1 };
            } else if (e.key === 'ArrowDown') {
                this.pacman.nextDirection = { x: 0, y: 1 };
            } else if (e.key === 'ArrowLeft') {
                this.pacman.nextDirection = { x: -1, y: 0 };
            } else if (e.key === 'ArrowRight') {
                this.pacman.nextDirection = { x: 1, y: 0 };
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    createMap() {
        // シンプルな迷路マップ（0=壁、1=通路）
        this.map = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
            [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,0,0,0,2,2,0,0,0,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,0,2,2,2,2,2,2,0,1,0,0,1,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,0,2,2,2,2,2,2,0,1,1,1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,1,0,0,1,0,2,2,2,2,2,2,0,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
            [0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,0],
            [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
            [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
            [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
            [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
    }

    resetGame() {
        // パックマンリセット
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = { x: 0, y: 0 };
        this.pacman.nextDirection = { x: 0, y: 0 };

        // ゴーストリセット
        this.ghosts = [
            { x: 13.5, y: 14, color: '#ef4444', name: 'Blinky', direction: { x: -1, y: 0 }, mode: 'chase', scared: false, eaten: false, startDelay: 0 },
            { x: 13.5, y: 14, color: '#ec4899', name: 'Pinky', direction: { x: 1, y: 0 }, mode: 'scatter', scared: false, eaten: false, startDelay: 2000 },
            { x: 13.5, y: 14, color: '#06b6d4', name: 'Inky', direction: { x: 0, y: -1 }, mode: 'scatter', scared: false, eaten: false, startDelay: 4000 },
            { x: 13.5, y: 14, color: '#f97316', name: 'Clyde', direction: { x: 0, y: 1 }, mode: 'scatter', scared: false, eaten: false, startDelay: 6000 }
        ];

        // ドット配置
        this.dots = [];
        this.powerPellets = [];

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === 1) {
                    // パワーペレット（4隅）
                    if ((x === 1 && y === 1) || (x === 26 && y === 1) ||
                        (x === 1 && y === 23) || (x === 26 && y === 23)) {
                        this.powerPellets.push({ x, y });
                    } else {
                        this.dots.push({ x, y });
                    }
                }
            }
        }

        this.dotsEaten = 0;
        this.fruits = [];
        this.powerMode = false;
        this.powerTimer = 0;

        this.draw();
        this.updateGhostStatus();
    }

    newGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.totalDotsEaten = 0;
        this.ghostsEatenCount = 0;

        this.resetGame();
        this.updateDisplay();
        document.getElementById('gameOverlay').classList.remove('active');
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameStatus').textContent = '矢印キーで開始';
        this.clearAchievements();
    }

    startGame() {
        if (this.gameStarted || this.gameOver) return;

        this.gameStarted = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        document.getElementById('gameStatus').textContent = 'プレイ中';
        document.getElementById('pauseBtn').disabled = false;
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

        const deltaTime = (currentTime - this.lastTime) / 16.67; // 60FPSを基準
        this.lastTime = currentTime;

        // パワーモードタイマー
        if (this.powerMode) {
            this.powerTimer -= deltaTime / 60;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.powerTimer = 0;
                this.ghosts.forEach(ghost => {
                    if (!ghost.eaten) {
                        ghost.scared = false;
                    }
                });
            }
        }

        // パックマン移動
        this.movePacman(deltaTime);

        // ゴースト移動
        this.moveGhosts(deltaTime, currentTime);

        // 衝突判定
        this.checkCollisions();

        // 描画
        this.draw();

        // レベルクリアチェック
        if (this.dots.length === 0 && this.powerPellets.length === 0) {
            this.levelComplete();
        }

        this.updateDisplay();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }

    movePacman(deltaTime) {
        // 次の方向に曲がれるかチェック
        const nextX = this.pacman.x + this.pacman.nextDirection.x * this.pacman.speed * deltaTime;
        const nextY = this.pacman.y + this.pacman.nextDirection.y * this.pacman.speed * deltaTime;

        if (this.canMove(nextX, nextY)) {
            this.pacman.direction = { ...this.pacman.nextDirection };
        }

        // 現在の方向に移動
        const newX = this.pacman.x + this.pacman.direction.x * this.pacman.speed * deltaTime;
        const newY = this.pacman.y + this.pacman.direction.y * this.pacman.speed * deltaTime;

        if (this.canMove(newX, newY)) {
            this.pacman.x = newX;
            this.pacman.y = newY;

            // トンネル処理
            if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
            if (this.pacman.x >= this.cols) this.pacman.x = 0;
        }

        // 口のアニメーション
        this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.1 * deltaTime) % 1;
    }

    moveGhosts(deltaTime, currentTime) {
        const speed = 0.1 + (this.level - 1) * 0.01;

        this.ghosts.forEach(ghost => {
            // スタート遅延
            if (ghost.startDelay > 0) {
                ghost.startDelay -= deltaTime * 16.67;
                return;
            }

            // 食べられた後の復帰
            if (ghost.eaten) {
                const homeX = 13.5;
                const homeY = 14;
                const dx = homeX - ghost.x;
                const dy = homeY - ghost.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 0.5) {
                    ghost.eaten = false;
                    ghost.scared = false;
                } else {
                    ghost.x += (dx / distance) * speed * 2 * deltaTime;
                    ghost.y += (dy / distance) * speed * 2 * deltaTime;
                }
                return;
            }

            const ghostSpeed = ghost.scared ? speed * 0.5 : speed;

            // 新しい方向を決定
            if (Math.random() < 0.02 || !this.canMove(
                ghost.x + ghost.direction.x * ghostSpeed * deltaTime,
                ghost.y + ghost.direction.y * ghostSpeed * deltaTime
            )) {
                const directions = [
                    { x: 0, y: -1 }, { x: 0, y: 1 },
                    { x: -1, y: 0 }, { x: 1, y: 0 }
                ];

                // 怖がっている時はランダム
                if (ghost.scared) {
                    ghost.direction = directions[Math.floor(Math.random() * directions.length)];
                } else {
                    // パックマンを追跡
                    const dx = this.pacman.x - ghost.x;
                    const dy = this.pacman.y - ghost.y;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        ghost.direction = { x: dx > 0 ? 1 : -1, y: 0 };
                    } else {
                        ghost.direction = { x: 0, y: dy > 0 ? 1 : -1 };
                    }
                }
            }

            // 移動
            const newX = ghost.x + ghost.direction.x * ghostSpeed * deltaTime;
            const newY = ghost.y + ghost.direction.y * ghostSpeed * deltaTime;

            if (this.canMove(newX, newY, true)) {
                ghost.x = newX;
                ghost.y = newY;
            }

            // トンネル処理
            if (ghost.x < 0) ghost.x = this.cols - 1;
            if (ghost.x >= this.cols) ghost.x = 0;
        });
    }

    canMove(x, y, isGhost = false) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileY < 0 || tileY >= this.rows || tileX < 0 || tileX >= this.cols) {
            return true; // トンネル
        }

        const tile = this.map[tileY][tileX];
        return tile === 1 || (isGhost && tile === 2);
    }

    checkCollisions() {
        const px = Math.floor(this.pacman.x);
        const py = Math.floor(this.pacman.y);

        // ドット
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            if (dot.x === px && dot.y === py) {
                this.dots.splice(i, 1);
                this.score += 10;
                this.dotsEaten++;
                this.totalDotsEaten++;
                this.playSound('dot');

                // フルーツ出現
                if (this.dotsEaten === 70 || this.dotsEaten === 170) {
                    this.spawnFruit();
                }

                // 達成項目
                if (this.totalDotsEaten === 100) {
                    this.addAchievement('⚪ ドット100個達成！');
                } else if (this.totalDotsEaten === 500) {
                    this.addAchievement('⚪ ドット500個達成！');
                }
            }
        }

        // パワーペレット
        for (let i = this.powerPellets.length - 1; i >= 0; i--) {
            const pellet = this.powerPellets[i];
            if (pellet.x === px && pellet.y === py) {
                this.powerPellets.splice(i, 1);
                this.score += 50;
                this.activatePowerMode();
                this.playSound('powerup');
            }
        }

        // フルーツ
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            if (Math.floor(fruit.x) === px && Math.floor(fruit.y) === py) {
                this.score += fruit.points;
                this.addAchievement(`${fruit.icon} ${fruit.name}取得！ +${fruit.points}点`);
                this.fruits.splice(i, 1);
                this.playSound('fruit');
            }
        }

        // ゴースト
        this.ghosts.forEach(ghost => {
            const distance = Math.sqrt(
                Math.pow(ghost.x - this.pacman.x, 2) +
                Math.pow(ghost.y - this.pacman.y, 2)
            );

            if (distance < 0.5) {
                if (ghost.scared && !ghost.eaten) {
                    // ゴーストを食べる
                    ghost.eaten = true;
                    ghost.scared = false;
                    const points = 200 * Math.pow(2, this.ghostsEatenInPowerMode);
                    this.score += points;
                    this.ghostsEatenCount++;
                    this.ghostsEatenInPowerMode++;
                    this.addAchievement(`👻 ${ghost.name}撃退！ +${points}点`);
                    this.playSound('eatghost');
                } else if (!ghost.eaten) {
                    // パックマンが死ぬ
                    this.loseLife();
                }
            }
        });
    }

    activatePowerMode() {
        this.powerMode = true;
        this.powerTimer = this.powerDuration;
        this.ghostsEatenInPowerMode = 0;

        this.ghosts.forEach(ghost => {
            if (!ghost.eaten) {
                ghost.scared = true;
                ghost.direction.x = -ghost.direction.x;
                ghost.direction.y = -ghost.direction.y;
            }
        });

        this.addAchievement('🔵 パワーモード発動！');
    }

    spawnFruit() {
        const fruits = [
            { icon: '🍒', name: 'チェリー', points: 100 },
            { icon: '🍓', name: 'イチゴ', points: 300 },
            { icon: '🍊', name: 'オレンジ', points: 500 },
            { icon: '🍎', name: 'リンゴ', points: 700 },
            { icon: '🍇', name: 'ブドウ', points: 1000 }
        ];

        const fruitIndex = Math.min(this.level - 1, fruits.length - 1);
        const fruit = { ...fruits[fruitIndex], x: 14, y: 17, duration: 10 };

        this.fruits.push(fruit);

        setTimeout(() => {
            const index = this.fruits.indexOf(fruit);
            if (index !== -1) {
                this.fruits.splice(index, 1);
            }
        }, fruit.duration * 1000);
    }

    loseLife() {
        this.lives--;
        this.playSound('death');

        if (this.lives <= 0) {
            this.endGame();
        } else {
            // リセット
            this.pacman.x = 14;
            this.pacman.y = 23;
            this.pacman.direction = { x: 0, y: 0 };
            this.pacman.nextDirection = { x: 0, y: 0 };

            this.ghosts.forEach((ghost, i) => {
                ghost.x = 13.5;
                ghost.y = 14;
                ghost.scared = false;
                ghost.eaten = false;
                ghost.startDelay = i * 2000;
            });

            this.powerMode = false;
            this.powerTimer = 0;

            this.updateDisplay();
        }
    }

    levelComplete() {
        this.level++;
        this.addAchievement(`🎉 レベル${this.level - 1}クリア！`);
        this.playSound('levelup');

        setTimeout(() => {
            this.resetGame();
            this.updateDisplay();
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
        }, 2000);
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;

        document.getElementById('overlayEmoji').textContent = '💀';
        document.getElementById('overlayTitle').textContent = 'ゲームオーバー';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('dotsEaten').textContent = this.totalDotsEaten;
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
        }
    }

    draw() {
        // 背景
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // マップ
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.map[y][x];

                if (tile === 0) {
                    // 壁
                    this.ctx.fillStyle = '#2563eb';
                    this.ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    this.ctx.strokeStyle = '#1e40af';
                    this.ctx.strokeRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }

        // ドット
        this.ctx.fillStyle = '#fff';
        this.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                (dot.x + 0.5) * this.tileSize,
                (dot.y + 0.5) * this.tileSize,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // パワーペレット
        const pelletPulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(59, 130, 246, ${pelletPulse})`;
        this.powerPellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                (pellet.x + 0.5) * this.tileSize,
                (pellet.y + 0.5) * this.tileSize,
                6,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // フルーツ
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.fruits.forEach(fruit => {
            this.ctx.fillText(
                fruit.icon,
                (fruit.x + 0.5) * this.tileSize,
                (fruit.y + 0.5) * this.tileSize
            );
        });

        // ゴースト
        this.ghosts.forEach(ghost => {
            if (ghost.eaten) {
                // 目だけ
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(
                    (ghost.x + 0.5) * this.tileSize,
                    (ghost.y + 0.5) * this.tileSize,
                    8,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = ghost.scared ? '#3b82f6' : ghost.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    (ghost.x + 0.5) * this.tileSize,
                    (ghost.y + 0.3) * this.tileSize,
                    8,
                    Math.PI,
                    0
                );
                this.ctx.lineTo((ghost.x + 0.5) * this.tileSize + 8, (ghost.y + 0.7) * this.tileSize);
                this.ctx.lineTo((ghost.x + 0.5) * this.tileSize + 4, (ghost.y + 0.5) * this.tileSize);
                this.ctx.lineTo((ghost.x + 0.5) * this.tileSize, (ghost.y + 0.7) * this.tileSize);
                this.ctx.lineTo((ghost.x + 0.5) * this.tileSize - 4, (ghost.y + 0.5) * this.tileSize);
                this.ctx.lineTo((ghost.x + 0.5) * this.tileSize - 8, (ghost.y + 0.7) * this.tileSize);
                this.ctx.closePath();
                this.ctx.fill();

                // 目
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(
                    (ghost.x + 0.35) * this.tileSize,
                    (ghost.y + 0.4) * this.tileSize,
                    3, 0, Math.PI * 2
                );
                this.ctx.arc(
                    (ghost.x + 0.65) * this.tileSize,
                    (ghost.y + 0.4) * this.tileSize,
                    3, 0, Math.PI * 2
                );
                this.ctx.fill();

                if (!ghost.scared) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        (ghost.x + 0.35) * this.tileSize,
                        (ghost.y + 0.4) * this.tileSize,
                        1.5, 0, Math.PI * 2
                    );
                    this.ctx.arc(
                        (ghost.x + 0.65) * this.tileSize,
                        (ghost.y + 0.4) * this.tileSize,
                        1.5, 0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        });

        // パックマン
        const mouthAngle = this.pacman.mouthOpen > 0.5 ? 0.4 : 0.2;
        let rotation = 0;
        if (this.pacman.direction.x === 1) rotation = 0;
        else if (this.pacman.direction.x === -1) rotation = Math.PI;
        else if (this.pacman.direction.y === 1) rotation = Math.PI / 2;
        else if (this.pacman.direction.y === -1) rotation = -Math.PI / 2;

        this.ctx.save();
        this.ctx.translate(
            (this.pacman.x + 0.5) * this.tileSize,
            (this.pacman.y + 0.5) * this.tileSize
        );
        this.ctx.rotate(rotation);

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 9, mouthAngle, Math.PI * 2 - mouthAngle);
        this.ctx.lineTo(0, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
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
            icon.textContent = '🟡';
            if (i >= this.lives) {
                icon.classList.add('lost');
            }
            livesDisplay.appendChild(icon);
        }

        // レベル
        document.getElementById('level').textContent = this.level;

        // ゴーストスピード
        const speedPercent = Math.min(100, 10 + (this.level - 1) * 10);
        document.getElementById('ghostSpeed').style.width = `${speedPercent}%`;

        // パワータイマー
        document.getElementById('powerTimer').textContent = Math.ceil(this.powerTimer);
    }

    updateGhostStatus() {
        this.ghosts.forEach((ghost, i) => {
            const statusEl = document.getElementById(`${ghost.name.toLowerCase()}Status`);
            if (ghost.eaten) {
                statusEl.textContent = '復帰中';
                statusEl.className = 'ghost-status eaten';
            } else if (ghost.scared) {
                statusEl.textContent = '怯え';
                statusEl.className = 'ghost-status scared';
            } else {
                statusEl.textContent = ghost.mode === 'chase' ? '追跡' : '待機';
                statusEl.className = 'ghost-status';
            }
        });
    }

    addAchievement(text) {
        const list = document.getElementById('achievementsList');
        const placeholder = list.querySelector('.achievement-placeholder');
        if (placeholder) placeholder.remove();

        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.textContent = text;
        list.insertBefore(item, list.firstChild);

        while (list.children.length > 5) {
            list.removeChild(list.lastChild);
        }
    }

    clearAchievements() {
        const list = document.getElementById('achievementsList');
        list.innerHTML = '<div class="achievement-placeholder">まだ達成項目なし</div>';
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
            case 'dot':
                oscillator.frequency.value = 880;
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'powerup':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'eatghost':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'fruit':
                oscillator.frequency.value = 1046.5;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.25);
                break;
            case 'death':
                oscillator.frequency.value = 220;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
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
        const stats = JSON.parse(localStorage.getItem('pacmanStats')) || {
            highScore: 0,
            maxLevel: 1,
            totalGames: 0,
            totalDots: 0,
            ghostsEaten: 0
        };

        document.getElementById('highScore').textContent = stats.highScore;
        document.getElementById('maxLevel').textContent = stats.maxLevel;
        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('totalDots').textContent = stats.totalDots;
        document.getElementById('ghostsEaten').textContent = stats.ghostsEaten;
    }

    updateStats() {
        const stats = JSON.parse(localStorage.getItem('pacmanStats')) || {
            highScore: 0,
            maxLevel: 1,
            totalGames: 0,
            totalDots: 0,
            ghostsEaten: 0
        };

        stats.totalGames++;
        stats.totalDots += this.totalDotsEaten;
        stats.ghostsEaten += this.ghostsEatenCount;

        if (this.score > stats.highScore) {
            stats.highScore = this.score;
            this.addAchievement('🏆 新記録達成！');
        }

        if (this.level > stats.maxLevel) {
            stats.maxLevel = this.level;
        }

        localStorage.setItem('pacmanStats', JSON.stringify(stats));
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
const game = new PacmanGame();
