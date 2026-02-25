# mcp-openmeteo

Get weather forecasts, historical data, air quality, and marine conditions — free, no API key.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `get_weather` | Get current weather and 7-day forecast. Free, no API key. |
| `get_hourly` | Get hourly forecast (48h). |
| `get_historical` | Get historical weather data. |
| `get_air_quality` | Get air quality index and pollutant levels. |
| `geocode` | Convert location name to coordinates. |
| `get_marine` | Get marine/ocean forecast. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-openmeteo.git
cd mcp-openmeteo
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openmeteo": {
      "command": "node",
      "args": ["/path/to/mcp-openmeteo/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-openmeteo
```

## License

MIT
