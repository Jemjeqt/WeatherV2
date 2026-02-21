/* ============================================
   Weather Dashboard — app.js
   Modular vanilla JS, state machine pattern
   ============================================ */

// ─── Config ─────────────────────────────────
const API_KEY = '19cfebda173c93a84d5468c1149a15a7';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const AQI_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const STORAGE_KEY = 'weatherhub_lastCity';
const HISTORY_KEY = 'weatherhub_history';
const MAX_HISTORY = 8;
const DEBOUNCE_MS = 500;
const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

// ─── DOM References ─────────────────────────
const $ = (sel) => document.querySelector(sel);
const dom = {
  form: $('#searchForm'),
  input: $('#cityInput'),
  searchBtn: $('#searchBtn'),
  btnText: $('.search__btn-text'),
  btnSpinner: $('.search__btn-spinner'),
  btnArrow: $('.search__btn-arrow'),
  geoBtn: $('#geoBtn'),
  loader: $('#loader'),
  errorCard: $('#errorCard'),
  errorMessage: $('#errorMessage'),
  retryBtn: $('#retryBtn'),
  weatherCard: $('#weatherCard'),
  weatherIcon: $('#weatherIcon'),
  weatherTemp: $('#weatherTemp'),
  weatherUnit: $('#weatherUnit'),
  weatherDesc: $('#weatherDesc'),
  weatherLocation: $('#weatherLocation'),
  sunrise: $('#sunrise'),
  sunset: $('#sunset'),
  humidity: $('#humidity'),
  windSpeed: $('#windSpeed'),
  feelsLike: $('#feelsLike'),
  pressure: $('#pressure'),
  aqiSection: $('#aqiSection'),
  aqiBadge: $('#aqiBadge'),
  aqiBar: $('#aqiBar'),
  aqiDetails: $('#aqiDetails'),
  weatherUpdated: $('#weatherUpdated'),
  autoRefresh: $('#autoRefresh'),
  refreshCountdown: $('#refreshCountdown'),
  hourlySection: $('#hourlySection'),
  hourlyList: $('#hourlyList'),
  forecastSection: $('#forecastSection'),
  forecastList: $('#forecastList'),
  historySection: $('#historySection'),
  historyList: $('#historyList'),
  clearHistory: $('#clearHistory'),
  idleState: $('#idleState'),
  unitToggle: $('#unitToggle'),
  particles: $('#particles'),
};

// ─── State ──────────────────────────────────
const appState = {
  status: 'idle',
  data: null,
  forecast: null,
  hourly: null,
  aqi: null,
  error: null,
  unit: 'C',
  lastCity: '',
  lastCoords: null,   // { lat, lon } for AQI + refresh
  history: [],
  weatherTheme: 'default',
};

let refreshTimer = null;
let countdownTimer = null;
let countdownSeconds = 0;

// ─── State Management ───────────────────────
function setState(updates) {
  Object.assign(appState, updates);
  render();
}

// ─── Debounce ───────────────────────────────
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ─── Button Loading ─────────────────────────
function setButtonLoading(loading) {
  dom.searchBtn.disabled = loading;
  dom.geoBtn.disabled = loading;
  dom.btnText.hidden = loading;
  dom.btnArrow.hidden = loading;
  dom.btnSpinner.hidden = !loading;
}

// ─── API URL Builders ───────────────────────
const buildUrl = (base, params) => `${base}?${new URLSearchParams({ ...params, appid: API_KEY, units: 'metric' })}`;

