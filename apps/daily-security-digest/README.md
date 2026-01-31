# Daily Security Digest 🔒

Automated daily summary of threats, news, and vulnerabilities affecting your infrastructure.

## Features

- **5 Categories** of security news:
  - Critical Vulnerabilities (CVE tracking)
  - Data Breaches
  - Threat Intelligence (APT groups, campaigns)
  - Industry News
  - Ransomware Attacks
- **Date range filtering** (last 7 days by default)
- **JSON output** for integration with other tools
- **Save to file** for later review

## Usage

```bash
cd daily-security-digest
node index.js              # Human-readable output
node index.js --json       # JSON output for scripts
```

## Output

The digest includes:
- Recent critical vulnerabilities (CVE)
- Data breach incidents
- Threat intelligence reports
- Industry security news
- Ransomware attack updates

## Example Output

```
═══════════════════════════════════════════════
  🔒 DAILY SECURITY DIGEST
  2026-01-31
═══════════════════════════════════════════════

📅 Coverage: 2026-01-24 to 2026-01-31

CRITICAL VULNERABILITIES
────────────────────────────────────────────────--
  1. Vulnerability Report #1
     2026-01-31
     https://example.com/security/1
     
     Lorem ipsum dolor sit amet...

──────────────────────────────────────────────────

SUMMARY
═══════════════════════════════════════════════
  Articles Found: 10
  Categories: 5
  Generated: 1/31/2026, 12:00:00 PM
```

## Integration

### Cron Job (Run Daily at 6am)

```bash
# Add to crontab
0 6 * * * cd /path/to/daily-security-digest && node index.js --json > digest-$(date +\%Y-\%m-\%d).json
```

### GitHub Actions

```yaml
name: Daily Security Digest
on:
  schedule:
    - cron: '0 6 * * *'
jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Digest
        run: |
          cd daily-security-digest
          node index.js --json
      - name: Upload Digest
        uses: actions/upload-artifact@v3
        with:
          name: security-digest
          path: daily-digest.json
```

## Future Enhancements

- [ ] Integrate Exa API for live search
- [ ] Email/Slack notifications
- [ ] Custom category selection
- [ ] Severity filtering
- [ ] Historical comparison
- [ ] RSS feed output

## Requirements

- Node.js 14+
- No external dependencies (offline mode)
- Optional: Exa API key for live data

## License

MIT - Built by Brian with AI assistance (Data)
