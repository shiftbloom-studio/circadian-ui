// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Sunrise and sunset for the demo cities, calculated in the browser with the sunrise equation
 * (accurate to a minute or two, which is plenty for picking a theme). circadian-ui itself does not
 * ship astronomy: you hand it a SunTimesProvider, and this file is the one the demo uses.
 */

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tz: string;
}

export const CITIES: City[] = [
  { id: "berlin", name: "Berlin", lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { id: "reykjavik", name: "Reykjavík", lat: 64.147, lon: -21.94, tz: "Atlantic/Reykjavik" },
  { id: "tromso", name: "Tromsø", lat: 69.649, lon: 18.956, tz: "Europe/Oslo" },
  { id: "new-york", name: "New York", lat: 40.713, lon: -74.006, tz: "America/New_York" },
  { id: "singapore", name: "Singapore", lat: 1.352, lon: 103.82, tz: "Asia/Singapore" },
  { id: "tokyo", name: "Tokyo", lat: 35.68, lon: 139.69, tz: "Asia/Tokyo" },
  { id: "cape-town", name: "Cape Town", lat: -33.925, lon: 18.424, tz: "Africa/Johannesburg" },
  { id: "ushuaia", name: "Ushuaia", lat: -54.802, lon: -68.303, tz: "America/Argentina/Ushuaia" }
];

export interface DayChoice {
  id: string;
  label: string;
  month: number;
  day: number;
}

export const DAYS: DayChoice[] = [
  { id: "mar", label: "20 Mar", month: 2, day: 20 },
  { id: "jun", label: "21 Jun", month: 5, day: 21 },
  { id: "sep", label: "22 Sep", month: 8, day: 22 },
  { id: "dec", label: "21 Dec", month: 11, day: 21 }
];

const rad = Math.PI / 180;

export type SunResult =
  | { kind: "normal"; sunriseUtc: Date; sunsetUtc: Date }
  | { kind: "polar-day" }
  | { kind: "polar-night" };

/** Sunrise equation, see https://en.wikipedia.org/wiki/Sunrise_equation */
export function sunriseSunset(year: number, month: number, day: number, lat: number, lon: number): SunResult {
  const midnightUtc = Date.UTC(year, month, day);
  const jd = midnightUtc / 86400000 + 2440587.5;
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  const jStar = n - lon / 360;
  const m = (357.5291 + 0.98560028 * jStar) % 360;
  const c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
  const lambda = (m + c + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDec = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDec) / (Math.cos(lat * rad) * cosDec);
  if (cosW < -1) return { kind: "polar-day" };
  if (cosW > 1) return { kind: "polar-night" };
  const w = Math.acos(cosW) / rad;
  const toDate = (j: number) => new Date((j - 2440587.5) * 86400000);
  return { kind: "normal", sunriseUtc: toDate(jTransit - w / 360), sunsetUtc: toDate(jTransit + w / 360) };
}

const formatters = new Map<string, Intl.DateTimeFormat>();
const fmt = (tz: string) => {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    formatters.set(tz, f);
  }
  return f;
};

/** Minutes after local midnight in a time zone. */
export function minutesIn(tz: string, at: Date): number {
  const parts = fmt(tz).formatToParts(at);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mi = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (h % 24) * 60 + mi;
}

export const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
export const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();
