# 🔐 API Key Leak Detector

Scan files and directories for exposed API keys, secrets, and sensitive credentials.

## Features

- **30+ patterns** for common secret types
- **Multi-level severity** (critical, high, medium)
- **Smart filtering** - skips node_modules, .git, etc.
- **Color-coded output** for easy identification
- **JSON output** for integration with other tools
- **No dependencies** - pure Node.js

## Supported Patterns

| Pattern | Severity | Example |
|---------|----------|---------|
| GitHub Tokens | 🔴 Critical | `ghp_xxxxxxxx...` |
| AWS Access Keys | 🔴 Critical | `AKIA...` |
| OpenAI API Key | 🔴 Critical | `sk-...` |
| Anthropic Key | 🔴 Critical | `sk-ant-...` |
| Database URIs | 🔴 Critical | `mongodb://...` |
| JWT Tokens | 🟠 High | `eyJ...` |
| Private Keys | 🟠 High | `-----BEGIN...` |
| Slack Tokens | 🔴 Critical | `xoxb-...` |
| Discord Tokens | 🔴 Critical | `MFA...` |
| Generic API Keys | 🟡 Medium | `api_key=...` |

## Usage

```bash
cd api-key-leak-detector
node index.js [path] [options]
```

### Examples

```bash
# Scan current directory
node index.js

# Scan specific directory
node index.js /path/to/project

# JSON output (for scripts)
node index.js --json

# Verbose mode (show all files scanned)
node index.js -v

# Show help
node index.js --help
```

### Output Example

```
🔐 API Key Leak Detector
============================================================
Scanning: /Users/brian/project

🔍 Scan Complete!
============================================================
Total findings: 3
  🔴 Critical: 2
  🟠 High: 1

📁 /Users/brian/project/src/config.js
------------------------------------------------------------
  🔴 Line 15: [GitHub Token]
     const GITHUB_TOKEN = "ghp_xxxx****xxxx";
```

## Exit Codes

- `0` - Scan complete, no critical findings
- `1` - Error during scan
- `2` - Critical findings detected

## Integration

### CI/CD Pipeline

```yaml
- name: Check for leaked secrets
  run: |
    cd api-key-leak-detector
    node index.js . --json > scan-results.json
    # Fail if critical findings
    jq -e '.summary.critical == 0' scan-results.json
```

### Git Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

cd api-key-leak-detector
if ! node index.js . --json | jq -e '.summary.critical == 0' > /dev/null; then
    echo "❌ Critical secrets detected! Commit rejected."
    exit 1
fi
```

## How It Works

1. **Pattern Matching**: Uses regular expressions to identify known secret formats
2. **File Scanning**: Reads source files and looks for patterns
3. **Severity Classification**: Categorizes findings by risk level
4. **Smart Filtering**: Skips common non-secret files

## Best Practices

1. **Scan regularly** - Run before every commit
2. **Use environment variables** - Never hardcode secrets
3. **Rotate exposed keys** - If found, regenerate immediately
4. **Add to .gitignore** - Keep secrets out of version control

## Requirements

- Node.js 14+
- No external dependencies

## License

MIT - Built by Brian with AI assistance (Data)