// ─── Main Fetch ─────────────────────────────
async function getWeather(city) {
  if (!city || !city.trim()) return;
  const trimmedCity = city.trim();
  setButtonLoading(true);
  setState({ status: 'loading', error: null, lastCity: trimmedCity });

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(buildUrl(BASE_URL, { q: trimmedCity })),
      fetch(buildUrl(FORECAST_URL, { q: trimmedCity })),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.json().catch(() => ({}));
      throw new Error(
        currentRes.status === 404 ? `City "${trimmedCity}" not found.`
          : currentRes.status === 401 ? 'Invalid API key. Update it in app.js.'
            : err.message || `Server error (${currentRes.status}).`
      );
    }

    const currentData = await currentRes.json();
    const weatherData = extractWeatherData(currentData);
    const coords = { lat: currentData.coord.lat, lon: currentData.coord.lon };

    let forecastData = null;
    let hourlyData = null;
    if (forecastRes.ok) {
      const fData = await forecastRes.json();
      forecastData = extractForecastData(fData);
      hourlyData = extractHourlyData(fData);
    }

    saveLastCity(trimmedCity);
    addToHistory(trimmedCity);

    setState({
      status: 'success',
      data: weatherData,
      forecast: forecastData,
      hourly: hourlyData,
      error: null,
      lastCoords: coords,
      weatherTheme: getWeatherTheme(currentData.weather[0].main),
    });

    // Fetch AQI in background (non-blocking)
    fetchAQI(coords.lat, coords.lon);

    // Start auto-refresh
    startAutoRefresh();

  } catch (err) {
    handleFetchError(err);
  } finally {
    setButtonLoading(false);
  }
}

// ─── Geolocation ────────────────────────────
async function getWeatherByCoords(lat, lon) {
  setButtonLoading(true);
  setState({ status: 'loading', error: null });

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(buildUrl(BASE_URL, { lat, lon })),
      fetch(buildUrl(FORECAST_URL, { lat, lon })),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.json().catch(() => ({}));
      throw new Error(err.message || `Server error (${currentRes.status})`);
    }

    const currentData = await currentRes.json();
    const weatherData = extractWeatherData(currentData);
    const coords = { lat: currentData.coord.lat, lon: currentData.coord.lon };

    let forecastData = null;
    let hourlyData = null;
    if (forecastRes.ok) {
      const fData = await forecastRes.json();
      forecastData = extractForecastData(fData);
      hourlyData = extractHourlyData(fData);
    }

    dom.input.value = currentData.name;
    saveLastCity(currentData.name);
    addToHistory(currentData.name);

    setState({
      status: 'success',
      data: weatherData,
      forecast: forecastData,
      hourly: hourlyData,
      error: null,
      lastCity: currentData.name,
      lastCoords: coords,
      weatherTheme: getWeatherTheme(currentData.weather[0].main),
    });

    fetchAQI(coords.lat, coords.lon);
    startAutoRefresh();

  } catch (err) {
    handleFetchError(err);
  } finally {
    setButtonLoading(false);
  }
}

function handleGeoLocation() {
  if (!navigator.geolocation) {
    setState({ status: 'error', error: 'Geolocation not supported by your browser.' });
    return;
  }
  setButtonLoading(true);
  setState({ status: 'loading', error: null });

  navigator.geolocation.getCurrentPosition(
    (pos) => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    (err) => {
      setButtonLoading(false);
      const msgs = {
        1: 'Location access denied. Allow permission and try again.',
        2: 'Location unavailable. Try searching by city.',
        3: 'Location request timed out.',
      };
      setState({ status: 'error', error: msgs[err.code] || 'Failed to get location.' });
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

// ─── Air Quality ────────────────────────────
async function fetchAQI(lat, lon) {
  try {
    const res = await fetch(buildUrl(AQI_URL, { lat, lon }));
    if (!res.ok) return;
    const data = await res.json();
    if (data.list && data.list.length > 0) {
      const aqi = data.list[0];
      appState.aqi = {
        index: aqi.main.aqi,
        components: aqi.components,
      };
      renderAQI();
    }
  } catch {
    // AQI is non-critical, silently fail
  }
}

// ─── Error Helper ───────────────────────────
function handleFetchError(err) {
  if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
    setState({ status: 'error', error: 'Network error. Check your connection.' });
  } else {
    setState({ status: 'error', error: err.message });
  }
}

// ─── Data Extraction ────────────────────────
function extractWeatherData(data) {
  return {
    city: data.name,
    country: data.sys.country,
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    main: data.weather[0].main,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    pressure: data.main.pressure,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    timestamp: data.dt,
    timezone: data.timezone,
  };
}

function extractForecastData(data) {
  const days = {};
  data.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    const hour = parseInt(item.dt_txt.split(' ')[1]);
    if (!days[date] || Math.abs(hour - 12) < Math.abs(parseInt(days[date].dt_txt.split(' ')[1]) - 12)) {
      days[date] = item;
    }
  });

  const today = new Date().toISOString().split('T')[0];
  return Object.entries(days)
    .filter(([date]) => date !== today)
    .slice(0, 5)
    .map(([date, item]) => ({
      date,
      day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      temp: Math.round(item.main.temp),
      tempMin: Math.round(item.main.temp_min),
      icon: item.weather[0].icon,
      description: item.weather[0].description,
    }));
}

