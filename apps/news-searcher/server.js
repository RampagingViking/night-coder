// Simple web server for the news searcher app
const http = require('http');
const fs = require('fs');
const path = require('path');

// Your Exa API key (keep this secret!)
const EXA_API_KEY = '65d9409f-130f-42e9-a4ed-d2bd2bd084f4';

const PORT = process.env.PORT || 3000;

// Read the HTML file
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// API endpoint for search
async function searchExa(query) {
    const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
            query: query,
            numResults: 5,
            type: 'fast',
            contents: { text: { maxCharacters: 500 } }
        })
    });
    return await response.json();
}

// Create server
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API endpoint: /api/search?query=...
    if (req.url.startsWith('/api/search') && req.method === 'GET') {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const query = url.searchParams.get('query');
        
        if (!query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing query parameter' }));
            return;
        }
        
        try {
            const data = await searchExa(query);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    // Serve the HTML file
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
        return;
    }
    
    // 404 for everything else
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`
🎮 Gaming & 🔒 Security News Searcher
=====================================
Server running at: http://localhost:${PORT}

To use from Discord, ask Data to search for anything!
    `);
});
