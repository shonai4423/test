// 花札ゲームクラス
class HanafudaGame {
    constructor() {
        this.deck = [];
        this.fieldCards = [];
        this.playerHand = [];
        this.cpuHand = [];
        this.playerCaptured = [];
        this.cpuCaptured = [];
        this.currentPlayer = 'player';
        this.selectedCard = null;
        this.soundEnabled = true;
        this.roundNumber = 1;

        this.initializeUI();
        this.newGame();
        this.loadStats();
    }

    initializeUI() {
        // イベントリスナー
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());
        document.getElementById('drawBtn').addEventListener('click', () => this.drawFromDeck());

        // モーダル
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
        });

        document.getElementById('newGameFromModalBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
            this.newGame();
        });
    }

    newGame() {
        // カードをシャッフル
        this.deck = shuffleCards();

        // 配札
        this.playerHand = this.deck.splice(0, 8);
        this.cpuHand = this.deck.splice(0, 8);
        this.fieldCards = this.deck.splice(0, 8);
        this.playerCaptured = [];
        this.cpuCaptured = [];

        this.currentPlayer = 'player';
        this.selectedCard = null;

        this.updateDisplay();
        this.updateGameStatus();
    }

    updateDisplay() {
        // プレイヤーの手札
        this.renderHand('playerHand', this.playerHand, false);

        // CPUの手札（裏向き）
        this.renderHand('cpuHand', this.cpuHand, true);

        // 場札
        this.renderField();

        // 取得札
        this.renderCaptured('playerCaptured', this.playerCaptured);
        this.renderCaptured('cpuCaptured', this.cpuCaptured);

        // スコア
        this.updateScores();

        // 山札
        document.getElementById('deckCount').textContent = this.deck.length;
    }

    renderHand(elementId, cards, isFaceDown) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        cards.forEach(card => {
            const cardEl = this.createCardElement(card, isFaceDown);
            if (!isFaceDown && this.currentPlayer === 'player') {
                cardEl.addEventListener('click', () => this.selectHandCard(card));
            }
            container.appendChild(cardEl);
        });
    }

    renderField() {
        const container = document.getElementById('fieldCards');
        container.innerHTML = '';

        this.fieldCards.forEach(card => {
            const cardEl = this.createCardElement(card, false);
            if (this.selectedCard && card.month === this.selectedCard.month) {
                cardEl.classList.add('matchable');
                cardEl.addEventListener('click', () => this.matchCards(card));
            }
            container.appendChild(cardEl);
        });
    }

    renderCaptured(elementId, cards) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        cards.forEach(card => {
            const cardEl = this.createCardElement(card, false);
            cardEl.style.width = '60px';
            cardEl.style.height = '90px';
            container.appendChild(cardEl);
        });
    }

    createCardElement(card, isFaceDown) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = card.id;

        if (isFaceDown) {
            cardEl.classList.add('cpu-card');
            cardEl.innerHTML = `
                <div class="card-back">
                    <div class="card-pattern"></div>
                </div>
            `;
        } else {
            cardEl.innerHTML = `
                <div class="card-points">${card.points}</div>
                <div class="card-month">${card.month}月</div>
                <div class="card-icon">${card.icon}</div>
                <div class="card-type ${card.type}">${this.getTypeName(card.type)}</div>
            `;
        }

        return cardEl;
    }

    getTypeName(type) {
        const names = {
            hikari: '光',
            tane: 'タネ',
            tan: 'タン',
            kasu: 'カス'
        };
        return names[type] || type;
    }

    selectHandCard(card) {
        if (this.currentPlayer !== 'player') return;

        // 前の選択を解除
        document.querySelectorAll('.card.selected').forEach(el => {
            el.classList.remove('selected');
        });

        this.selectedCard = card;

        // 選択した札を強調
        const cardEl = document.querySelector(`#playerHand .card[data-card-id="${card.id}"]`);
        if (cardEl) {
            cardEl.classList.add('selected');
        }

        // 山札から引くボタンを無効化
        document.getElementById('drawBtn').disabled = false;

        this.renderField();
    }

    matchCards(fieldCard) {
        if (!this.selectedCard || this.currentPlayer !== 'player') return;

        // 手札から札を削除
        const handIndex = this.playerHand.findIndex(c => c.id === this.selectedCard.id);
        if (handIndex !== -1) {
            this.playerHand.splice(handIndex, 1);
        }

        // 場札から札を削除
        const fieldIndex = this.fieldCards.findIndex(c => c.id === fieldCard.id);
        if (fieldIndex !== -1) {
            this.fieldCards.splice(fieldIndex, 1);
        }

        // 取得札に追加
        this.playerCaptured.push(this.selectedCard, fieldCard);

        this.playSound('match');
        this.selectedCard = null;

        // 山札から1枚引く
        this.drawFromDeckAfterMatch();
    }

    drawFromDeck() {
        if (!this.selectedCard || this.currentPlayer !== 'player' || this.deck.length === 0) return;

        // 合う札がない場合、手札を場に置く
        const handIndex = this.playerHand.findIndex(c => c.id === this.selectedCard.id);
        if (handIndex !== -1) {
            this.fieldCards.push(this.selectedCard);
            this.playerHand.splice(handIndex, 1);
        }

        this.selectedCard = null;
        this.drawFromDeckAfterMatch();
    }

    drawFromDeckAfterMatch() {
        if (this.deck.length === 0) {
            this.checkGameOver();
            return;
        }

        const drawnCard = this.deck.shift();
        const matchingFieldCards = this.fieldCards.filter(c => c.month === drawnCard.month);

        if (matchingFieldCards.length > 0) {
            // 合う札がある場合、取得
            const matchCard = matchingFieldCards[0];
            const fieldIndex = this.fieldCards.findIndex(c => c.id === matchCard.id);
            if (fieldIndex !== -1) {
                this.fieldCards.splice(fieldIndex, 1);
            }
            this.playerCaptured.push(drawnCard, matchCard);
            this.playSound('match');
        } else {
            // 合う札がない場合、場に追加
            this.fieldCards.push(drawnCard);
        }

        document.getElementById('drawBtn').disabled = true;
        this.updateDisplay();

        // CPUのターン
        if (this.cpuHand.length > 0) {
            setTimeout(() => this.cpuTurn(), 1000);
        } else {
            this.checkGameOver();
        }
    }

    cpuTurn() {
        this.currentPlayer = 'cpu';
        this.updateGameStatus();

        // CPUの手札から1枚選ぶ
        let selectedCard = null;
        let matchingFieldCard = null;

        // 合う札を探す
        for (const card of this.cpuHand) {
            const matches = this.fieldCards.filter(f => f.month === card.month);
            if (matches.length > 0) {
                selectedCard = card;
                matchingFieldCard = matches[0];
                break;
            }
        }

        // 合う札がない場合、ランダムに選ぶ
        if (!selectedCard) {
            selectedCard = this.cpuHand[Math.floor(Math.random() * this.cpuHand.length)];
        }

        // 手札から削除
        const handIndex = this.cpuHand.findIndex(c => c.id === selectedCard.id);
        if (handIndex !== -1) {
            this.cpuHand.splice(handIndex, 1);
        }

        if (matchingFieldCard) {
            // 場札から削除
            const fieldIndex = this.fieldCards.findIndex(c => c.id === matchingFieldCard.id);
            if (fieldIndex !== -1) {
                this.fieldCards.splice(fieldIndex, 1);
            }
            this.cpuCaptured.push(selectedCard, matchingFieldCard);
            this.playSound('match');
        } else {
            // 場に追加
            this.fieldCards.push(selectedCard);
        }

        this.updateDisplay();

        // 山札から引く
        setTimeout(() => {
            if (this.deck.length === 0) {
                this.checkGameOver();
                return;
            }

            const drawnCard = this.deck.shift();
            const matchingFieldCards = this.fieldCards.filter(c => c.month === drawnCard.month);

            if (matchingFieldCards.length > 0) {
                const matchCard = matchingFieldCards[0];
                const fieldIndex = this.fieldCards.findIndex(c => c.id === matchCard.id);
                if (fieldIndex !== -1) {
                    this.fieldCards.splice(fieldIndex, 1);
                }
                this.cpuCaptured.push(drawnCard, matchCard);
                this.playSound('match');
            } else {
                this.fieldCards.push(drawnCard);
            }

            this.currentPlayer = 'player';
            this.updateDisplay();
            this.updateGameStatus();

            if (this.playerHand.length === 0 && this.cpuHand.length === 0) {
                this.checkGameOver();
            }
        }, 1000);
    }

    updateScores() {
        const playerYaku = calculateYaku(this.playerCaptured);
        const cpuYaku = calculateYaku(this.cpuCaptured);

        document.getElementById('playerScore').textContent = `${playerYaku.totalPoints}文`;
        document.getElementById('cpuScore').textContent = `${cpuYaku.totalPoints}文`;
    }

    updateGameStatus() {
        document.getElementById('currentTurn').textContent =
            this.currentPlayer === 'player' ? 'あなた' : 'CPU';
        document.getElementById('remainingCards').textContent = this.deck.length;
        document.getElementById('roundNumber').textContent = this.roundNumber;
    }

    checkGameOver() {
        if (this.playerHand.length > 0 || this.cpuHand.length > 0 || this.deck.length > 0) {
            return;
        }

        const playerYaku = calculateYaku(this.playerCaptured);
        const cpuYaku = calculateYaku(this.cpuCaptured);

        let winner;
        if (playerYaku.totalPoints > cpuYaku.totalPoints) {
            winner = 'player';
            this.playSound('win');
        } else if (cpuYaku.totalPoints > playerYaku.totalPoints) {
            winner = 'cpu';
            this.playSound('lose');
        } else {
            winner = 'draw';
        }

        this.updateStats(winner);
        this.showGameOverModal(playerYaku, cpuYaku, winner);
    }

    showGameOverModal(playerYaku, cpuYaku, winner) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('resultMessage');
        const yakuAchieved = document.getElementById('yakuAchieved');

        document.getElementById('finalPlayerScore').textContent = `${playerYaku.totalPoints}文`;
        document.getElementById('finalCpuScore').textContent = `${cpuYaku.totalPoints}文`;

        if (winner === 'player') {
            title.textContent = 'あなたの勝利！';
            message.textContent = '🎉 おめでとうございます！';
        } else if (winner === 'cpu') {
            title.textContent = 'CPUの勝利';
            message.textContent = '😢 次は頑張りましょう';
        } else {
            title.textContent = '引き分け';
            message.textContent = '互角の戦いでした';
        }

        // 役の表示
        let yakuHtml = '<h4>成立した役</h4>';
        if (playerYaku.yakuResults.length > 0) {
            yakuHtml += '<div style="margin-bottom: 1rem;"><strong>あなた:</strong><ul style="margin-left: 1.5rem;">';
            playerYaku.yakuResults.forEach(yaku => {
                yakuHtml += `<li>${yaku.name} (${yaku.points}文)</li>`;
            });
            yakuHtml += '</ul></div>';
        }
        if (cpuYaku.yakuResults.length > 0) {
            yakuHtml += '<div><strong>CPU:</strong><ul style="margin-left: 1.5rem;">';
            cpuYaku.yakuResults.forEach(yaku => {
                yakuHtml += `<li>${yaku.name} (${yaku.points}文)</li>`;
            });
            yakuHtml += '</ul></div>';
        }
        if (playerYaku.yakuResults.length === 0 && cpuYaku.yakuResults.length === 0) {
            yakuHtml += '<p style="color: var(--text-secondary);">役なし</p>';
        }
        yakuAchieved.innerHTML = yakuHtml;

        modal.classList.add('active');
    }

    showHint() {
        if (this.currentPlayer !== 'player' || this.playerHand.length === 0) return;

        // 合う札を探す
        for (const card of this.playerHand) {
            const matches = this.fieldCards.filter(f => f.month === card.month);
            if (matches.length > 0) {
                const cardEl = document.querySelector(`#playerHand .card[data-card-id="${card.id}"]`);
                if (cardEl) {
                    cardEl.style.animation = 'pulse 0.5s 3';
                    setTimeout(() => {
                        cardEl.style.animation = '';
                    }, 1500);
                }
                return;
            }
        }

        alert('合う札が見つかりません。山札から引いてください。');
    }

    showRules() {
        document.getElementById('rulesModal').classList.add('active');
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

        if (type === 'match') {
            oscillator.frequency.value = 523.25;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } else if (type === 'win') {
            oscillator.frequency.value = 659.25;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } else if (type === 'lose') {
            oscillator.frequency.value = 293.66;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('hanafudaStats')) || {
            totalGames: 0,
            wins: 0
        };

        document.getElementById('totalGames').textContent = stats.totalGames;
        document.getElementById('wins').textContent = stats.wins;

        const winRate = stats.totalGames > 0
            ? Math.round((stats.wins / stats.totalGames) * 100)
            : 0;
        document.getElementById('winRate').textContent = `${winRate}%`;
    }

    updateStats(winner) {
        const stats = JSON.parse(localStorage.getItem('hanafudaStats')) || {
            totalGames: 0,
            wins: 0
        };

        stats.totalGames++;
        if (winner === 'player') stats.wins++;

        localStorage.setItem('hanafudaStats', JSON.stringify(stats));
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
const game = new HanafudaGame();