function extractHourlyData(data) {
  // Next 8 entries from forecast (each 3h)
  return data.list.slice(0, 8).map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }),
      temp: Math.round(item.main.temp),
      icon: item.weather[0].icon,
      description: item.weather[0].description,
      isNow: false,
    };
  });
}

// ─── Weather Theme ──────────────────────────
function getWeatherTheme(mainWeather) {
  const w = mainWeather.toLowerCase();
  if (w === 'clear') return 'clear';
  if (w === 'clouds') return 'clouds';
  if (w === 'rain' || w === 'drizzle') return 'rain';
  if (w === 'snow') return 'snow';
  if (w === 'thunderstorm') return 'thunderstorm';
  if (['mist', 'fog', 'haze', 'smoke', 'dust', 'sand', 'ash', 'squall', 'tornado'].includes(w)) return 'mist';
  return 'default';
}

function applyWeatherBackground(theme) {
  document.body.setAttribute('data-weather', theme);
  dom.particles.innerHTML = '';

  switch (theme) {
    case 'rain': createRainDrops(60); break;
    case 'snow': createSnowFlakes(40); break;
    case 'thunderstorm': createRainDrops(80); createLightning(); break;
    case 'mist': createMistLayers(3); break;
  }
}

function createRainDrops(count) {
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'rain-drop';
    d.style.cssText = `left:${Math.random() * 100}%;height:${15 + Math.random() * 25}px;animation-duration:${0.6 + Math.random() * 0.6}s;animation-delay:${Math.random() * 2}s;`;
    dom.particles.appendChild(d);
  }
}

