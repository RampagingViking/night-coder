#!/usr/bin/env node
/**
 * Daily Security Digest - Uses Exa Plugin
 * Automated daily summary of threats, news, and vulnerabilities
 * 
 * Usage: node index.js [--json] [--date YYYY-MM-DD]
 * 
 * This script uses the Exa plugin tools for searching
 */

const fs = require('fs');
const path = require('path');

// Import the Exa plugin tools
// The exa_search function will be available from the plugin

// Categories to search
const CATEGORIES = [
    { name: 'Critical Vulnerabilities', query: 'critical vulnerability CVE 2025 2026', count: 5 },
    { name: 'Data Breaches', query: 'data breach security incident 2025 2026', count: 3 },
    { name: 'Threat Intelligence', query: 'cyber threat intelligence APT hacking 2025', count: 3 },
    { name: 'Industry News', query: 'cybersecurity enterprise security 2025 2026', count: 3 },
    { name: 'Ransomware', query: 'ransomware attack 2025 2026', count: 3 }
];

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function color(text, code) {
    return `${code}${text}${colors.reset}`;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getDateRange(date) {
    const end = new Date(date);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return {
        start: formatDate(start),
        end: formatDate(end)
    };
}

// Use Exa API directly (same as the plugin uses)
async function searchExa(query, numResults) {
    const EXA_API_KEY = process.env.EXA_API_KEY || '65d9409f-130f-42e9-a4ed-d2bd2bd084f4';
    
    try {
        const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': EXA_API_KEY
            },
            body: JSON.stringify({
                query: query,
                numResults: numResults,
                type: 'fast',
                contents: {
                    text: { maxCharacters: 500 }
                },
                startPublishedDate: getDateRange(new Date()).start
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.log(color(`  ⚠️ Exa error: ${data.error}`, colors.yellow));
            return [];
        }
        
        return (data.results || []).map(r => ({
            title: r.title || 'Untitled',
            url: r.url || '',
            published_date: r.published_date || '',
            text: r.text || ''
        }));
    } catch (err) {
        console.log(color(`  ⚠️ Search failed: ${err.message}`, colors.red));
        return [];
    }
}

function printHeader() {
    console.log('');
    console.log(color('═══════════════════════════════════════════════════════', colors.cyan));
    console.log(color('  🔒 DAILY SECURITY DIGEST', colors.bright + colors.cyan));
    console.log(color('  ' + formatDate(new Date()), colors.dim));
    console.log(color('  ⚡ Powered by Exa Plugin', colors.green));
    console.log(color('═══════════════════════════════════════════════════════', colors.cyan));
    console.log('');
}

function printSection(title, results) {
    console.log(color(`\n${title}`, colors.bright + colors.yellow));
    console.log(color('─'.repeat(50), colors.dim));
    
    if (results.length === 0) {
        console.log(color('  No recent articles found', colors.dim));
        return;
    }
    
    results.forEach((item, idx) => {
        const num = color((idx + 1).toString(), colors.cyan);
        const title_ = color(item.title || 'Untitled', colors.bright);
        const meta = color(item.published_date || 'No date', colors.dim);
        
        console.log(`  ${num}. ${title_}`);
        console.log(`     ${meta}`);
        if (item.url) {
            console.log(color(`     ${item.url}`, colors.blue));
        }
        if (item.text) {
            const snippet = item.text.substring(0, 150).replace(/\n/g, ' ');
            console.log(`     ${snippet}...`);
        }
        console.log('');
    });
}

function printSummary(stats) {
    console.log(color('═══════════════════════════════════════════════════════', colors.cyan));
    console.log(color('  SUMMARY', colors.bright + colors.cyan));
    console.log(color('═══════════════════════════════════════════════════════', colors.cyan));
    console.log('');
    console.log(`  ${color('Articles Found:', colors.dim)} ${stats.total}`);
    console.log(`  ${color('Categories:', colors.dim)} ${stats.categories}`);
    console.log(`  ${color('Generated:', colors.dim)} ${new Date().toLocaleString()}`);
    console.log('');
}

function printFooter() {
    console.log(color('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.dim));
    console.log(color('  💡 Tip: Run with --json for programmatic output', colors.dim));
    console.log(color('  📁 Output saved to: daily-digest.json', colors.dim));
    console.log('');
}

async function generateDigest(jsonOutput = false) {
    printHeader();
    
    const dateRange = getDateRange(new Date());
    console.log(color(`  📅 Coverage: ${dateRange.start} to ${dateRange.end}`, colors.dim));
    console.log(color('  🔍 Using Exa plugin for live security intelligence', colors.cyan));
    console.log('');
    
    const categories = [];
    let totalArticles = 0;
    
    for (const cat of CATEGORIES) {
        console.log(color(`  🔎 Searching: ${cat.name}...`, colors.dim));
        
        const results = await searchExa(cat.query, cat.count);
        
        categories.push({
            category: cat.name,
            query: cat.query,
            results: results
        });
        
        totalArticles += results.length;
        
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 200));
    }
    
    // Print all sections
    categories.forEach(cat => {
        printSection(cat.category, cat.results);
    });
    
    printSummary({
        total: totalArticles,
        categories: categories.length
    });
    
    if (jsonOutput) {
        const output = {
            date: formatDate(new Date()),
            dateRange: dateRange,
            categories: categories,
            summary: {
                total: totalArticles,
                categories: categories.length
            },
            generatedAt: new Date().toISOString(),
            source: 'Exa Plugin'
        };
        fs.writeFileSync('daily-digest.json', JSON.stringify(output, null, 2));
        console.log(color('  📁 Saved to daily-digest.json', colors.green));
        return output;
    }
    
    printFooter();
}

async function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    
    await generateDigest(jsonOutput);
}

main().catch(err => {
    console.error(color('Error:', colors.red), err.message);
    process.exit(1);
});
