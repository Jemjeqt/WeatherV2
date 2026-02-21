# 🌦️ WeatherV2 — Dashboard Cuaca Real-Time

Dashboard cuaca modern yang dibangun dengan **HTML, CSS & JavaScript murni**. Tanpa framework, tanpa build tools — cukup buka di browser.

![Dark Theme](https://img.shields.io/badge/Tema-Dark%20Mode-0a0a1a?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/JS-Vanilla-f7df1e?style=flat-square&logo=javascript&logoColor=000)
![OpenWeather API](https://img.shields.io/badge/API-OpenWeather-e96e4f?style=flat-square)

## ✨ Fitur

| Fitur | Deskripsi |
|---|---|
| 🔍 **Cari Kota** | Cari kota manapun di dunia dengan auto-search (debounce) |
| 📍 **Lokasi Otomatis** | Deteksi lokasi saat ini dengan satu klik |
| ⏰ **Ramalan Per Jam** | 24 jam ke depan (8 slot × interval 3 jam) |
| 📅 **Ramalan 5 Hari** | Ramalan harian dengan suhu tertinggi/terendah |
| 🌫️ **Indeks Kualitas Udara** | PM2.5, PM10, NO₂, O₃, CO dengan badge berwarna |
| 🌅 **Sunrise / Sunset** | Akurat sesuai timezone kota yang dicari |
| 🔄 **Refresh Otomatis** | Hitung mundur, auto-refresh setiap 10 menit |
| 🌡️ **Toggle °C / °F** | Konversi langsung tanpa fetch ulang |
| 📜 **Riwayat Pencarian** | 8 pencarian terakhir tersimpan di localStorage |
| 🎨 **Background Dinamis** | Tema berubah sesuai cuaca (lihat tabel bawah) |

## 🎨 Background Cuaca Dinamis

Background berubah otomatis berdasarkan kondisi cuaca:

| Cuaca | Efek |
|---|---|
| ☀️ Cerah | Gradien biru dengan orb keemasan |
| ☁️ Berawan | Atmosfer abu-abu gelap keunguan |
| 🌧️ Hujan | Gelap + animasi tetesan hujan |
| ❄️ Salju | Biru keabu + butiran salju melayang |
| ⛈️ Badai | Gelap + hujan + kilat menyala |
| 🌫️ Kabut | Ungu redup + lapisan kabut bergerak |

## 🛠️ Teknologi

- **HTML5** — Struktur semantik
- **CSS3** — Custom properties, glassmorphism, animasi CSS
- **JavaScript (ES6+)** — `async/await`, state machine, arsitektur modular
- **OpenWeather API** — Current Weather, 5-Day Forecast, Air Pollution (gratis)
- **Google Fonts** — Typeface Inter

## 📁 Struktur Proyek

```
WeatherV2/
├── index.html      # Struktur HTML utama
├── style.css       # Tema gelap premium + animasi cuaca
├── app.js          # Logika utama, API calls, state management
├── vercel.json     # Konfigurasi deploy Vercel
├── netlify.toml    # Konfigurasi deploy Netlify
└── README.md       # File ini
```

## 🚀 Cara Pakai

1. **Clone repo**
   ```bash
   git clone https://github.com/Jemjeqt/WeatherV2.git
   cd WeatherV2
   ```

2. **Daftar API key** di [OpenWeather](https://openweathermap.org/api) (gratis)

3. **Masukkan API key** di `app.js` baris 7:
   ```javascript
   const API_KEY = 'API_KEY_KAMU_DISINI';
   ```

4. **Buka `index.html`** di browser — selesai!

## 🌐 Deployment

Sudah di-deploy di **Vercel**: [weatherhub-dashboard.vercel.app](https://weatherhub-dashboard.vercel.app)

Deploy sendiri:
```bash
npx vercel deploy --prod
```

Atau drag & drop folder ke [Netlify](https://app.netlify.com).

## 📝 API Endpoint yang Dipakai

| Endpoint | Kegunaan |
|---|---|
| `/data/2.5/weather` | Cuaca saat ini (suhu, kelembaban, angin, sunrise/sunset) |
| `/data/2.5/forecast` | Ramalan 5 hari / 3 jam (per jam + harian) |
| `/data/2.5/air_pollution` | Indeks kualitas udara + komponen polutan |

Semua endpoint pakai API key gratis yang sama.

## 📄 Lisensi

MIT — bebas digunakan untuk keperluan pribadi maupun komersial.