function createSnowFlakes(count) {
  for (let i = 0; i < count; i++) {
    const f = document.createElement('div');
    f.className = 'snow-flake';
    const s = 2 + Math.random() * 4;
    f.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${4 + Math.random() * 6}s;animation-delay:${Math.random() * 5}s;`;
    dom.particles.appendChild(f);
  }
}

function createLightning() {
  const l = document.createElement('div');
  l.className = 'lightning';
  dom.particles.appendChild(l);
}

function createMistLayers(count) {
  for (let i = 0; i < count; i++) {
    const m = document.createElement('div');
    m.className = 'mist-layer';
    m.style.cssText = `top:${20 + i * 25}%;animation-duration:${12 + i * 5}s;opacity:${0.4 + i * 0.15};`;
    dom.particles.appendChild(m);
  }
}

// ─── Temperature ────────────────────────────
function convertTemp(c, unit) {
  return unit === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}
function formatTemp(c) { return convertTemp(c, appState.unit); }

// ─── Time Helpers ───────────────────────────
function formatUnixTime(unix, timezoneOffset) {
  const date = new Date((unix + timezoneOffset) * 1000);
  return date.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

// ─── LocalStorage ───────────────────────────
function saveLastCity(city) { try { localStorage.setItem(STORAGE_KEY, city); } catch { } }
function loadLastCity() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } }

// ─── Search History ─────────────────────────
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } }
function saveHistory(arr) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch { } }

function addToHistory(city) {
  let h = loadHistory();
  h = h.filter((c) => c.toLowerCase() !== city.toLowerCase());
  h.unshift(city);
  if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
  saveHistory(h);
  appState.history = h;
}

function clearAllHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch { }
  appState.history = [];
  renderHistory();
}

// ─── Auto Refresh ───────────────────────────
function startAutoRefresh() {
  stopAutoRefresh();
  countdownSeconds = AUTO_REFRESH_MS / 1000;
  updateCountdownDisplay();

  countdownTimer = setInterval(() => {
    countdownSeconds--;
    if (countdownSeconds <= 0) {
      silentRefresh();
      countdownSeconds = AUTO_REFRESH_MS / 1000;
    }
    updateCountdownDisplay();
  }, 1000);
}

function stopAutoRefresh() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

function updateCountdownDisplay() {
  const m = Math.floor(countdownSeconds / 60);
  const s = countdownSeconds % 60;
  if (dom.refreshCountdown) {
    dom.refreshCountdown.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

async function silentRefresh() {
  if (!appState.lastCity) return;
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(buildUrl(BASE_URL, { q: appState.lastCity })),
      fetch(buildUrl(FORECAST_URL, { q: appState.lastCity })),
    ]);

    if (!currentRes.ok) return;

    const currentData = await currentRes.json();
    const weatherData = extractWeatherData(currentData);

    let forecastData = null;
    let hourlyData = null;
    if (forecastRes.ok) {
      const fData = await forecastRes.json();
      forecastData = extractForecastData(fData);
      hourlyData = extractHourlyData(fData);
    }

    appState.data = weatherData;
    appState.forecast = forecastData;
    appState.hourly = hourlyData;
    appState.weatherTheme = getWeatherTheme(currentData.weather[0].main);
    appState.lastCoords = { lat: currentData.coord.lat, lon: currentData.coord.lon };

    renderSuccess();
    applyWeatherBackground(appState.weatherTheme);

    // Refresh AQI too
    fetchAQI(appState.lastCoords.lat, appState.lastCoords.lon);

  } catch {
    // Silent fail on auto-refresh
  }
}

// ─── Render Engine ──────────────────────────
function render() {
  const { status } = appState;

  dom.idleState.hidden = true;
  dom.loader.hidden = true;
  dom.errorCard.hidden = true;
  dom.weatherCard.hidden = true;
  dom.hourlySection.hidden = true;
  dom.forecastSection.hidden = true;

  switch (status) {
    case 'idle':
      dom.idleState.hidden = false;
      break;
    case 'loading':
      dom.loader.hidden = false;
      break;
    case 'success':
      renderSuccess();
      break;
    case 'error':
      renderError();
      break;
  }

  renderHistory();
  applyWeatherBackground(status === 'success' ? appState.weatherTheme : 'default');
}

function renderSuccess() {
  const d = appState.data;
  if (!d) return;

  dom.weatherIcon.src = `https://openweathermap.org/img/wn/${d.icon}@4x.png`;
  dom.weatherIcon.alt = d.description;
  dom.weatherTemp.textContent = formatTemp(d.temp);
  dom.weatherUnit.textContent = appState.unit === 'C' ? '°C' : '°F';
  dom.weatherDesc.textContent = d.description;
  dom.weatherLocation.textContent = `${d.city}, ${d.country}`;

  // Sunrise / Sunset
  dom.sunrise.textContent = formatUnixTime(d.sunrise, d.timezone);
  dom.sunset.textContent = formatUnixTime(d.sunset, d.timezone);

  // Details
  dom.humidity.textContent = `${d.humidity}%`;
  dom.windSpeed.textContent = `${d.windSpeed} m/s`;
  dom.feelsLike.textContent = `${formatTemp(d.feelsLike)}°`;
  dom.pressure.textContent = `${d.pressure} hPa`;

  const date = new Date(d.timestamp * 1000);
  dom.weatherUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
  dom.weatherCard.hidden = false;

  // Hourly
  if (appState.hourly && appState.hourly.length > 0) renderHourly();
  // 5-day
  if (appState.forecast && appState.forecast.length > 0) renderForecast();
  // AQI
  if (appState.aqi) renderAQI();
}

function renderHourly() {
  const h = appState.hourly;
  dom.hourlyList.innerHTML = h.map((item, i) => `
    <div class="hourly__card${i === 0 ? ' hourly__card--now' : ''}">
      <span class="hourly__time">${i === 0 ? 'Now' : item.time}</span>
      <img class="hourly__icon" src="https://openweathermap.org/img/wn/${item.icon}@2x.png" alt="${item.description}">
      <span class="hourly__temp">${formatTemp(item.temp)}°</span>
    </div>
  `).join('');
  dom.hourlySection.hidden = false;
}

function renderForecast() {
  const f = appState.forecast;
  dom.forecastList.innerHTML = f.map((day) => `
    <div class="forecast__card">
      <span class="forecast__day">${day.day}</span>
      <img class="forecast__icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
      <span class="forecast__temp">${formatTemp(day.temp)}°</span>
      <span class="forecast__temp-low">${formatTemp(day.tempMin)}°</span>
      <span class="forecast__desc">${day.description}</span>
    </div>
  `).join('');
  dom.forecastSection.hidden = false;
}

function renderAQI() {
  const { index, components } = appState.aqi;
  const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const label = labels[index] || 'Unknown';

  dom.aqiBadge.textContent = label;
  dom.aqiBadge.setAttribute('data-level', index);
  dom.aqiBar.style.width = `${(index / 5) * 100}%`;

  // Show key pollutants
  const pollutants = [
    { key: 'pm2_5', label: 'PM2.5' },
    { key: 'pm10', label: 'PM10' },
    { key: 'no2', label: 'NO₂' },
    { key: 'o3', label: 'O₃' },
    { key: 'co', label: 'CO' },
  ];

  dom.aqiDetails.innerHTML = pollutants
    .filter((p) => components[p.key] !== undefined)
    .map((p) => `<span class="aqi__pollutant"><strong>${p.label}</strong> ${components[p.key].toFixed(1)}</span>`)
    .join('');

  dom.aqiSection.hidden = false;
}

function renderError() {
  dom.errorMessage.textContent = appState.error || 'Something went wrong.';
  dom.errorCard.hidden = false;
}

function renderHistory() {
  const h = appState.history;
  if (!h || h.length === 0) {
    dom.historyList.innerHTML = '<p class="history__empty">No recent searches</p>';
    return;
  }
  dom.historyList.innerHTML = h.map((city) => `
    <button class="history__chip" data-city="${city.replace(/"/g, '&quot;')}" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
      ${city}
    </button>
  `).join('');
}

// ─── Unit Toggle ────────────────────────────
function setUnit(unit) {
  if (unit === appState.unit) return;
  appState.unit = unit;

  const btns = dom.unitToggle.querySelectorAll('.unit-toggle__btn');
  btns.forEach((btn) => btn.classList.toggle('unit-toggle__btn--active', btn.dataset.unit === unit));
  dom.unitToggle.classList.toggle('unit-toggle--f', unit === 'F');

  if (appState.status === 'success') renderSuccess();
}

// ─── Event Handlers ─────────────────────────
function handleSearch(e) {
  e.preventDefault();
  const city = dom.input.value;
  if (!city.trim()) {
    dom.input.focus();
    dom.input.classList.add('search__input--shake');
    setTimeout(() => dom.input.classList.remove('search__input--shake'), 500);
    return;
  }
  getWeather(city);
}

const debouncedSearch = debounce((city) => {
  if (city.trim().length >= 3) getWeather(city);
}, DEBOUNCE_MS);

// ─── Init ───────────────────────────────────
function init() {
  dom.form.addEventListener('submit', handleSearch);
  dom.input.addEventListener('input', (e) => debouncedSearch(e.target.value));

  dom.retryBtn.addEventListener('click', () => {
    if (appState.lastCity) getWeather(appState.lastCity);
  });

  dom.geoBtn.addEventListener('click', handleGeoLocation);

  dom.unitToggle.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => setUnit(btn.dataset.unit));
  });

  dom.historyList.addEventListener('click', (e) => {
    const chip = e.target.closest('.history__chip');
    if (chip) {
      dom.input.value = chip.dataset.city;
      getWeather(chip.dataset.city);
    }
  });

  dom.clearHistory.addEventListener('click', clearAllHistory);

  appState.history = loadHistory();

  const lastCity = loadLastCity();
  if (lastCity) {
    dom.input.value = lastCity;
    getWeather(lastCity);
  } else {
    render();
  }
}

document.addEventListener('DOMContentLoaded', init);
