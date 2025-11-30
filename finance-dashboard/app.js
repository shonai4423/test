// データマネージャー
class FinanceDataManager {
    constructor() {
        this.portfolio = JSON.parse(localStorage.getItem('portfolio')) || this.getDefaultPortfolio();
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || this.getDefaultTransactions();
    }

    getDefaultPortfolio() {
        return [
            { id: 1, type: 'stock', name: 'Apple Inc.', symbol: 'AAPL', quantity: 50, price: 45000, currentPrice: 48000 },
            { id: 2, type: 'stock', name: 'Microsoft', symbol: 'MSFT', quantity: 30, price: 38000, currentPrice: 42000 },
            { id: 3, type: 'crypto', name: 'Bitcoin', symbol: 'BTC', quantity: 0.5, price: 5000000, currentPrice: 5500000 },
            { id: 4, type: 'fund', name: 'S&P500 ETF', symbol: 'VOO', quantity: 100, price: 42000, currentPrice: 45000 },
            { id: 5, type: 'bond', name: '米国債10年', symbol: 'US10Y', quantity: 200, price: 10000, currentPrice: 10200 },
        ];
    }

    getDefaultTransactions() {
        const now = new Date();
        return [
            {
                id: 1,
                date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'buy',
                symbol: 'AAPL',
                name: 'Apple Inc.',
                quantity: 10,
                price: 48000,
                status: 'completed'
            },
            {
                id: 2,
                date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'sell',
                symbol: 'TSLA',
                name: 'Tesla Inc.',
                quantity: 5,
                price: 72000,
                status: 'completed'
            },
            {
                id: 3,
                date: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'buy',
                symbol: 'BTC',
                name: 'Bitcoin',
                quantity: 0.1,
                price: 5500000,
                status: 'completed'
            },
            {
                id: 4,
                date: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'dividend',
                symbol: 'MSFT',
                name: 'Microsoft',
                quantity: 30,
                price: 150,
                status: 'completed'
            },
        ];
    }

    save() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    addAsset(asset) {
        asset.id = Date.now();
        this.portfolio.push(asset);
        this.save();
    }

    getTotalValue() {
        return this.portfolio.reduce((sum, asset) => {
            return sum + (asset.quantity * asset.currentPrice);
        }, 0);
    }

    getTotalProfit() {
        return this.portfolio.reduce((sum, asset) => {
            return sum + (asset.quantity * (asset.currentPrice - asset.price));
        }, 0);
    }
}

const dataManager = new FinanceDataManager();

// ナビゲーション
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewName = btn.dataset.view;

        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        views.forEach(v => v.classList.remove('active'));
        document.getElementById(`${viewName}View`).classList.add('active');

        if (viewName === 'portfolio') {
            renderPortfolio();
        } else if (viewName === 'transactions') {
            renderTransactionsTable();
        } else if (viewName === 'analytics') {
            renderAnalytics();
        }
    });
});

// テーマ切り替え
const themeToggle = document.getElementById('themeToggle');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
let currentTheme = localStorage.getItem('theme') || 'light';

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }

    // チャートを再描画
    initCharts();
}

setTheme(currentTheme);

themeToggle.addEventListener('click', () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// チャート初期化
let portfolioChart, allocationChart, monthlyChart, categoryChart, performanceChart;

function initCharts() {
    // 資産推移チャート
    const portfolioCanvas = document.getElementById('portfolioChart');
    if (portfolioCanvas) {
        const portfolioData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                data: [10500000, 10800000, 11200000, 11500000, 12000000, 12450000],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
            }]
        };
        portfolioChart = new SimpleChart(portfolioCanvas, 'line', portfolioData);
    }

    // 資産配分チャート
    const allocationCanvas = document.getElementById('allocationChart');
    if (allocationCanvas) {
        const allocationData = {
            labels: ['株式', '暗号資産', '債券', '投資信託', 'その他'],
            datasets: [{
                data: [40, 25, 15, 15, 5],
                backgroundColor: [
                    '#667eea',
                    '#f59e0b',
                    '#10b981',
                    '#3b82f6',
                    '#8b5cf6'
                ]
            }]
        };
        allocationChart = new SimpleChart(allocationCanvas, 'doughnut', allocationData);

        // 凡例を追加
        const legend = document.getElementById('allocationLegend');
        if (legend) {
            legend.innerHTML = '';
            allocationData.labels.forEach((label, i) => {
                const item = document.createElement('div');
                item.className = 'legend-item';
                item.innerHTML = `
                    <div class="legend-label">
                        <div class="legend-color" style="background: ${allocationData.datasets[0].backgroundColor[i]}"></div>
                        <span>${label}</span>
                    </div>
                    <span class="legend-value">${allocationData.datasets[0].data[i]}%</span>
                `;
                legend.appendChild(item);
            });
        }
    }
}

