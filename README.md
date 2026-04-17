# fanqie-novel-cli

Fetch Chinese novel bestseller rankings from multiple platforms via CLI.

## Supported Platforms

| Platform | Source | Notes |
|----------|--------|-------|
| 番茄小说 (Fanqie) | API | ByteDance's novel platform |
| 三九小说 (39xs) | HTML | Static novel site |

> Note: Major platforms like 起点, 17K, 纵横 have strong anti-bot measures (WAF, JavaScript challenges). They cannot be scraped via simple HTTP requests.

## Install

```bash
npm install -g fanqie-novel-cli
# or run directly
node novel_cli.js
node rankings.js
```

## Commands

### `novel_cli.js` — Fanqie API data

```bash
node novel_cli.js rankings --type=1   # 男频热销
node novel_cli.js rankings --type=2   # 女频热销
node novel_cli.js                    # Both rankings
node novel_cli.js book <bookId>      # Book details
node novel_cli.js search <keyword>   # Search
```

### `rankings.js` — Unified multi-platform

```bash
node rankings.js fanqie --type=1      # 番茄男频
node rankings.js fanqie --type=2      # 番茄女频
node rankings.js 39xs                # 三九小说热门
node rankings.js all                 # All platforms
```

### `report.js` — Markdown report

```bash
node report.js > ranking.md           # Generate markdown report
```

## Output

All CLI tools output JSON to stdout, progress messages to stderr — safe to pipe:

```bash
node rankings.js fanqie --type=1 2>/dev/null | jq '.[].title'
```

## GitHub

https://github.com/asdzxc252/fanqie-novel-cli
