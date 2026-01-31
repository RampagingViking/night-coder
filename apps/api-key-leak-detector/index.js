#!/usr/bin/env node
/**
 * API Key Leak Detector
 * Scans files and directories for exposed API keys and secrets
 * 
 * Usage: node index.js [path]
 *        node index.js --help
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Common API key patterns
const PATTERNS = [
    { name: 'GitHub Token', regex: /ghp_[a-zA-Z0-9]{36}/, severity: 'critical' },
    { name: 'GitHub OAuth', regex: /gho_[a-zA-Z0-9]{36}/, severity: 'critical' },
    { name: 'GitHub App Token', regex: /ghu_[a-zA-Z0-9]{36}/, severity: 'critical' },
    { name: 'GitHub Refresh', regex: /ghr_[a-zA-Z0-9]{36}/, severity: 'critical' },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
    { name: 'AWS Secret Key', regex: /[0-9a-zA-Z\/+]{40}/, severity: 'critical' },
    { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{48}/, severity: 'critical' },
    { name: 'OpenAI Base64', regex: /sk-proj-[a-zA-Z0-9]{48}/, severity: 'critical' },
    { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9]{32}/, severity: 'critical' },
    { name: 'Exa API Key', regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, severity: 'critical' },
    { name: 'Slack Token', regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/, severity: 'critical' },
    { name: 'Discord Token', regex: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/, severity: 'critical' },
    { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, severity: 'high' },
    { name: 'Private Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, severity: 'high' },
    { name: 'MongoDB URI', regex: /mongodb(\+srv)?:\/\/[^\s"'<>]+/, severity: 'high' },
    { name: 'PostgreSQL URI', regex: /postgres:\/\/[^\s"'<>]+/, severity: 'high' },
    { name: 'MySQL URI', regex: /mysql:\/\/[^\s"'<>]+/, severity: 'high' },
    { name: 'Redis URI', regex: /redis:\/\/[^\s"'<>]+/, severity: 'high' },
    { name: 'Generic API Key', regex: /api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}["']?/i, severity: 'medium' },
    { name: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9\-\._~\+\/]{20,}/i, severity: 'medium' },
    { name: 'Basic Auth', regex: /Basic\s+[a-zA-Z0-9+\/]{20,}=*/i, severity: 'high' },
    { name: 'Password in URL', regex: /:\/\/[^:]+:[^@]+@/, severity: 'critical' },
];

// Files and directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.cache', 'coverage'];
const SKIP_FILES = ['package-lock.json', 'yarn.lock', '.gitignore'];

// Extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.rb', '.php', '.html', '.css', '.json', '.yaml', '.yml', '.env', '.ini', '.cfg', '.conf'];

function shouldScanFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath);
    
    if (SKIP_FILES.includes(baseName)) return false;
    if (!SCAN_EXTENSIONS.includes(ext)) return false;
    
    return true;
}

function shouldSkipDir(dirName) {
    return SKIP_DIRS.some(skip => dirName.toLowerCase() === skip.toLowerCase());
}

function scanFile(filePath, findings) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        PATTERNS.forEach(pattern => {
            const regex = new RegExp(pattern.regex, 'g');
            let match;
            while ((match = regex.exec(content)) !== null) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                const line = lines[lineNum - 1] || '';
                
                // Mask the actual secret for display
                const masked = maskSecret(match[0]);
                
                findings.push({
                    file: filePath,
                    line: lineNum,
                    pattern: pattern.name,
                    severity: pattern.severity,
                    match: masked,
                    linePreview: line.trim().substring(0, 100)
                });
            }
        });
    } catch (e) {
        // Skip unreadable files
    }
}

function scanDirectory(dirPath, findings, depth = 0) {
    if (depth > 5) return; // Max depth
    
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                if (!shouldSkipDir(entry.name)) {
                    scanDirectory(fullPath, findings, depth + 1);
                }
            } else if (entry.isFile()) {
                if (shouldScanFile(fullPath)) {
                    scanFile(fullPath, findings);
                }
            }
        }
    } catch (e) {
        // Skip inaccessible directories
    }
}

