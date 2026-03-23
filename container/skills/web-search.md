# Web Search Skill

This skill teaches the agent how to perform web searches using CLI tools.

## Available Tools

### Search APIs

The agent can use:

1. **ddgr** (DuckDuckGo CLI) - Install with `npm install -g ddgr`
2. **brave-search** - Install with `npm install -g @brave-search/cli`
3. **curl** with DuckDuckGo instant answers API

## Usage Pattern

```bash
# Example: Search for weather
ddgr "weather today"

# Example: Search for news
brave-search "tech news"

# Example: Use curl directly
curl "https://api.duckduckgo.com/?q=programming"
```

## Best Practices

1. **Use concise queries** - Search engines prefer short, focused queries
2. **Avoid authentication** - Most search APIs work without auth for basic use
3. **Parse results** - Extract relevant information from search results
4. **Handle errors** - Check for empty results or network issues

## Example Workflow

```
User: "What's the weather today?"
→ Agent uses ddgr "weather today"
→ Parses results
→ Responds with weather information
```

## Installation

```bash
# Install ddgr
npm install -g ddgr

# Or install brave-search
npm install -g @brave-search/cli
```

## Notes

- Search results may vary by region
- Some APIs require API keys for production use
- Rate limits may apply for frequent searches
- Consider caching results for common queries
