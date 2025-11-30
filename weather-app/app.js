const API_KEY = 'YOUR_API_KEY_HERE'; // OpenWeatherMap APIキー（デモ用のダミーキー）
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// デモデータ（APIキーがない場合のフォールバック）
const demoData = {
    'tokyo': {
        name: 'Tokyo',
        sys: { country: 'JP' },
        main: {
            temp: 15,
            feels_like: 13,
            humidity: 65,
            pressure: 1013
        },
        weather: [{
            description: '晴れ',
            icon: '01d'
        }],
        wind: { speed: 3.5 }
    },
    'london': {
        name: 'London',
        sys: { country: 'GB' },
        main: {
            temp: 10,
            feels_like: 8,
            humidity: 78,
            pressure: 1015
        },
        weather: [{
            description: '曇り',
            icon: '04d'
        }],
        wind: { speed: 5.2 }
    },
    'new york': {
        name: 'New York',
        sys: { country: 'US' },
        main: {
            temp: 18,
            feels_like: 17,
            humidity: 55,
            pressure: 1012
        },
        weather: [{
            description: '快晴',
            icon: '01d'
        }],
        wind: { speed: 4.1 }
    }
};

async function getWeather(city) {
    showLoading(true);
    hideError();

    try {
        // デモモード: 実際のAPIの代わりにダミーデータを使用
        await new Promise(resolve => setTimeout(resolve, 800));

        const data = demoData[city.toLowerCase()];

        if (!data) {
            throw new Error('都市が見つかりません。Tokyo, London, New York を試してください。');
        }

        displayWeather(data);
        addToRecentSearches(city);

    } catch (error) {
        showError(error.message || '天気情報の取得に失敗しました');
    } finally {
        showLoading(false);
    }
}

function displayWeather(data) {
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('country').textContent = data.sys.country;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

    // 5日間予報のダミーデータ
    displayForecast();

    weatherCard.classList.remove('hidden');
}

function displayForecast() {
    const forecastContainer = document.getElementById('forecastContainer');
    const days = ['月', '火', '水', '木', '金'];
    const temps = [16, 18, 14, 17, 15];
    const icons = ['02d', '01d', '10d', '03d', '01d'];

    forecastContainer.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${days[i]}曜日</div>
            <img src="https://openweathermap.org/img/wn/${icons[i]}@2x.png" alt="weather">
            <div class="forecast-temp">${temps[i]}°C</div>
        `;
        forecastContainer.appendChild(forecastItem);
    }
}

function showLoading(show) {
    if (show) {
        loadingSpinner.classList.add('show');
        weatherCard.classList.add('hidden');
    } else {
        loadingSpinner.classList.remove('show');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    weatherCard.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function addToRecentSearches(city) {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);

    recentSearches = recentSearches.filter(c => c.toLowerCase() !== city.toLowerCase());
    recentSearches.unshift(cityName);
    recentSearches = recentSearches.slice(0, 5);

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const recentList = document.getElementById('recentList');
    recentList.innerHTML = '';

    if (recentSearches.length === 0) {
        recentList.innerHTML = '<p style="color: #999;">検索履歴はありません</p>';
        return;
    }

    recentSearches.forEach(city => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = city;
        item.addEventListener('click', () => {
            cityInput.value = city;
            getWeather(city);
        });
        recentList.appendChild(item);
    });
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        showError('都市名を入力してください');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

renderRecentSearches();