function maskSecret(secret) {
    if (secret.length <= 8) {
        return '*'.repeat(secret.length);
    }
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
}

function printFindings(findings) {
    if (findings.length === 0) {
        console.log('\n✅ No API keys or secrets detected!\n');
        return;
    }
    
    const critical = findings.filter(f => f.severity === 'critical');
    const high = findings.filter(f => f.severity === 'high');
    const medium = findings.filter(f => f.severity === 'medium');
    
    console.log('\n🔍 Scan Complete!');
    console.log('='.repeat(60));
    console.log(`Total findings: ${findings.length}`);
    console.log(`  🔴 Critical: ${critical.length}`);
    console.log(`  🟠 High: ${high.length}`);
    console.log(`  🟡 Medium: ${medium.length}`);
    console.log('');
    
    // Group by file
    const byFile = {};
    findings.forEach(f => {
        if (!byFile[f.file]) byFile[f.file] = [];
        byFile[f.file].push(f);
    });
    
    Object.entries(byFile).forEach(([file, fileFindings]) => {
        console.log(`\n📁 ${file}`);
        console.log('-'.repeat(60));
        
        fileFindings.forEach(f => {
            const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡';
            console.log(`  ${icon} Line ${f.line}: [${f.pattern}]`);
            console.log(`     ${f.linePreview}`);
        });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  ACTION REQUIRED: Review and rotate any exposed secrets!');
    console.log('');
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔐 API Key Leak Detector
========================

Usage:
  node index.js [path]

Arguments:
  path          Directory or file to scan (default: current directory)
  --help, -h    Show this help message
  --json        Output results as JSON
  --verbose, -v Show all scanned files

Examples:
  node index.js                       # Scan current directory
  node index.js /path/to/project      # Scan specific directory
  node index.js --json                # JSON output
  node index.js -v                    # Verbose mode

Supported Patterns:
  - GitHub tokens (ghp_*, gho_*, etc.)
  - AWS credentials (AKIA*, secret keys)
  - OpenAI/Anthropic API keys
  - Database connection strings
  - JWT tokens
  - Private keys
  - And many more...

Skipped:
  - node_modules/, .git/, dist/, build/
  - package-lock.json, yarn.lock
  - Binary files
`);
        return;
    }
    
    const scanPath = args[0] || '.';
    const jsonOutput = args.includes('--json');
    const verbose = args.includes('--verbose') || args.includes('-v');
    
    // Resolve path
    let targetPath = path.resolve(scanPath);
    if (!fs.existsSync(targetPath)) {
        console.log(`❌ Error: Path not found: ${targetPath}`);
        process.exit(1);
    }
    
    console.log('\n🔐 API Key Leak Detector');
    console.log('='.repeat(60));
    console.log(`Scanning: ${targetPath}`);
    console.log('');
    
    const findings = [];
    const startTime = Date.now();
    
    if (fs.statSync(targetPath).isDirectory()) {
        if (verbose) console.log('Scanning directories...\n');
        scanDirectory(targetPath, findings);
    } else {
        if (shouldScanFile(targetPath)) {
            if (verbose) console.log(`Scanning file: ${targetPath}\n`);
            scanFile(targetPath, findings);
        }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (jsonOutput) {
        console.log(JSON.stringify({
            scanPath: targetPath,
            timestamp: new Date().toISOString(),
            elapsed: `${elapsed}s`,
            summary: {
                total: findings.length,
                critical: findings.filter(f => f.severity === 'critical').length,
                high: findings.filter(f => f.severity === 'high').length,
                medium: findings.filter(f => f.severity === 'medium').length
            },
            findings: findings
        }, null, 2));
    } else {
        printFindings(findings);
        console.log(`⏱️  Scan completed in ${elapsed}s`);
    }
    
    // Exit with error code if critical findings
    if (findings.some(f => f.severity === 'critical')) {
        process.exit(2);
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
