# fanqie-novel-cli

Fetch 番茄小说 (Fanqie Novel) bestseller rankings and book data from the command line.

## Install

```bash
npm install -g fanqie-novel-cli
# or
npx fanqie-novel-cli rankings
```

Or download and run directly:

```bash
node novel_cli.js rankings
```

## Usage

```bash
# Show both male and female bestseller rankings
node novel_cli.js

# Male bestseller (男频热销)
node novel_cli.js rankings --type=1

# Female bestseller (女频热销)
node novel_cli.js rankings --type=2

# Get book details by ID
node novel_cli.js book 1630324483249155

# Search books by keyword
node novel_cli.js search 重生
```

## Output Format

All output is JSON to stdout. Progress messages go to stderr so you can pipe results:

```bash
node novel_cli.js rankings --type=1 2>/dev/null | jq '.[].title'
```

## Credits

Data from [番茄小说](https://fanqienovel.com/) (ByteDance). MIT License.
