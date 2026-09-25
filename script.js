/**
 * SkyCast Live Weather Forecasting Engine
 * Pure Vanilla JavaScript • Zero Backend • No API Key Required
 * Powered by Open-Meteo Weather & Geocoding APIs
 */

(function () {
  'use strict';

  // ==========================================
  // 1. STATE MANAGEMENT (Single Source of Truth)
  // ==========================================
  const state = {
    city: {
      name: 'Delhi',
      country: 'India',
      admin1: 'National Capital Territory of Delhi',
      latitude: 28.65195,
      longitude: 77.23149,
      timezone: 'Asia/Kolkata'
    },
    weather: null,
    unit: localStorage.getItem('skycast_unit') || 'c', // 'c' or 'f'
    theme: localStorage.getItem('skycast_theme') || 'dark', // 'dark' or 'light'
    favorites: JSON.parse(localStorage.getItem('skycast_favorites') || '[]'),
    recentSearches: JSON.parse(localStorage.getItem('skycast_recents') || '[]'),
    isLoading: false,
    searchDebounceTimer: null
  };

  // ==========================================
  // 2. DOM ELEMENT REFERENCES
  // ==========================================
  const elements = {
    html: document.documentElement,
    body: document.body,
    searchInput: document.getElementById('citySearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    searchBtn: document.getElementById('searchBtn'),
    searchForm: document.getElementById('searchForm'),
    searchDropdown: document.getElementById('searchDropdown'),
    recentChips: document.getElementById('recentChips'),
    clearRecentBtn: document.getElementById('clearRecentBtn'),
    currentLocationBtn: document.getElementById('currentLocationBtn'),
    unitCelsiusBtn: document.getElementById('unitCelsiusBtn'),
    unitFahrenheitBtn: document.getElementById('unitFahrenheitBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    toastContainer: document.getElementById('toastContainer'),
    offlineBanner: document.getElementById('offlineBanner'),
    favoritesCount: document.getElementById('favoritesCount'),
    favoritesList: document.getElementById('favoritesList'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    dashboardLoading: document.getElementById('dashboardLoading'),
    
    // Hero Card
    cardCity: document.getElementById('cardCity'),
    cardCountry: document.getElementById('cardCountry'),
    cardRegion: document.getElementById('cardRegion'),
    favoriteToggleBtn: document.getElementById('favoriteToggleBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    heroWeatherIcon: document.getElementById('heroWeatherIcon'),
    cardTemp: document.getElementById('cardTemp'),
    cardTempUnit: document.getElementById('cardTempUnit'),
    cardCondition: document.getElementById('cardCondition'),
    cardFeelsLike: document.getElementById('cardFeelsLike'),
    cardHighLow: document.getElementById('cardHighLow'),
    cardLocalTime: document.getElementById('cardLocalTime'),
    cardLocalDate: document.getElementById('cardLocalDate'),

    // AI Weather Summary & Sun Cycle
    weatherSummaryText: document.getElementById('weatherSummaryText'),
    summaryAirPill: document.getElementById('summaryAirPill'),
    summaryUvPill: document.getElementById('summaryUvPill'),
    summaryRainPill: document.getElementById('summaryRainPill'),
    daylightDuration: document.getElementById('daylightDuration'),
    solarProgressTrack: document.getElementById('solarProgressTrack'),
    sunMarker: document.getElementById('sunMarker'),
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    sunStatusPill: document.getElementById('sunStatusPill'),

    // Canvas Chart & Hourly Carousel
    chartHighBadge: document.getElementById('chartHighBadge'),
    chartLowBadge: document.getElementById('chartLowBadge'),
    tempChart: document.getElementById('tempChart'),
    chartTooltip: document.getElementById('chartTooltip'),
    hourlyScrollLeft: document.getElementById('hourlyScrollLeft'),
    hourlyScrollRight: document.getElementById('hourlyScrollRight'),
    hourlyCarousel: document.getElementById('hourlyCarousel'),

    // Details Grid Metrics
    valFeelsLike: document.getElementById('valFeelsLike'),
    unitFeelsLike: document.getElementById('unitFeelsLike'),
    descFeelsLike: document.getElementById('descFeelsLike'),
    valHumidity: document.getElementById('valHumidity'),
    barHumidity: document.getElementById('barHumidity'),
    descHumidity: document.getElementById('descHumidity'),
    valWindSpeed: document.getElementById('valWindSpeed'),
    unitWindSpeed: document.getElementById('unitWindSpeed'),
    compassArrow: document.getElementById('compassArrow'),
    valWindDirection: document.getElementById('valWindDirection'),
    valPressure: document.getElementById('valPressure'),
    descPressure: document.getElementById('descPressure'),
    valUvIndex: document.getElementById('valUvIndex'),
    uvMarker: document.getElementById('uvMarker'),
    descUvIndex: document.getElementById('descUvIndex'),
    valPrecipitation: document.getElementById('valPrecipitation'),
    descPrecipitation: document.getElementById('descPrecipitation'),
    valCloudCover: document.getElementById('valCloudCover'),
    barCloudCover: document.getElementById('barCloudCover'),
    descCloudCover: document.getElementById('descCloudCover'),
    valRainProb: document.getElementById('valRainProb'),
    descRainProb: document.getElementById('descRainProb'),
    valVisibility: document.getElementById('valVisibility'),
    descVisibility: document.getElementById('descVisibility'),

    // 7-Day Forecast Grid
    dailyForecastGrid: document.getElementById('dailyForecastGrid')
  };

  // ==========================================
  // 3. WEATHER CODE INTERPRETATION SYSTEM
  // ==========================================
  /**
   * Maps WMO weather code to condition title, description, category, and SVG icon
   * @param {number} code - WMO weather interpretation code
   * @param {boolean} isDay - Day (1) or Night (0)
   */
  function getWeatherInfo(code, isDay = 1) {
    const isNight = !isDay;

    // SVG Icon Definitions
    const icons = {
      sun: `<svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="14" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
        <g stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
          <line x1="32" y1="8" x2="32" y2="4"/>
          <line x1="32" y1="60" x2="32" y2="56"/>
          <line x1="8" y1="32" x2="4" y2="32"/>
          <line x1="60" y1="32" x2="56" y2="32"/>
          <line x1="15" y1="15" x2="12" y2="12"/>
          <line x1="49" y1="49" x2="52" y2="52"/>
          <line x1="15" y1="49" x2="12" y2="52"/>
          <line x1="49" y1="15" x2="52" y2="12"/>
        </g>
      </svg>`,
      moon: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M42 38A18 18 0 1 1 26 20a15 15 0 0 0 16 18Z" fill="#38bdf8" stroke="#0ea5e9" stroke-width="2"/>
        <circle cx="48" cy="18" r="1.5" fill="#f8fafc"/>
        <circle cx="52" cy="30" r="1" fill="#f8fafc"/>
        <circle cx="38" cy="12" r="1" fill="#f8fafc"/>
      </svg>`,
      partlyCloudyDay: `<svg viewBox="0 0 64 64" fill="none">
        <circle cx="26" cy="24" r="10" fill="#fbbf24"/>
        <path d="M46 44H24a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 46 44Z" fill="#94a3b8" fill-opacity="0.85" stroke="#cbd5e1" stroke-width="2"/>
      </svg>`,
      partlyCloudyNight: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M34 22A10 10 0 0 1 25 10a12 12 0 0 0 10 13Z" fill="#38bdf8"/>
        <path d="M46 44H24a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 46 44Z" fill="#475569" fill-opacity="0.9" stroke="#64748b" stroke-width="2"/>
      </svg>`,
      cloudy: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M44 46H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 44 46Z" fill="#64748b" fill-opacity="0.9" stroke="#94a3b8" stroke-width="2"/>
        <path d="M50 48H32a8 8 0 0 1-1-15.9 11 11 0 0 1 20.9-2.5A7 7 0 0 1 50 48Z" fill="#475569" fill-opacity="0.7"/>
      </svg>`,
      fog: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M40 32H20a8 8 0 0 1 0-16 11 11 0 0 1 21-2.5A7 7 0 0 1 40 32Z" fill="#64748b" fill-opacity="0.6"/>
        <line x1="14" y1="40" x2="50" y2="40" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <line x1="18" y1="48" x2="46" y2="48" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
        <line x1="22" y1="56" x2="42" y2="56" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
      drizzle: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M44 34H20a9 9 0 0 1-1.2-17.9 12 12 0 0 1 22.8-2.7A8 8 0 0 1 44 34Z" fill="#64748b" stroke="#94a3b8" stroke-width="2"/>
        <line x1="24" y1="42" x2="22" y2="48" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="42" x2="32" y2="48" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="44" y1="42" x2="42" y2="48" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`,
      rain: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M46 32H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 46 32Z" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
        <line x1="24" y1="40" x2="20" y2="52" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
        <line x1="34" y1="40" x2="30" y2="52" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
        <line x1="44" y1="40" x2="40" y2="52" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
      heavyRain: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M46 30H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 46 30Z" fill="#334155" stroke="#64748b" stroke-width="2"/>
        <line x1="22" y1="38" x2="16" y2="54" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="32" y1="38" x2="26" y2="54" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="42" y1="38" x2="36" y2="54" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`,
      snow: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M44 32H20a9 9 0 0 1-1.2-17.9 12 12 0 0 1 22.8-2.7A8 8 0 0 1 44 32Z" fill="#64748b" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="22" cy="44" r="2.5" fill="#f8fafc"/>
        <circle cx="32" cy="50" r="3" fill="#f8fafc"/>
        <circle cx="42" cy="44" r="2.5" fill="#f8fafc"/>
        <circle cx="26" cy="56" r="2" fill="#e2e8f0"/>
        <circle cx="38" cy="56" r="2" fill="#e2e8f0"/>
      </svg>`,
      thunderstorm: `<svg viewBox="0 0 64 64" fill="none">
        <path d="M46 30H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-3.1A9 9 0 0 1 46 30Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
        <polygon points="32 34 26 46 33 46 30 58 40 43 33 43 36 34" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>
      </svg>`
    };

    switch (code) {
      case 0:
        return {
          condition: 'Clear Sky',
          description: isNight ? 'Clear and calm celestial night' : 'Bright sunny day with unclouded sky',
          icon: isNight ? icons.moon : icons.sun,
          category: 'clear'
        };
      case 1:
        return {
          condition: 'Mainly Clear',
          description: isNight ? 'Mostly clear starry skies' : 'Sunny with rare gentle clouds',
          icon: isNight ? icons.partlyCloudyNight : icons.partlyCloudyDay,
          category: 'clear'
        };
      case 2:
        return {
          condition: 'Partly Cloudy',
          description: 'Sun and pleasant scattered cloud cover',
          icon: isNight ? icons.partlyCloudyNight : icons.partlyCloudyDay,
          category: 'cloudy'
        };
      case 3:
        return {
          condition: 'Overcast',
          description: 'Dense cloud layer obscuring the sky',
          icon: icons.cloudy,
          category: 'cloudy'
        };
      case 45:
      case 48:
        return {
          condition: 'Fog / Mist',
          description: 'Hazy atmospheric fog with reduced visibility',
          icon: icons.fog,
          category: 'fog'
        };
      case 51:
      case 53:
      case 55:
        return {
          condition: 'Light Drizzle',
          description: 'Gentle fine mist and light precipitation',
          icon: icons.drizzle,
          category: 'rain'
        };
      case 56:
      case 57:
        return {
          condition: 'Freezing Drizzle',
          description: 'Chilly icy drizzle; cautionary road conditions',
          icon: icons.drizzle,
          category: 'rain'
        };
      case 61:
      case 63:
        return {
          condition: 'Rain Showers',
          description: 'Steady raindrops with cool refreshing breeze',
          icon: icons.rain,
          category: 'rain'
        };
      case 65:
        return {
          condition: 'Heavy Rain',
          description: 'Intense rain downpours and humid air',
          icon: icons.heavyRain,
          category: 'rain'
        };
      case 66:
      case 67:
        return {
          condition: 'Freezing Rain',
          description: 'Freezing rain forming slick icy coating',
          icon: icons.heavyRain,
          category: 'snow'
        };
      case 71:
      case 73:
      case 75:
      case 77:
        return {
          condition: 'Snowfall',
          description: 'Crisp falling snowflakes and frosty temperatures',
          icon: icons.snow,
          category: 'snow'
        };
      case 80:
      case 81:
      case 82:
        return {
          condition: 'Passing Showers',
          description: 'Intermittent rain showers across the area',
          icon: icons.rain,
          category: 'rain'
        };
      case 85:
      case 86:
        return {
          condition: 'Snow Showers',
          description: 'Scattered winter snow showers',
          icon: icons.snow,
          category: 'snow'
        };
      case 95:
        return {
          condition: 'Thunderstorm',
          description: 'Active electrical lightning storm and rumble',
          icon: icons.thunderstorm,
          category: 'thunderstorm'
        };
      case 96:
      case 99:
        return {
          condition: 'Severe Storm & Hail',
          description: 'Thunderstorm accompanied by hail stones',
          icon: icons.thunderstorm,
          category: 'thunderstorm'
        };
      default:
        return {
          condition: 'Fair Skies',
          description: 'Standard atmospheric conditions',
          icon: icons.sun,
          category: 'clear'
        };
    }
  }

  // ==========================================
  // 4. UNIT CONVERSIONS & FORMATTERS
  // ==========================================
  function convertTemp(tempCelsius, toUnit = state.unit) {
    if (tempCelsius === null || tempCelsius === undefined || isNaN(tempCelsius)) return '--';
    if (toUnit === 'f') {
      return Math.round((tempCelsius * 9) / 5 + 32);
    }
    return Math.round(tempCelsius);
  }

  function formatTime(isoString, timezone = state.city.timezone) {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone || undefined
      }).format(date);
    } catch {
      return isoString.split('T')[1] || '--:--';
    }
  }

  function formatDate(isoString, timezone = state.city.timezone) {
    if (!isoString) return '--';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: timezone || undefined
      }).format(date);
    } catch {
      return isoString;
    }
  }

  function getWindDirectionCompass(degrees) {
    if (degrees === undefined || degrees === null) return 'N';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // ==========================================
  // 5. TOAST NOTIFICATIONS & FEEDBACK
  // ==========================================
  function showToast(message, type = 'info', duration = 3500) {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'error') {
      iconSvg = '<span style="color:var(--accent-rose)">✕</span>';
    } else if (type === 'success') {
      iconSvg = '<span style="color:var(--accent-emerald)">✓</span>';
    } else {
      iconSvg = '<span style="color:var(--accent-cyan)">ℹ</span>';
    }

    toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==========================================
  // 6. API SERVICES (Open-Meteo)
  // ==========================================
  async function searchCitiesApi(query) {
    if (!query || query.trim().length < 2) return [];
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Geocoding service unavailable');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.warn('Geocoding API error:', err);
      return [];
    }
  }

  async function fetchWeatherDataApi(lat, lon, timezone = 'auto') {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: timezone,
      forecast_days: '7'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo forecast error (${res.status})`);
    }
    return await res.json();
  }

  // ==========================================
  // 7. WEATHER APPLICATION LOGIC
  // ==========================================
  async function loadWeatherForCity(cityObj, saveToRecent = true) {
    if (!cityObj || !cityObj.latitude || !cityObj.longitude) return;

    if (state.isLoading) return;
    setLoadingState(true);

    try {
      const data = await fetchWeatherDataApi(cityObj.latitude, cityObj.longitude, cityObj.timezone || 'auto');
      
      // Update State
      state.city = {
        name: cityObj.name || 'Custom Location',
        country: cityObj.country || '',
        admin1: cityObj.admin1 || '',
        latitude: cityObj.latitude,
        longitude: cityObj.longitude,
        timezone: data.timezone || cityObj.timezone || 'auto'
      };
      state.weather = data;

      // Save to Recents
      if (saveToRecent) {
        addRecentCity(state.city);
      }

      // Update UI Completely
      renderAllWeatherViews();
      updateFavoriteButtonState();

      if (elements.offlineBanner) elements.offlineBanner.style.display = 'none';
    } catch (err) {
      console.error('Error loading weather:', err);
      showToast(`Failed to load weather: ${err.message || 'Network error'}`, 'error');
      if (!navigator.onLine && elements.offlineBanner) {
        elements.offlineBanner.style.display = 'flex';
      }
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    state.isLoading = isLoading;
    if (elements.dashboardLoading) {
      elements.dashboardLoading.style.display = isLoading ? 'flex' : 'none';
    }
    if (elements.refreshBtn) {
      elements.refreshBtn.classList.toggle('spinning', isLoading);
    }
  }

  // ==========================================
  // 8. RENDER FUNCTIONS
  // ==========================================
  function renderAllWeatherViews() {
    if (!state.weather) return;

    const current = state.weather.current;
    const daily = state.weather.daily;
    const hourly = state.weather.hourly;

    const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);

    // Apply atmospheric theme
    elements.body.setAttribute('data-weather', weatherInfo.category);

    // 1. Hero Card
    if (elements.cardCity) elements.cardCity.textContent = state.city.name;
    if (elements.cardCountry) elements.cardCountry.textContent = state.city.country || 'Global';
    if (elements.cardRegion) {
      elements.cardRegion.textContent = state.city.admin1 
        ? `${state.city.admin1}${state.city.country ? ', ' + state.city.country : ''}`
        : state.city.country || 'Coordinates: ' + state.city.latitude.toFixed(2) + ', ' + state.city.longitude.toFixed(2);
    }

    if (elements.cardTemp) {
      elements.cardTemp.textContent = convertTemp(current.temperature_2m);
    }
    if (elements.cardTempUnit) {
      elements.cardTempUnit.textContent = state.unit === 'f' ? '°F' : '°C';
    }

    if (elements.cardCondition) {
      elements.cardCondition.textContent = weatherInfo.condition;
    }

    if (elements.heroWeatherIcon) {
      elements.heroWeatherIcon.innerHTML = weatherInfo.icon;
    }

    const feelsLikeVal = convertTemp(current.apparent_temperature);
    if (elements.cardFeelsLike) {
      elements.cardFeelsLike.textContent = `Feels like ${feelsLikeVal}°${state.unit.toUpperCase()}`;
    }

    // High / Low for today
    if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
      const highTemp = convertTemp(daily.temperature_2m_max[0]);
      const lowTemp = convertTemp(daily.temperature_2m_min[0]);
      if (elements.cardHighLow) {
        elements.cardHighLow.textContent = `H: ${highTemp}°  L: ${lowTemp}°`;
      }
      if (elements.chartHighBadge) elements.chartHighBadge.textContent = `Max: ${highTemp}°${state.unit.toUpperCase()}`;
      if (elements.chartLowBadge) elements.chartLowBadge.textContent = `Min: ${lowTemp}°${state.unit.toUpperCase()}`;
    }

    // Date & Time in local timezone
    updateDateTimeDisplay();

    // 2. Dynamic Weather AI Summary
    renderWeatherSummary(current, daily, weatherInfo);

    // 3. Sun Cycle & Daylight
    renderSunCycle(daily);

    // 4. Details Metrics Grid (9 Cards)
    renderMetricsGrid(current, daily);

    // 5. Hourly Forecast & Canvas Chart
    renderHourlyAndChart(hourly, current);

    // 6. 7-Day Forecast Grid
    renderDailyForecast(daily);
  }

  function updateDateTimeDisplay() {
    try {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: state.city.timezone || undefined
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: state.city.timezone || undefined
      }).format(now);

      if (elements.cardLocalTime) elements.cardLocalTime.textContent = `Local Time: ${timeStr}`;
      if (elements.cardLocalDate) elements.cardLocalDate.textContent = dateStr;
    } catch {
      if (elements.cardLocalTime) elements.cardLocalTime.textContent = 'Local Time: Active';
    }
  }

  function renderWeatherSummary(current, daily, weatherInfo) {
    if (!elements.weatherSummaryText) return;

    const maxTemp = daily?.temperature_2m_max?.[0] ? convertTemp(daily.temperature_2m_max[0]) : convertTemp(current.temperature_2m);
    const rainProb = daily?.precipitation_probability_max?.[0] ?? current.precipitation ?? 0;
    const windSpeed = current.wind_speed_10m || 0;
    const uv = daily?.uv_index_max?.[0] || 0;

    let rainPhrase = 'No precipitation expected.';
    if (rainProb > 50) {
      rainPhrase = `Expect a ${rainProb}% likelihood of showers today; carrying an umbrella is recommended.`;
    } else if (rainProb > 20) {
      rainPhrase = `There is an isolated ${rainProb}% chance of light passing rain.`;
    }

    let windPhrase = 'Gentle breezes prevailing.';
    if (windSpeed > 35) {
      windPhrase = `Caution: Gusty winds up to ${Math.round(windSpeed)} km/h.`;
    } else if (windSpeed > 18) {
      windPhrase = `Moderate winds up to ${Math.round(windSpeed)} km/h from the ${getWindDirectionCompass(current.wind_direction_10m)}.`;
    }

    let uvPhrase = '';
    if (uv >= 8) {
      uvPhrase = ' Very high UV index midday—sun protection strongly advised.';
    } else if (uv >= 6) {
      uvPhrase = ' Moderate-to-high UV index during peak sunlight hours.';
    }

    const summary = `Today in ${state.city.name}, expect ${weatherInfo.condition.toLowerCase()} with temperatures peaking around ${maxTemp}°${state.unit.toUpperCase()}. ${windPhrase} ${rainPhrase}${uvPhrase}`;
    elements.weatherSummaryText.textContent = summary;

    // Summary Tag Pills
    if (elements.summaryAirPill) {
      elements.summaryAirPill.textContent = windSpeed > 25 ? `💨 Strong Wind (${Math.round(windSpeed)} km/h)` : `💨 ${windSpeed > 12 ? 'Moderate' : 'Light'} Breeze`;
    }
    if (elements.summaryUvPill) {
      elements.summaryUvPill.textContent = uv >= 8 ? '☀️ Very High UV' : uv >= 6 ? '☀️ High UV' : uv >= 3 ? '☀️ Moderate UV' : '☀️ Low UV';
    }
    if (elements.summaryRainPill) {
      elements.summaryRainPill.textContent = rainProb > 40 ? `💧 ${rainProb}% Rain Prob` : '💧 Rain Unlikely';
    }
  }

  function renderSunCycle(daily) {
    if (!daily || !daily.sunrise || !daily.sunset) return;

    const sunriseIso = daily.sunrise[0];
    const sunsetIso = daily.sunset[0];

    const sunriseFormatted = formatTime(sunriseIso);
    const sunsetFormatted = formatTime(sunsetIso);

    if (elements.sunriseTime) elements.sunriseTime.textContent = sunriseFormatted;
    if (elements.sunsetTime) elements.sunsetTime.textContent = sunsetFormatted;

    // Calculate daylight duration
    const sunRiseDate = new Date(sunriseIso);
    const sunSetDate = new Date(sunsetIso);
    const diffMs = sunSetDate - sunRiseDate;
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (elements.daylightDuration) {
        elements.daylightDuration.textContent = `Daylight: ${hours}h ${minutes}m`;
      }
    }

    // Solar Arc Sun Position
    const now = new Date();
    let progressRatio = 0.5; // default noon
    let isDaytime = true;

    if (now < sunRiseDate) {
      progressRatio = 0.05;
      isDaytime = false;
    } else if (now > sunSetDate) {
      progressRatio = 0.95;
      isDaytime = false;
    } else if (diffMs > 0) {
      progressRatio = Math.min(Math.max((now - sunRiseDate) / diffMs, 0.05), 0.95);
      isDaytime = true;
    }

    if (elements.sunStatusPill) {
      elements.sunStatusPill.textContent = isDaytime ? 'Daytime' : 'Nighttime';
      elements.sunStatusPill.style.color = isDaytime ? 'var(--accent-amber)' : 'var(--accent-cyan)';
    }

    // Calculate position along arc: M 20 95 A 120 75 0 0 1 260 95
    // Angle from PI to 0
    const angle = Math.PI - progressRatio * Math.PI;
    const cx = 140;
    const cy = 95;
    const rx = 120;
    const ry = 75;
    const sunX = cx + rx * Math.cos(angle);
    const sunY = cy - ry * Math.sin(angle);

    if (elements.sunMarker) {
      elements.sunMarker.setAttribute('cx', sunX.toFixed(1));
      elements.sunMarker.setAttribute('cy', sunY.toFixed(1));
      elements.sunMarker.setAttribute('fill', isDaytime ? '#fbbf24' : '#38bdf8');
    }

    if (elements.solarProgressTrack) {
      const totalLen = 280;
      const offset = totalLen * (1 - progressRatio);
      elements.solarProgressTrack.style.strokeDashoffset = offset;
    }
  }

  function renderMetricsGrid(current, daily) {
    // 1. Feels Like
    if (elements.valFeelsLike) elements.valFeelsLike.textContent = convertTemp(current.apparent_temperature);
    if (elements.unitFeelsLike) elements.unitFeelsLike.textContent = state.unit === 'f' ? '°F' : '°C';
    if (elements.descFeelsLike) {
      const diff = Math.round(current.apparent_temperature - current.temperature_2m);
      if (diff > 1) {
        elements.descFeelsLike.textContent = `Feels ${Math.abs(diff)}° warmer due to humidity`;
      } else if (diff < -1) {
        elements.descFeelsLike.textContent = `Feels ${Math.abs(diff)}° cooler from wind chill`;
      } else {
        elements.descFeelsLike.textContent = 'Matches actual temperature';
      }
    }

    // 2. Humidity
    const humidity = current.relative_humidity_2m ?? '--';
    if (elements.valHumidity) elements.valHumidity.textContent = humidity;
    if (elements.barHumidity) elements.barHumidity.style.width = `${Math.min(humidity, 100)}%`;
    if (elements.descHumidity) {
      elements.descHumidity.textContent = humidity > 70 ? 'High moisture; feels muggy' : humidity < 35 ? 'Dry air; stay hydrated' : 'Comfortable relative level';
    }

    // 3. Wind Speed & Direction
    const windSpeed = current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 0;
    if (elements.valWindSpeed) elements.valWindSpeed.textContent = windSpeed;
    if (elements.compassArrow) {
      elements.compassArrow.style.transform = `rotate(${current.wind_direction_10m || 0}deg)`;
    }
    if (elements.valWindDirection) {
      const comp = getWindDirectionCompass(current.wind_direction_10m);
      elements.valWindDirection.textContent = `${comp} (${current.wind_direction_10m || 0}°)`;
    }

    // 4. Pressure
    const pressure = current.pressure_msl ? Math.round(current.pressure_msl) : 1013;
    if (elements.valPressure) elements.valPressure.textContent = pressure;
    if (elements.descPressure) {
      elements.descPressure.textContent = pressure > 1015 ? 'High pressure barometric system' : pressure < 1005 ? 'Low pressure weather front' : 'Stable standard pressure';
    }

    // 5. UV Index
    const uv = daily?.uv_index_max?.[0] !== undefined ? daily.uv_index_max[0] : '--';
    if (elements.valUvIndex) elements.valUvIndex.textContent = typeof uv === 'number' ? uv.toFixed(1) : uv;
    if (elements.uvMarker && typeof uv === 'number') {
      const pct = Math.min((uv / 12) * 100, 100);
      elements.uvMarker.style.left = `${pct}%`;
    }
    if (elements.descUvIndex && typeof uv === 'number') {
      elements.descUvIndex.textContent = uv <= 2 ? 'Minimal sun risk' : uv <= 5 ? 'Moderate; wear sunglasses' : uv <= 7 ? 'High protection required' : 'Very high/extreme hazard';
    }

    // 6. Precipitation
    const precip = current.precipitation !== undefined ? current.precipitation : 0;
    if (elements.valPrecipitation) elements.valPrecipitation.textContent = precip.toFixed(1);
    if (elements.descPrecipitation) {
      elements.descPrecipitation.textContent = precip > 0 ? `${precip} mm measured currently` : 'No rainfall measured';
    }

    // 7. Cloud Cover
    const clouds = current.cloud_cover ?? '--';
    if (elements.valCloudCover) elements.valCloudCover.textContent = clouds;
    if (elements.barCloudCover) elements.barCloudCover.style.width = `${Math.min(clouds, 100)}%`;
    if (elements.descCloudCover) {
      elements.descCloudCover.textContent = clouds > 80 ? 'Heavy overcast coverage' : clouds > 30 ? 'Partly cloudy sky' : 'Mostly clear visibility';
    }

    // 8. Rain Probability
    const rainProb = daily?.precipitation_probability_max?.[0] ?? 0;
    if (elements.valRainProb) elements.valRainProb.textContent = rainProb;
    if (elements.descRainProb) {
      elements.descRainProb.textContent = rainProb > 50 ? 'Rain showers likely' : rainProb > 20 ? 'Slight chance of rain' : 'Precipitation unlikely';
    }

    // 9. Visibility
    const visibilityKm = current.cloud_cover > 85 ? '7.5' : current.weather_code >= 45 && current.weather_code <= 48 ? '3.0' : '10.0';
    if (elements.valVisibility) elements.valVisibility.textContent = visibilityKm;
    if (elements.descVisibility) {
      elements.descVisibility.textContent = parseFloat(visibilityKm) >= 10 ? 'Optimal clear sightlines' : 'Reduced atmospheric visibility';
    }
  }

  function renderHourlyAndChart(hourly, current) {
    if (!hourly || !hourly.time || !hourly.temperature_2m) return;

    // Find current hour index
    const nowIsoPrefix = new Date().toISOString().slice(0, 13); // "2026-09-25T18"
    let startIndex = hourly.time.findIndex(t => t.startsWith(nowIsoPrefix));
    if (startIndex === -1) startIndex = 0;

    // Take next 24 hours
    const hoursCount = 24;
    const next24Times = hourly.time.slice(startIndex, startIndex + hoursCount);
    const next24Temps = hourly.temperature_2m.slice(startIndex, startIndex + hoursCount);
    const next24Codes = hourly.weather_code.slice(startIndex, startIndex + hoursCount);
    const next24Probs = hourly.precipitation_probability ? hourly.precipitation_probability.slice(startIndex, startIndex + hoursCount) : [];
    const next24Winds = hourly.wind_speed_10m ? hourly.wind_speed_10m.slice(startIndex, startIndex + hoursCount) : [];

    // Render Hourly Carousel Cards
    if (elements.hourlyCarousel) {
      elements.hourlyCarousel.innerHTML = '';
      next24Times.forEach((timeStr, idx) => {
        const item = document.createElement('div');
        item.className = `hourly-card-item ${idx === 0 ? 'now' : ''}`;

        const isCurrentHour = idx === 0;
        const timeLabel = isCurrentHour ? 'Now' : formatTime(timeStr).replace(':00', '');
        const temp = convertTemp(next24Temps[idx]);
        const code = next24Codes[idx];
        const prob = next24Probs[idx] ?? 0;
        const wind = next24Winds[idx] ? Math.round(next24Winds[idx]) : 0;
        
        // determine isDay for hour
        const hourNum = new Date(timeStr).getHours();
        const isDayHour = hourNum >= 6 && hourNum < 19;
        const iconInfo = getWeatherInfo(code, isDayHour ? 1 : 0);

        item.innerHTML = `
          <span class="hour-time">${timeLabel}</span>
          <div class="hour-icon">${iconInfo.icon}</div>
          <span class="hour-temp">${temp}°</span>
          <span class="hour-rain">${prob > 0 ? `💧${prob}%` : '—'}</span>
          <span class="hour-wind">${wind} km/h</span>
        `;
        elements.hourlyCarousel.appendChild(item);
      });
    }

    // Render Canvas Temperature Chart
    drawTemperatureChart(next24Times, next24Temps);
  }

  function drawTemperatureChart(times, tempsCelsius) {
    const canvas = elements.tempChart;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.parentElement.clientWidth || 500;
    const height = 190;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const convertedTemps = tempsCelsius.map(t => convertTemp(t));
    const minTemp = Math.min(...convertedTemps);
    const maxTemp = Math.max(...convertedTemps);
    const tempRange = Math.max(maxTemp - minTemp, 4);

    const padLeft = 24;
    const padRight = 24;
    const padTop = 32;
    const padBottom = 32;
    const graphWidth = width - padLeft - padRight;
    const graphHeight = height - padTop - padBottom;

    const points = convertedTemps.map((val, i) => {
      const x = padLeft + (i / (convertedTemps.length - 1)) * graphWidth;
      const y = padTop + graphHeight - ((val - minTemp) / tempRange) * graphHeight;
      return { x, y, temp: val, time: times[i] };
    });

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Smooth Curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    gradient.addColorStop(0, state.theme === 'dark' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    ctx.save();
    ctx.lineTo(points[points.length - 1].x, height - padBottom);
    ctx.lineTo(points[0].x, height - padBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // Stroke the line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = state.theme === 'dark' ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw Points & Labels (Sample every 3-4 hours)
    const step = Math.max(Math.floor(points.length / 6), 1);
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';

    points.forEach((pt, idx) => {
      const isPeak = pt.temp === maxTemp;
      const isLow = pt.temp === minTemp;
      const isSampled = idx % step === 0 || isPeak || isLow || idx === points.length - 1;

      if (isSampled) {
        // Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isPeak || isLow ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isPeak ? '#fbbf24' : isLow ? '#38bdf8' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#0b0f19';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Temperature label
        ctx.fillStyle = state.theme === 'dark' ? '#f8fafc' : '#0f172a';
        ctx.fillText(`${pt.temp}°`, pt.x, pt.y - 10);

        // Time label on X-axis
        const hourTime = formatTime(pt.time).replace(':00', '');
        ctx.fillStyle = state.theme === 'dark' ? '#94a3b8' : '#64748b';
        ctx.fillText(idx === 0 ? 'Now' : hourTime, pt.x, height - 10);
      }
    });

    // Store points for tooltip interactivity
    canvas._chartPoints = points;
  }

  function renderDailyForecast(daily) {
    if (!daily || !daily.time || !elements.dailyForecastGrid) return;

    elements.dailyForecastGrid.innerHTML = '';
    const dayCount = Math.min(daily.time.length, 7);

    // Find global min and max across the week for relative bars
    const allMins = daily.temperature_2m_min.map(t => convertTemp(t));
    const allMaxs = daily.temperature_2m_max.map(t => convertTemp(t));
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const globalRange = Math.max(globalMax - globalMin, 1);

    for (let i = 0; i < dayCount; i++) {
      const timeIso = daily.time[i];
      const isToday = i === 0;
      const dayName = isToday ? 'TODAY' : formatDate(timeIso).split(',')[0].toUpperCase();
      const dateSub = formatDate(timeIso).split(',')[1] || '';
      
      const code = daily.weather_code[i];
      const weatherInfo = getWeatherInfo(code, 1);
      const minTemp = convertTemp(daily.temperature_2m_min[i]);
      const maxTemp = convertTemp(daily.temperature_2m_max[i]);
      const rainProb = daily.precipitation_probability_max?.[i] ?? 0;

      // Range Bar percent
      const leftPct = ((minTemp - globalMin) / globalRange) * 100;
      const widthPct = Math.max(((maxTemp - minTemp) / globalRange) * 100, 10);

      const card = document.createElement('div');
      card.className = `glass-card daily-card ${isToday ? 'today' : ''}`;
      card.innerHTML = `
        <div class="day-header">
          <span class="day-name">${dayName}</span>
          <span class="day-date">${dateSub.trim()}</span>
        </div>
        <div class="day-icon">${weatherInfo.icon}</div>
        <span class="day-condition">${weatherInfo.condition}</span>
        <span class="day-rain-prob">${rainProb > 0 ? `💧 ${rainProb}%` : ''}</span>
        <div class="day-temp-bar-container">
          <span class="min-temp">${minTemp}°</span>
          <div class="temp-bar-track">
            <div class="temp-bar-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
          </div>
          <span class="max-temp">${maxTemp}°</span>
        </div>
      `;
      elements.dailyForecastGrid.appendChild(card);
    }
  }

  // ==========================================
  // 9. RECENT SEARCHES & FAVORITES
  // ==========================================
  function addRecentCity(cityObj) {
    if (!cityObj || !cityObj.name) return;
    
    // De-duplicate
    state.recentSearches = state.recentSearches.filter(
      item => item.name.toLowerCase() !== cityObj.name.toLowerCase()
    );
    state.recentSearches.unshift({
      name: cityObj.name,
      country: cityObj.country || '',
      admin1: cityObj.admin1 || '',
      latitude: cityObj.latitude,
      longitude: cityObj.longitude,
      timezone: cityObj.timezone || 'auto'
    });

    // Keep at most 5
    if (state.recentSearches.length > 5) {
      state.recentSearches = state.recentSearches.slice(0, 5);
    }

    localStorage.setItem('skycast_recents', JSON.stringify(state.recentSearches));
    renderRecentSearches();
  }

  function renderRecentSearches() {
    if (!elements.recentChips) return;
    elements.recentChips.innerHTML = '';

    if (state.recentSearches.length === 0) {
      elements.recentChips.innerHTML = '<span style="color:var(--text-muted);font-style:italic">No recent searches</span>';
      return;
    }

    state.recentSearches.forEach(city => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recent-chip';
      chip.textContent = `${city.name}${city.country ? ', ' + city.country : ''}`;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        loadWeatherForCity(city);
      });
      elements.recentChips.appendChild(chip);
    });
  }

  function isCurrentCityFavorited() {
    return state.favorites.some(
      fav => fav.name.toLowerCase() === state.city.name.toLowerCase()
    );
  }

  function toggleFavoriteCity() {
    const isFav = isCurrentCityFavorited();
    if (isFav) {
      state.favorites = state.favorites.filter(
        fav => fav.name.toLowerCase() !== state.city.name.toLowerCase()
      );
      showToast(`${state.city.name} removed from favorites`, 'info');
    } else {
      state.favorites.push({
        name: state.city.name,
        country: state.city.country || '',
        admin1: state.city.admin1 || '',
        latitude: state.city.latitude,
        longitude: state.city.longitude,
        timezone: state.city.timezone || 'auto'
      });
      showToast(`${state.city.name} added to favorites!`, 'success');
    }

    localStorage.setItem('skycast_favorites', JSON.stringify(state.favorites));
    updateFavoriteButtonState();
    renderFavoritesList();
  }

  function updateFavoriteButtonState() {
    if (!elements.favoriteToggleBtn) return;
    const isFav = isCurrentCityFavorited();
    elements.favoriteToggleBtn.classList.toggle('favorited', isFav);
    elements.favoriteToggleBtn.setAttribute('title', isFav ? 'Remove from favorites' : 'Add to favorites');
  }

  function renderFavoritesList() {
    if (!elements.favoritesList || !elements.favoritesCount) return;

    elements.favoritesCount.textContent = `${state.favorites.length} saved`;
    elements.favoritesList.innerHTML = '';

    if (state.favorites.length === 0) {
      if (elements.favoritesEmpty) {
        elements.favoritesList.appendChild(elements.favoritesEmpty);
        elements.favoritesEmpty.style.display = 'block';
      }
      return;
    }

    state.favorites.forEach((favCity, index) => {
      const chip = document.createElement('div');
      chip.className = 'favorite-city-chip';
      chip.innerHTML = `
        <span class="fav-chip-name">★ ${favCity.name}${favCity.country ? ', ' + favCity.country : ''}</span>
        <button class="fav-chip-remove" title="Remove" aria-label="Remove favorite">×</button>
      `;

      // Click on chip loads city
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-chip-remove')) return;
        loadWeatherForCity(favCity);
      });

      // Remove button
      const removeBtn = chip.querySelector('.fav-chip-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.favorites.splice(index, 1);
        localStorage.setItem('skycast_favorites', JSON.stringify(state.favorites));
        renderFavoritesList();
        updateFavoriteButtonState();
        showToast(`${favCity.name} removed from favorites`, 'info');
      });

      elements.favoritesList.appendChild(chip);
    });
  }

  // ==========================================
  // 10. SEARCH & AUTOCOMPLETE
  // ==========================================
  async function handleSearchInput(e) {
    const val = e.target.value.trim();
    if (elements.searchClearBtn) {
      elements.searchClearBtn.style.display = val ? 'flex' : 'none';
    }

    clearTimeout(state.searchDebounceTimer);
    if (!val || val.length < 2) {
      closeDropdown();
      return;
    }

    state.searchDebounceTimer = setTimeout(async () => {
      showDropdownLoading();
      const results = await searchCitiesApi(val);
      renderSearchResults(results);
    }, 300);
  }

  function showDropdownLoading() {
    if (!elements.searchDropdown) return;
    elements.searchDropdown.innerHTML = '<div class="dropdown-loading">Searching cities...</div>';
    elements.searchDropdown.classList.add('active');
  }

  function renderSearchResults(results) {
    if (!elements.searchDropdown) return;

    if (!results || results.length === 0) {
      elements.searchDropdown.innerHTML = '<div class="dropdown-empty">No cities found. Try checking the spelling.</div>';
      elements.searchDropdown.classList.add('active');
      return;
    }

    elements.searchDropdown.innerHTML = '';
    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('role', 'option');
      item.innerHTML = `
        <div class="item-left">
          <span class="item-name">${escapeHtml(res.name)}</span>
          <span class="item-admin">${escapeHtml(res.admin1 ? res.admin1 + ', ' : '')}${escapeHtml(res.country || '')}</span>
        </div>
        <span class="item-badge">${escapeHtml(res.country_code || 'GEO')}</span>
      `;

      item.addEventListener('click', () => {
        closeDropdown();
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';
        loadWeatherForCity(res);
      });

      elements.searchDropdown.appendChild(item);
    });

    elements.searchDropdown.classList.add('active');
  }

  function closeDropdown() {
    if (elements.searchDropdown) {
      elements.searchDropdown.classList.remove('active');
    }
  }

  async function performExplicitSearch() {
    if (!elements.searchInput) return;
    const query = elements.searchInput.value.trim();

    if (!query) {
      showToast('Please enter a city name to search.', 'info');
      elements.searchInput.focus();
      return;
    }

    closeDropdown();
    showToast(`Searching for "${query}"...`, 'info', 2000);
    setLoadingState(true);

    try {
      const results = await searchCitiesApi(query);
      if (results && results.length > 0) {
        elements.searchInput.value = '';
        if (elements.searchClearBtn) elements.searchClearBtn.style.display = 'none';
        await loadWeatherForCity(results[0]);
      } else {
        showToast(`City "${query}" not found. Please try another name.`, 'error');
      }
    } catch (err) {
      showToast(`Search failed: ${err.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  // ==========================================
  // 11. GEOLOCATION (My Location)
  // ==========================================
  function handleUseMyLocation() {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    showToast('Detecting your GPS location...', 'info', 3000);
    setLoadingState(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          // Attempt reverse geocoding via free client-side endpoint
          let cityName = 'Current Location';
          let countryName = '';
          try {
            const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (revRes.ok) {
              const revData = await revRes.json();
              cityName = revData.city || revData.locality || revData.principalSubdivision || 'Current Location';
              countryName = revData.countryName || '';
            }
          } catch {
            cityName = 'Detected Location';
          }

          const locationCity = {
            name: cityName,
            country: countryName,
            admin1: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
            latitude: lat,
            longitude: lon,
            timezone: 'auto'
          };

          await loadWeatherForCity(locationCity);
          showToast(`Weather loaded for ${cityName}!`, 'success');
        } catch (err) {
          showToast('Failed to retrieve weather for current position.', 'error');
        } finally {
          setLoadingState(false);
        }
      },
      (error) => {
        setLoadingState(false);
        let msg = 'Location access denied. Please type your city in the search bar.';
        if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location unavailable. Please search manually.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out. Please try again or search manually.';
        showToast(msg, 'error', 4500);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // ==========================================
  // 12. THEME & UNIT TOGGLES
  // ==========================================
  function setUnit(unit) {
    if (state.unit === unit) return;
    state.unit = unit;
    localStorage.setItem('skycast_unit', unit);

    if (elements.unitCelsiusBtn) elements.unitCelsiusBtn.classList.toggle('active', unit === 'c');
    if (elements.unitFahrenheitBtn) elements.unitFahrenheitBtn.classList.toggle('active', unit === 'f');

    // Immediately re-render without network refetch
    renderAllWeatherViews();
    showToast(`Switched units to °${unit.toUpperCase()}`, 'info', 1500);
  }

  function setTheme(theme) {
    state.theme = theme;
    elements.html.setAttribute('data-theme', theme);
    localStorage.setItem('skycast_theme', theme);

    // Redraw canvas with new theme colors
    if (state.weather) {
      const hourly = state.weather.hourly;
      if (hourly) {
        const nowIsoPrefix = new Date().toISOString().slice(0, 13);
        let startIndex = hourly.time.findIndex(t => t.startsWith(nowIsoPrefix));
        if (startIndex === -1) startIndex = 0;
        drawTemperatureChart(
          hourly.time.slice(startIndex, startIndex + 24),
          hourly.temperature_2m.slice(startIndex, startIndex + 24)
        );
      }
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }

  // ==========================================
  // 13. CHART TOOLTIP INTERACTION
  // ==========================================
  function setupChartInteractivity() {
    const canvas = elements.tempChart;
    const tooltip = elements.chartTooltip;
    if (!canvas || !tooltip) return;

    canvas.addEventListener('mousemove', (e) => {
      const points = canvas._chartPoints;
      if (!points || points.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Find closest point
      let closestPt = points[0];
      let minDistance = Math.abs(mouseX - points[0].x);

      for (let i = 1; i < points.length; i++) {
        const dist = Math.abs(mouseX - points[i].x);
        if (dist < minDistance) {
          minDistance = dist;
          closestPt = points[i];
        }
      }

      if (minDistance < 35) {
        const timeFormatted = formatTime(closestPt.time);
        tooltip.innerHTML = `<strong>${timeFormatted}</strong>: ${closestPt.temp}°${state.unit.toUpperCase()}`;
        tooltip.style.left = `${closestPt.x}px`;
        tooltip.style.top = `${closestPt.y}px`;
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  // ==========================================
  // 14. EVENT LISTENERS SETUP
  // ==========================================
  function setupEventListeners() {
    // Search Form Submit & Enter Key
    if (elements.searchForm) {
      elements.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performExplicitSearch();
      });
    }

    if (elements.searchBtn) {
      elements.searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performExplicitSearch();
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', handleSearchInput);
      elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performExplicitSearch();
        } else if (e.key === 'Escape') {
          closeDropdown();
        }
      });
    }

    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', () => {
        if (elements.searchInput) {
          elements.searchInput.value = '';
          elements.searchInput.focus();
        }
        elements.searchClearBtn.style.display = 'none';
        closeDropdown();
      });
    }

    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        closeDropdown();
      }
    });

    // Recent Searches Clear Button
    if (elements.clearRecentBtn) {
      elements.clearRecentBtn.addEventListener('click', () => {
        state.recentSearches = [];
        localStorage.removeItem('skycast_recents');
        renderRecentSearches();
        showToast('Recent searches cleared', 'info');
      });
    }

    // Geolocation "My Location"
    if (elements.currentLocationBtn) {
      elements.currentLocationBtn.addEventListener('click', handleUseMyLocation);
    }

    // Unit Toggles
    if (elements.unitCelsiusBtn) {
      elements.unitCelsiusBtn.addEventListener('click', () => setUnit('c'));
    }
    if (elements.unitFahrenheitBtn) {
      elements.unitFahrenheitBtn.addEventListener('click', () => setUnit('f'));
    }

    // Theme Toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Favorite Toggle Button on Hero Card
    if (elements.favoriteToggleBtn) {
      elements.favoriteToggleBtn.addEventListener('click', toggleFavoriteCity);
    }

    // Refresh Button on Hero Card
    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', () => {
        showToast(`Refreshing weather for ${state.city.name}...`, 'info', 1500);
        loadWeatherForCity(state.city, false);
      });
    }

    // Hourly Forecast Scroll Arrows
    if (elements.hourlyScrollLeft && elements.hourlyCarousel) {
      elements.hourlyScrollLeft.addEventListener('click', () => {
        elements.hourlyCarousel.scrollBy({ left: -260, behavior: 'smooth' });
      });
    }
    if (elements.hourlyScrollRight && elements.hourlyCarousel) {
      elements.hourlyScrollRight.addEventListener('click', () => {
        elements.hourlyCarousel.scrollBy({ left: 260, behavior: 'smooth' });
      });
    }

    // Offline / Online Detection
    window.addEventListener('online', () => {
      if (elements.offlineBanner) elements.offlineBanner.style.display = 'none';
      showToast('Back online! Syncing live weather...', 'success');
      loadWeatherForCity(state.city, false);
    });

    window.addEventListener('offline', () => {
      if (elements.offlineBanner) elements.offlineBanner.style.display = 'flex';
      showToast('You are currently offline. Showing cached weather.', 'error');
    });

    // Window Resize -> Redraw chart
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.weather && state.weather.hourly) {
          const hourly = state.weather.hourly;
          const nowIsoPrefix = new Date().toISOString().slice(0, 13);
          let startIndex = hourly.time.findIndex(t => t.startsWith(nowIsoPrefix));
          if (startIndex === -1) startIndex = 0;
          drawTemperatureChart(
            hourly.time.slice(startIndex, startIndex + 24),
            hourly.temperature_2m.slice(startIndex, startIndex + 24)
          );
        }
      }, 150);
    });

    setupChartInteractivity();
  }

  // ==========================================
  // 15. INITIALIZATION
  // ==========================================
  function init() {
    // 1. Restore Theme
    setTheme(state.theme);

    // 2. Restore Unit UI
    if (elements.unitCelsiusBtn && elements.unitFahrenheitBtn) {
      elements.unitCelsiusBtn.classList.toggle('active', state.unit === 'c');
      elements.unitFahrenheitBtn.classList.toggle('active', state.unit === 'f');
    }

    // 3. Render Recents & Favorites
    renderRecentSearches();
    renderFavoritesList();

    // 4. Setup Events
    setupEventListeners();

    // 5. Initial Weather Load (Default: Delhi, or first favorite if exists)
    const initialCity = state.favorites.length > 0 ? state.favorites[0] : state.city;
    loadWeatherForCity(initialCity, false);
  }

  // Execute on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
