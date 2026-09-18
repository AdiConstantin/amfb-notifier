import {
  AMFB_VENUE,
  AMFB_VENUE_LAT,
  AMFB_VENUE_LON,
} from "./config";
import type { MatchWeather, WeatherAlert } from "./types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

/** Short-lived cache so cron/UI don't spam free APIs for the same match hour */
const weatherCache = new Map<string, { at: number; value: MatchWeather | null }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Alerts derived only from Open-Meteo at AMFB_VENUE_LAT/LON (Teren CORESI).
 * No București / Ilfov / national geographic filters — ANM zones are too broad.
 */
function buildPointAlerts(opts: {
  temperatureC: number | null;
  windKmh: number | null;
  weatherCode: number | null;
  precipitationProbability: number | null;
  precipMm: number;
}): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const { temperatureC, windKmh, weatherCode, precipitationProbability, precipMm } = opts;

  if (temperatureC != null) {
    if (temperatureC >= 40) {
      alerts.push({ level: "roșu", event: "Caniculă extremă (~" + temperatureC + "°C)" });
    } else if (temperatureC >= 37) {
      alerts.push({ level: "portocaliu", event: "Caniculă (~" + temperatureC + "°C)" });
    } else if (temperatureC >= 35) {
      alerts.push({ level: "galben", event: "Căldură puternică (~" + temperatureC + "°C)" });
    } else if (temperatureC <= -15) {
      alerts.push({ level: "roșu", event: "Ger extrem (~" + temperatureC + "°C)" });
    } else if (temperatureC <= -10) {
      alerts.push({ level: "portocaliu", event: "Ger (~" + temperatureC + "°C)" });
    } else if (temperatureC <= 0) {
      alerts.push({ level: "galben", event: "Temperatura la/sub 0°C (~" + temperatureC + "°C)" });
    }
  }

  if (windKmh != null) {
    if (windKmh >= 90) {
      alerts.push({ level: "roșu", event: "Vânt foarte puternic (~" + windKmh + " km/h)" });
    } else if (windKmh >= 70) {
      alerts.push({ level: "portocaliu", event: "Vânt puternic (~" + windKmh + " km/h)" });
    } else if (windKmh >= 50) {
      alerts.push({ level: "galben", event: "Vânt intens (~" + windKmh + " km/h)" });
    }
  }

  // WMO weather codes: https://open-meteo.com/en/docs
  if (weatherCode != null) {
    if ([95, 96, 99].includes(weatherCode)) {
      alerts.push({ level: "portocaliu", event: "Furtună / grindină posibilă" });
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      alerts.push({ level: "galben", event: "Ninsoare estimată" });
    } else if ([65, 67, 82].includes(weatherCode) || precipMm >= 5) {
      alerts.push({ level: "galben", event: "Ploaie torențială posibilă" });
    }
  }

  if (
    precipitationProbability != null &&
    precipitationProbability >= 80 &&
    !alerts.some((a) => a.event.toLowerCase().includes("ploaie") || a.event.toLowerCase().includes("furtună"))
  ) {
    alerts.push({
      level: "galben",
      event: `Ploaie foarte probabilă (~${precipitationProbability}%)`,
    });
  }

  return alerts;
}

