#!/usr/bin/env node
/**
 * Fanqie Novel CLI — Fetch 番茄小说 rankings and book data
 * 
 * Usage:
 *   node novel_cli.js rankings [--type=1]
 *   node novel_cli.js book <bookId>
 *   node novel_cli.js search <keyword>
 */

const https = require('https');

const BASE_HOST = 'fanqienovel.com';
const BASE_OPTIONS = {
  hostname: BASE_HOST,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://fanqienovel.com/',
  }
};

function fetch(path) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: BASE_OPTIONS.hostname, path, headers: BASE_OPTIONS.headers };
    const req = https.get(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`JSON parse failed: ${e.message}. Raw: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function getRankings(type = 1) {
  const path = `/api/rank/list${type ? `?type=${type}` : ''}`;
  console.error(`Fetching ${path}...`);
  const json = await fetch(path);
  const books = json.data?.list || [];
  
  if (books.length === 0) {
    console.error('No books returned. Response:', JSON.stringify(json).slice(0, 300));
    return [];
  }

  console.error(`Got ${books.length} books`);
  return books.map((b, i) => ({
    rank: i + 1,
    bookId: b.bookId,
    title: b.bookName,
    author: b.author,
    category: b.categoryName,
    synopsis: b.abstract,
    cover: b.thumbUri || null,
  }));
}

async function getBookDetail(bookId) {
  const path = `/api/book/detail?bookId=${bookId}`;
  console.error(`Fetching ${path}...`);
  const json = await fetch(path);
  const book = json.data;
  if (!book) return null;

  return {
    bookId: book.bookId,
    title: book.bookName,
    author: book.author,
    category: book.categoryName,
    synopsis: book.abstract,
    cover: book.thumbUri || null,
    wordCount: book.wordCount,
    status: book.status,
  };
}

async function search(keyword) {
  const path = `/api/search?q=${encodeURIComponent(keyword)}`;
  console.error(`Searching: ${keyword}`);
  const json = await fetch(path);
  const books = json.data?.list || [];
  return books.map(b => ({
    bookId: b.bookId,
    title: b.bookName,
    author: b.author,
    category: b.categoryName,
  }));
}

// Output as formatted JSON for piping to other tools
async function main() {
  const [,, cmd, ...args] = process.argv;

  try {
    let result;

    if (cmd === 'rankings') {
      let type = 1;
      for (const arg of args) {
        if (arg.startsWith('--type=')) type = parseInt(arg.split('=')[1]);
      }
      result = await getRankings(type);
    } else if (cmd === 'book') {
      const bookId = args[0];
      if (!bookId) { console.error('Usage: novel_cli.js book <bookId>'); process.exit(1); }
      result = await getBookDetail(bookId);
    } else if (cmd === 'search') {
      const keyword = args.join(' ');
      if (!keyword) { console.error('Usage: novel_cli.js search <keyword>'); process.exit(1); }
      result = await search(keyword);
    } else {
      // Default: show both rankings
      console.error('Fetching 男频热销 (type=1)...');
      const male = await getRankings(1);
      console.error('\nFetching 女频热销 (type=2)...');
      const female = await getRankings(2);
      result = { male, female };
    }

    // Always output JSON to stdout
    process.stdout.write(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
