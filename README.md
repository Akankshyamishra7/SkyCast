# 🌤️ SkyCast — Next-Generation Live Weather Dashboard

SkyCast is a modern, responsive, and production-grade weather forecasting web application built with **pure HTML5, CSS3, and Vanilla JavaScript**. It delivers real-time meteorological conditions, hourly trajectories, 7-day extended forecasts, dynamic celestial sun cycles, and AI atmospheric summaries.

Powered by **Open-Meteo APIs** — **100% free, zero backend, and no API keys required**.

---

## ✨ Features

- ⚡ **Real-Time Weather Metrics**: Accurate live temperature, feels-like, relative humidity, wind speed & direction (with rotating SVG compass needle), barometric pressure, UV index, cloud cover, and precipitation.
- 🔍 **Instant City Search & Autocomplete**: Real-time city search powered by the Open-Meteo Geocoding API with region, country, and coordinate previews.
- 📍 **Geolocation ("My Location")**: One-click browser GPS positioning with free client-side reverse geocoding fallback.
- 📈 **Interactive 24-Hour Temperature Chart**: High-DPI HTML5 Canvas graph rendering a smooth Bezier temperature trajectory with interactive hover tooltips. Zero external chart libraries.
- ☀️ **Solar Arc & Daylight Tracker**: Visual sun trajectory arc showing real-time sun position, sunrise, sunset, and daylight duration.
- 📅 **7-Day Extended Forecast**: Weekly outlook with day/night weather conditions, rain probabilities, and visual min-to-max gradient temperature bars.
- 🤖 **Atmospheric Weather Summary**: Human-readable natural language summary synthesized dynamically from live meteorological data.
- 🌡️ **Unit Switcher (°C / °F)**: Instantaneous recalculation between Celsius and Fahrenheit across all cards and charts without network re-fetching.
- 🌓 **Sleek Glassmorphism & Themes**: Polished dark and light themes with dynamic atmospheric background glow that shifts based on weather conditions (clear, rainy, stormy, snow, cloudy).
- ⭐ **Favorites & Recents**: Fast 1-click access to saved favorite cities and your last 5 searches stored in `localStorage`.
- 📱 **Mobile-First Responsive Design**: Desktop, tablet, and mobile layouts with smooth momentum scrolling for hourly cards.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism & CSS Variables), Modern Vanilla JavaScript (ES6+)
- **APIs**:
  - [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  - [BigDataCloud Client Reverse Geocode](https://api.bigdatacloud.net/data/reverse-geocode-client)
- **Zero External Dependencies**: No React, No Next.js, No Chart.js, No npm libraries required.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Akankshyamishra7/SkyCast.git
cd SkyCast
```

### 2. Run Locally
Because SkyCast is built with pure Vanilla web technologies, you can run it in any of the following ways:

#### Option A: Direct Browser Opening
Simply double-click `index.html` to open it directly in your web browser.

#### Option B: VS Code Live Server
Right-click `index.html` and choose **"Open with Live Server"**.

#### Option C: Python HTTP Server
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080`.

#### Option D: Node.js Serve
```bash
npx serve -l 8080 .
```

---

## 📂 Project Structure

```
SkyCast/
├── index.html     # Semantic HTML5 layout and accessibility attributes
├── style.css      # Glassmorphism design system, atmospheric glow, responsive rules
├── script.js      # Vanilla JS state engine, API integrations, canvas charts, event handlers
└── README.md      # Documentation and overview
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
