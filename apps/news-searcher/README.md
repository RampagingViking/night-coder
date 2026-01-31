# Gaming & Security News Searcher

A simple web app + API to search for gaming and cybersecurity news using Exa AI.

## Two Ways to Use

### 1. Web App (Browser)

```bash
cd apps/news-searcher
node server.js
```

Then open http://localhost:3000 in your browser.

### 2. Discord (Chat)

Just ask Data to search! Examples:
- "Search for gaming news"
- "Search for cybersecurity"
- "Search for [any topic]"

Data has the Exa plugin and will show results directly in Discord.

## API

GET `http://localhost:3000/api/search?query=your-search-term`

Returns JSON with search results.

## Files

- `index.html` - The web UI
- `server.js` - Node.js server
- `README.md` - This file

## Security Note

The Exa API key is hardcoded in `server.js`. For production, use environment variables:
```javascript
const EXA_API_KEY = process.env.EXA_API_KEY;
```

Then run: `EXA_API_KEY=your-key node server.js`

## Author

Built by Brian with AI assistance (Data)
