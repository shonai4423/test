// シンプルなチャート描画ライブラリ（ミニマル版）
class SimpleChart {
    constructor(canvas, type, data, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;
        this.data = data;
        this.options = options;
        this.width = canvas.width;
        this.height = canvas.height;

        this.resize();
        this.draw();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.type === 'line') {
            this.drawLineChart();
        } else if (this.type === 'doughnut') {
            this.drawDoughnutChart();
        } else if (this.type === 'bar') {
            this.drawBarChart();
        }
    }

    drawLineChart() {
        const padding = 40;
        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        const values = this.data.datasets[0].data;
        const max = Math.max(...values) * 1.1;
        const min = Math.min(...values) * 0.9;
        const range = max - min;

        // グリッド線
        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--border').trim();
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.width - padding, y);
            this.ctx.stroke();
        }

        // グラデーション
        const gradient = this.ctx.createLinearGradient(0, padding, 0, this.height - padding);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.01)');

        // エリア描画
        this.ctx.beginPath();
        values.forEach((value, i) => {
            const x = padding + (chartWidth / (values.length - 1)) * i;
            const y = this.height - padding - ((value - min) / range) * chartHeight;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.lineTo(this.width - padding, this.height - padding);
        this.ctx.lineTo(padding, this.height - padding);
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // ライン描画
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';

        values.forEach((value, i) => {
            const x = padding + (chartWidth / (values.length - 1)) * i;
            const y = this.height - padding - ((value - min) / range) * chartHeight;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        // ポイント描画
        values.forEach((value, i) => {
            const x = padding + (chartWidth / (values.length - 1)) * i;
            const y = this.height - padding - ((value - min) / range) * chartHeight;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#667eea';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    drawDoughnutChart() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 2 - 20;
        const innerRadius = radius * 0.6;

        const total = this.data.datasets[0].data.reduce((a, b) => a + b, 0);
        let currentAngle = -Math.PI / 2;

        this.data.datasets[0].data.forEach((value, i) => {
            const sliceAngle = (value / total) * Math.PI * 2;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            this.ctx.closePath();

            this.ctx.fillStyle = this.data.datasets[0].backgroundColor[i];
            this.ctx.fill();

            currentAngle += sliceAngle;
        });

        // 中央の円
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-secondary').trim();
        this.ctx.fill();
    }

    drawBarChart() {
        const padding = 40;
        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        const values = this.data.datasets[0].data;
        const max = Math.max(...values) * 1.1;

        const barWidth = chartWidth / values.length * 0.7;
        const gap = chartWidth / values.length * 0.3;

        values.forEach((value, i) => {
            const x = padding + (chartWidth / values.length) * i + gap / 2;
            const height = (value / max) * chartHeight;
            const y = this.height - padding - height;

            const gradient = this.ctx.createLinearGradient(x, y, x, this.height - padding);
            gradient.addColorStop(0, this.data.datasets[0].backgroundColor[i] || '#667eea');
            gradient.addColorStop(1, this.data.datasets[0].backgroundColor[i] || '#764ba2');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, barWidth, height);

            // ラベル
            this.ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            this.ctx.font = '12px -apple-system, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.data.labels[i],
                x + barWidth / 2,
                this.height - padding + 20
            );
        });
    }

    update(newData) {
        this.data = newData;
        this.draw();
    }
}
