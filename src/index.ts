#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.open-meteo.com/v1";
const GEO = "https://geocoding-api.open-meteo.com/v1";
const RATE_LIMIT_MS = 200;
let last = 0;

async function omFetch(url: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-openmeteo", version: "1.0.0" });

server.tool("get_weather", "Get current weather and 7-day forecast. Free, no API key.", {
  latitude: z.number(), longitude: z.number(),
  units: z.enum(["metric", "imperial"]).default("metric"),
}, async ({ latitude, longitude, units }) => {
  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";
  const d = await omFetch(`${BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("get_hourly", "Get hourly forecast (48h).", {
  latitude: z.number(), longitude: z.number(),
}, async ({ latitude, longitude }) => {
  const d = await omFetch(`${BASE}/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&forecast_hours=48&timezone=auto`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("get_historical", "Get historical weather data.", {
  latitude: z.number(), longitude: z.number(),
  startDate: z.string().describe("YYYY-MM-DD"), endDate: z.string().describe("YYYY-MM-DD"),
}, async ({ latitude, longitude, startDate, endDate }) => {
  const d = await omFetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("get_air_quality", "Get air quality index and pollutant levels.", {
  latitude: z.number(), longitude: z.number(),
}, async ({ latitude, longitude }) => {
  const d = await omFetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("geocode", "Convert location name to coordinates.", {
  name: z.string().describe("City/place name"), count: z.number().min(1).max(10).default(3),
}, async ({ name, count }) => {
  const d = await omFetch(`${GEO}/search?name=${encodeURIComponent(name)}&count=${count}`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d.results?.map((r: any) => ({
    name: r.name, country: r.country, admin1: r.admin1, latitude: r.latitude, longitude: r.longitude,
    timezone: r.timezone, population: r.population,
  })), null, 2) }] };
});

server.tool("get_marine", "Get marine/ocean forecast.", {
  latitude: z.number(), longitude: z.number(),
}, async ({ latitude, longitude }) => {
  const d = await omFetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wave_period&daily=wave_height_max,wave_period_max&timezone=auto`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