function pickHourlyIndex(times: string[], matchLocalHour: string): number {
  const exact = times.findIndex(
    (t) => t === matchLocalHour || t.startsWith(matchLocalHour.slice(0, 13))
  );
  if (exact >= 0) return exact;

  const target = new Date(matchLocalHour.includes("T") ? matchLocalHour : `${matchLocalHour}:00`);
  let best = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const d = new Date(times[i]);
    const diff = Math.abs(d.getTime() - target.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

export async function getWeatherForMatch(dateISO: string): Promise<MatchWeather | null> {
  if (!dateISO) return null;

  const cacheKey = dateISO.slice(0, 13); // YYYY-MM-DDTHH
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const matchDate = new Date(dateISO);
    if (Number.isNaN(matchDate.getTime())) return null;

    const localParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Bucharest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(matchDate);
    const get = (t: string) => localParts.find((p) => p.type === t)?.value ?? "00";
    const localHour = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;

    const daysAhead = Math.ceil(
      (matchDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    const forecastDays = Math.min(16, Math.max(1, daysAhead + 1));

    // Strictly venue coords from config (Teren Fotbal Coresi) — not city/county
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set("latitude", String(AMFB_VENUE_LAT));
    url.searchParams.set("longitude", String(AMFB_VENUE_LON));
    url.searchParams.set(
      "hourly",
      "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m"
    );
    url.searchParams.set("timezone", "Europe/Bucharest");
    url.searchParams.set("forecast_days", String(forecastDays));

    const res = await fetch(url.toString(), {
      headers: { "user-agent": "AMFB-Notifier/1.0" },
    });

    if (!res.ok) {
      console.error("Open-Meteo HTTP", res.status);
      weatherCache.set(cacheKey, { at: Date.now(), value: null });
      return null;
    }

    const data = await res.json();
    const times: string[] = data?.hourly?.time ?? [];
    if (!times.length) {
      weatherCache.set(cacheKey, { at: Date.now(), value: null });
      return null;
    }

    const idx = pickHourlyIndex(times, localHour);
    const temperatureC =
      typeof data.hourly.temperature_2m?.[idx] === "number"
        ? Math.round(data.hourly.temperature_2m[idx])
        : null;
    const precipitationProbability =
      typeof data.hourly.precipitation_probability?.[idx] === "number"
        ? Math.round(data.hourly.precipitation_probability[idx])
        : null;
    const precipMm =
      typeof data.hourly.precipitation?.[idx] === "number"
        ? data.hourly.precipitation[idx]
        : 0;
    const windKmh =
      typeof data.hourly.wind_speed_10m?.[idx] === "number"
        ? Math.round(data.hourly.wind_speed_10m[idx])
        : null;
    const weatherCode =
      typeof data.hourly.weather_code?.[idx] === "number"
        ? data.hourly.weather_code[idx]
        : null;

    const willRain =
      (precipitationProbability != null && precipitationProbability >= 40) ||
      precipMm > 0.1;

    const alerts = buildPointAlerts({
      temperatureC,
      windKmh,
      weatherCode,
      precipitationProbability,
      precipMm,
    });

    const value: MatchWeather = {
      temperatureC,
      precipitationProbability,
      willRain,
      windKmh,
      venueLabel: AMFB_VENUE,
      latitude: AMFB_VENUE_LAT,
      longitude: AMFB_VENUE_LON,
      alerts,
      attribution: `Open-Meteo @ ${AMFB_VENUE} (${AMFB_VENUE_LAT}, ${AMFB_VENUE_LON})`,
    };
    weatherCache.set(cacheKey, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error("getWeatherForMatch failed:", error);
    weatherCache.set(cacheKey, { at: Date.now(), value: null });
    return null;
  }
}

export function formatWeatherText(w: MatchWeather): string {
  const lines: string[] = [];
  lines.push(`PROGNOZĂ (${w.venueLabel}, ora meciului):`);

  const bits: string[] = [];
  if (w.temperatureC != null) bits.push(`~${w.temperatureC}°C`);
  if (w.precipitationProbability != null) {
    bits.push(
      w.willRain
        ? `ploaie posibilă (~${w.precipitationProbability}%)`
        : `șanse ploaie ~${w.precipitationProbability}%`
    );
  } else if (w.willRain) {
    bits.push("ploaie posibilă");
  } else {
    bits.push("fără ploaie estimată");
  }
  if (w.windKmh != null && w.windKmh >= 40) {
    bits.push(`vânt ~${w.windKmh} km/h`);
  }
  lines.push(bits.join(" · "));

  if (w.alerts.length > 0) {
    for (const a of w.alerts) {
      lines.push(`Alertă ${a.level}: ${a.event}`);
    }
  }

  lines.push(`Sursă: ${w.attribution}`);
  return lines.join("\n");
}