// 最近の取引を表示
function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    const recent = dataManager.transactions.slice(0, 5);

    container.innerHTML = '';

    recent.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';

        const date = new Date(transaction.date);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

        item.innerHTML = `
            <div class="transaction-left">
                <div class="transaction-icon ${transaction.type}">
                    ${transaction.type === 'buy' ? '📈' : transaction.type === 'sell' ? '📉' : '💰'}
                </div>
                <div class="transaction-info">
                    <h4>${transaction.name}</h4>
                    <p>${transaction.type === 'buy' ? '購入' : transaction.type === 'sell' ? '売却' : '配当'} - ${transaction.symbol}</p>
                </div>
            </div>
            <div class="transaction-amount">
                <div class="amount" style="color: ${transaction.type === 'sell' || transaction.type === 'dividend' ? 'var(--success)' : 'var(--text-primary)'}">
                    ${transaction.type === 'sell' || transaction.type === 'dividend' ? '+' : '-'}¥${(transaction.quantity * transaction.price).toLocaleString()}
                </div>
                <div class="date">${dateStr}</div>
            </div>
        `;

        container.appendChild(item);
    });
}

// マーケットデータを表示
function renderMarketData() {
    const container = document.getElementById('marketData');
    if (!container) return;

    const markets = [
        { name: '日経平均', symbol: 'N225', price: 33850, change: 2.3 },
        { name: 'S&P 500', symbol: 'SPX', price: 4783, change: 1.8 },
        { name: 'ビットコイン', symbol: 'BTC', price: 5500000, change: -0.5 },
        { name: 'ドル円', symbol: 'USDJPY', price: 149.8, change: 0.3 },
    ];

    container.innerHTML = '';

    markets.forEach(market => {
        const card = document.createElement('div');
        card.className = 'market-card';

        card.innerHTML = `
            <div class="market-header">
                <div>
                    <div class="market-name">${market.name}</div>
                    <div class="market-symbol">${market.symbol}</div>
                </div>
            </div>
            <div class="market-price">${market.symbol === 'BTC' ? '¥' : ''}${market.price.toLocaleString()}</div>
            <div class="market-change" style="color: ${market.change >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${market.change >= 0 ? '▲' : '▼'} ${Math.abs(market.change)}%
            </div>
        `;

        container.appendChild(card);
    });
}

