class OmikujiGame {
    constructor() {
        this.soundEnabled = true;
        this.history = [];

        this.fortunes = {
            '大吉': {
                rank: '大吉',
                color: '#dc2626',
                message: '最高の運勢です！何事も順調に進むでしょう。',
                probability: 10
            },
            '中吉': {
                rank: '中吉',
                color: '#f97316',
                message: 'とても良い運勢です。積極的に行動しましょう。',
                probability: 15
            },
            '小吉': {
                rank: '小吉',
                color: '#f59e0b',
                message: '良い運勢です。チャンスを逃さないように。',
                probability: 20
            },
            '吉': {
                rank: '吉',
                color: '#10b981',
                message: '普通の運勢です。努力が実を結ぶでしょう。',
                probability: 25
            },
            '末吉': {
                rank: '末吉',
                color: '#3b82f6',
                message: 'これから良くなる運勢です。焦らず進みましょう。',
                probability: 15
            },
            '凶': {
                rank: '凶',
                color: '#6b7280',
                message: '注意が必要です。慎重に行動しましょう。',
                probability: 10
            },
            '大凶': {
                rank: '大凶',
                color: '#1f2937',
                message: '特に注意が必要です。無理せず様子を見ましょう。',
                probability: 5
            }
        };

        this.luckyItems = [
            { icon: '📱', name: 'スマートフォン' },
            { icon: '📚', name: '本' },
            { icon: '☕', name: 'コーヒー' },
            { icon: '🎵', name: '音楽' },
            { icon: '🌸', name: '花' },
            { icon: '🍀', name: '四つ葉のクローバー' },
            { icon: '💎', name: '宝石' },
            { icon: '🎨', name: 'アート' },
            { icon: '📷', name: 'カメラ' },
            { icon: '🎁', name: 'プレゼント' }
        ];

        this.luckyColors = [
            { name: '赤', hex: '#ef4444' },
            { name: 'オレンジ', hex: '#f97316' },
            { name: '黄色', hex: '#fbbf24' },
            { name: '緑', hex: '#10b981' },
            { name: '青', hex: '#3b82f6' },
            { name: '紫', hex: '#8b5cf6' },
            { name: 'ピンク', hex: '#ec4899' },
            { name: '白', hex: '#f8fafc' },
            { name: '金', hex: '#d4af37' },
            { name: '銀', hex: '#c0c0c0' }
        ];

        this.initializeUI();
        this.loadHistory();
    }

    initializeUI() {
        document.getElementById('drawBtn').addEventListener('click', () => this.drawFortune());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
    }

    drawFortune() {
        this.playSound('draw');

        // アニメーション: おみくじ箱を揺らす
        const shrineBox = document.getElementById('shrineBox');
        shrineBox.style.animation = 'shake 0.5s';
        setTimeout(() => {
            shrineBox.style.animation = '';
        }, 500);

        // おみくじを抽選
        setTimeout(() => {
            const fortune = this.selectFortune();
            this.displayFortune(fortune);
            this.addToHistory(fortune);
            this.playSound('result');
        }, 600);
    }

    selectFortune() {
        // 確率に基づいて選択
        const totalProbability = Object.values(this.fortunes).reduce((sum, f) => sum + f.probability, 0);
        let random = Math.random() * totalProbability;

        for (const [key, fortune] of Object.entries(this.fortunes)) {
            random -= fortune.probability;
            if (random <= 0) {
                return {
                    ...fortune,
                    money: this.getRandomRating(),
                    love: this.getRandomRating(),
                    work: this.getRandomRating(),
                    health: this.getRandomRating(),
                    luckyItem: this.luckyItems[Math.floor(Math.random() * this.luckyItems.length)],
                    luckyColor: this.luckyColors[Math.floor(Math.random() * this.luckyColors.length)]
                };
            }
        }

        return this.fortunes['吉'];
    }

    getRandomRating() {
        const ratings = ['★★★★★', '★★★★☆', '★★★☆☆', '★★☆☆☆', '★☆☆☆☆'];
        return ratings[Math.floor(Math.random() * ratings.length)];
    }

    displayFortune(fortune) {
        const fortunePaper = document.getElementById('fortunePaper');
        const fortuneRank = document.getElementById('fortuneRank');
        const fortuneMessage = document.getElementById('fortuneMessage');
        const fortuneDetails = document.getElementById('fortuneDetails');

        // アニメーションをリセット
        fortunePaper.classList.remove('show');
        setTimeout(() => {
            fortunePaper.classList.add('show');
        }, 10);

        // 運勢を表示
        fortuneRank.textContent = fortune.rank;
        fortuneRank.style.color = fortune.color;

        fortuneMessage.textContent = fortune.message;

        fortuneDetails.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">金運</span>
                <span class="detail-value">${fortune.money}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">恋愛運</span>
                <span class="detail-value">${fortune.love}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">仕事運</span>
                <span class="detail-value">${fortune.work}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">健康運</span>
                <span class="detail-value">${fortune.health}</span>
            </div>
        `;

        // サイドパネルを更新
        document.getElementById('money').textContent = fortune.money;
        document.getElementById('love').textContent = fortune.love;
        document.getElementById('work').textContent = fortune.work;
        document.getElementById('health').textContent = fortune.health;

        // ラッキーアイテム
        const luckyItemEl = document.getElementById('luckyItem');
        luckyItemEl.innerHTML = `
            <div class="item-icon">${fortune.luckyItem.icon}</div>
            <div class="item-name">${fortune.luckyItem.name}</div>
        `;

        // ラッキーカラー
        const luckyColorEl = document.getElementById('luckyColor');
        luckyColorEl.innerHTML = `
            <div class="color-preview" style="background: ${fortune.luckyColor.hex};"></div>
            <div class="color-name">${fortune.luckyColor.name}</div>
        `;
    }

    addToHistory(fortune) {
        const now = new Date();
        const historyItem = {
            rank: fortune.rank,
            color: fortune.color,
            date: now.toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        this.history.unshift(historyItem);
        if (this.history.length > 10) {
            this.history.pop();
        }

        this.saveHistory();
        this.displayHistory();
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-placeholder">まだ引いていません</div>';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-rank" style="color: ${item.color};">${item.rank}</span>
                <span class="history-date">${item.date}</span>
            </div>
        `).join('');
    }

    saveHistory() {
        localStorage.setItem('omikujiHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('omikujiHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.displayHistory();
        }
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
            case 'draw':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'result':
                oscillator.frequency.value = 659.25;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }
}

// シェイクアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-2deg); }
        20%, 40%, 60%, 80% { transform: translateX(10px) rotate(2deg); }
    }
`;
document.head.appendChild(style);

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
const game = new OmikujiGame();
