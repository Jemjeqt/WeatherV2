# 🌦️ WeatherV2 — Real-Time Weather Dashboard

A beautiful, feature-rich weather dashboard built with **vanilla HTML, CSS & JavaScript**. No frameworks, no build tools — just clean, modular code.

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20Mode-0a0a1a?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/JS-Vanilla-f7df1e?style=flat-square&logo=javascript&logoColor=000)
![OpenWeather API](https://img.shields.io/badge/API-OpenWeather-e96e4f?style=flat-square)

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **City Search** | Search any city worldwide with debounced auto-search |
| 📍 **Geolocation** | One-click detect your current location |
| ⏰ **Hourly Forecast** | Next 24 hours (8 slots × 3h intervals) |
| 📅 **5-Day Forecast** | Daily forecast with hi/lo temps |
| 🌫️ **Air Quality Index** | PM2.5, PM10, NO₂, O₃, CO breakdown with color-coded badges |
| 🌅 **Sunrise / Sunset** | Timezone-accurate for searched city |
| 🔄 **Auto Refresh** | Live countdown, refreshes every 10 minutes |
| 🌡️ **°C / °F Toggle** | Client-side conversion, no re-fetch needed |
| 📜 **Search History** | Last 8 searches saved in localStorage |
| 🎨 **Dynamic Backgrounds** | Weather-reactive themes (see below) |

## 🎨 Dynamic Weather Backgrounds

The entire background changes based on current weather conditions:

| Weather | Effect |
|---|---|
| ☀️ Clear | Deep blue gradient with golden orb |
| ☁️ Clouds | Dark grey-purple atmosphere |
| 🌧️ Rain | Near-black + animated rain drops |
| ❄️ Snow | Cool blue-grey + floating snowflakes |
| ⛈️ Thunderstorm | Dark + rain + lightning flash |
| 🌫️ Mist/Fog | Muted purple + drifting mist layers |

## 🛠️ Tech Stack

- **HTML5** — Semantic markup with accessibility
- **CSS3** — Custom properties, glassmorphism, CSS animations
- **JavaScript (ES6+)** — `async/await`, state machine pattern, modular architecture
- **OpenWeather API** — Current Weather, 5-Day Forecast, Air Pollution (all free tier)
- **Google Fonts** — Inter typeface

## 📁 Project Structure

```
WeatherV2/
├── index.html      # Main HTML structure
├── style.css       # Premium dark theme + weather animations
├── app.js          # Core logic, API calls, state management
├── vercel.json     # Vercel deployment config
├── netlify.toml    # Netlify deployment config
└── README.md       # This file
```

## 🚀 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/Jemjeqt/WeatherV2.git
   cd WeatherV2
   ```

2. **Get an API key** from [OpenWeather](https://openweathermap.org/api) (free)

3. **Add your API key** in `app.js` line 7:
   ```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```

4. **Open `index.html`** in your browser — done!

## 🌐 Deployment

Deployed on **Vercel**: [weatherhub-dashboard.vercel.app](https://weatherhub-dashboard.vercel.app)

Deploy your own:
```bash
npx vercel deploy --prod
```

Or drag & drop the folder to [Netlify](https://app.netlify.com).

## 📝 API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `/data/2.5/weather` | Current weather (temp, humidity, wind, sunrise/sunset) |
| `/data/2.5/forecast` | 5-day / 3-hour forecast (hourly + daily) |
| `/data/2.5/air_pollution` | Air quality index + pollutant components |

All endpoints use the same free API key.

## 📄 License

MIT — free for personal and commercial use.