// ポートフォリオを表示
function renderPortfolio() {
    const container = document.getElementById('portfolioGrid');
    if (!container) return;

    container.innerHTML = '';

    dataManager.portfolio.forEach(asset => {
        const totalCost = asset.quantity * asset.price;
        const currentValue = asset.quantity * asset.currentPrice;
        const profit = currentValue - totalCost;
        const profitPercent = ((profit / totalCost) * 100).toFixed(2);

        const card = document.createElement('div');
        card.className = `portfolio-card ${asset.type}`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${asset.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${asset.symbol}</p>
                </div>
                <span style="padding: 0.375rem 0.75rem; background: var(--bg-tertiary); border-radius: 50px; font-size: 0.8rem; font-weight: 600;">
                    ${asset.type === 'stock' ? '株式' : asset.type === 'crypto' ? '暗号資産' : asset.type === 'bond' ? '債券' : '投信'}
                </span>
            </div>
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">現在価値</div>
                <div style="font-size: 1.75rem; font-weight: 700;">¥${currentValue.toLocaleString()}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">数量</div>
                    <div style="font-weight: 600;">${asset.quantity}</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">損益</div>
                    <div style="font-weight: 600; color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${profit >= 0 ? '+' : ''}¥${profit.toLocaleString()} (${profitPercent}%)
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// 取引履歴テーブル
function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    dataManager.transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${transaction.type === 'buy' ? '購入' : transaction.type === 'sell' ? '売却' : '配当'}</td>
            <td>${transaction.name}</td>
            <td>${transaction.quantity}</td>
            <td>¥${transaction.price.toLocaleString()}</td>
            <td style="font-weight: 600; color: ${transaction.type === 'sell' || transaction.type === 'dividend' ? 'var(--success)' : 'var(--text-primary)'}">
                ¥${(transaction.quantity * transaction.price).toLocaleString()}
            </td>
            <td><span class="status-badge ${transaction.status}">${transaction.status === 'completed' ? '完了' : '保留中'}</span></td>
        `;

        tbody.appendChild(row);
    });
}

// 分析チャート
function renderAnalytics() {
    // 月間収支チャート
    const monthlyCanvas = document.getElementById('monthlyChart');
    if (monthlyCanvas) {
        const monthlyData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                data: [250000, 320000, 280000, 350000, 310000, 380000],
                backgroundColor: ['#667eea', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea']
            }]
        };
        monthlyChart = new SimpleChart(monthlyCanvas, 'bar', monthlyData);
    }

    // カテゴリ別支出
    const categoryCanvas = document.getElementById('categoryChart');
    if (categoryCanvas) {
        const categoryData = {
            labels: ['食費', '住居', '交通', '娯楽', 'その他'],
            datasets: [{
                data: [30, 35, 15, 12, 8],
                backgroundColor: ['#667eea', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
            }]
        };
        categoryChart = new SimpleChart(categoryCanvas, 'doughnut', categoryData);
    }

    // パフォーマンス
    const performanceCanvas = document.getElementById('performanceChart');
    if (performanceCanvas) {
        const performanceData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                data: [5.2, 7.8, 6.5, 8.9, 9.2, 12.5],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }]
        };
        performanceChart = new SimpleChart(performanceCanvas, 'line', performanceData);
    }
}

// モーダル制御
const addAssetModal = document.getElementById('addAssetModal');
const addAssetBtn = document.getElementById('addAssetBtn');
const modalCloses = document.querySelectorAll('.modal-close');
const saveAssetBtn = document.getElementById('saveAssetBtn');

if (addAssetBtn) {
    addAssetBtn.addEventListener('click', () => {
        addAssetModal.classList.add('active');
    });
}

modalCloses.forEach(btn => {
    btn.addEventListener('click', () => {
        addAssetModal.classList.remove('active');
    });
});

addAssetModal.addEventListener('click', (e) => {
    if (e.target === addAssetModal) {
        addAssetModal.classList.remove('active');
    }
});

if (saveAssetBtn) {
    saveAssetBtn.addEventListener('click', () => {
        const asset = {
            type: document.getElementById('assetType').value,
            name: document.getElementById('assetName').value,
            symbol: document.getElementById('assetName').value.substring(0, 4).toUpperCase(),
            quantity: parseFloat(document.getElementById('assetQuantity').value),
            price: parseFloat(document.getElementById('assetPrice').value),
            currentPrice: parseFloat(document.getElementById('assetPrice').value)
        };

        if (asset.name && asset.quantity && asset.price) {
            dataManager.addAsset(asset);
            addAssetModal.classList.remove('active');
            renderPortfolio();

            // フォームをリセット
            document.getElementById('assetName').value = '';
            document.getElementById('assetQuantity').value = '';
            document.getElementById('assetPrice').value = '';
        }
    });
}

// チャート期間切り替え
const chartBtns = document.querySelectorAll('.chart-btn');
chartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        chartBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// 初期化
initCharts();
renderRecentTransactions();
renderMarketData();
renderPortfolio();

// リサイズ対応
window.addEventListener('resize', () => {
    initCharts();
});
