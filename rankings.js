#!/usr/bin/env node
/**
 * novel-rankings — Unified CLI for Chinese novel platform rankings
 * 
 * Supported platforms:
 *   fanqie  - 番茄小说 (Fanqie Novel) via API
 *   39xs    - 三九小说 via HTML scraping
 * 
 * Usage:
 *   node rankings.js fanqie --type=1      # 男频热销
 *   node rankings.js 39xs                 # 三九小说热门
 *   node rankings.js all                  # All platforms
 */

const https = require('https');

// ─── Fanqie Novel (番茄小说) ────────────────────────────────────────────────

function fetchFanqie(type = 1) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: 'fanqienovel.com',
      path: '/api/rank/list?type=' + type,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://fanqienovel.com/'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve((json.data?.list || []).map((b, i) => ({
            platform: '番茄小说',
            rank: i + 1,
            bookId: b.bookId,
            title: b.bookName,
            author: b.author,
            category: b.categoryName || '都市',
            synopsis: b.abstract,
          })));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── 39xs (三九小说) ────────────────────────────────────────────────────────

function fetch39xs(category) {
  // category: 1=玄幻修真, 2=重生穿越, 3=都市, 4=军史, 5=网游, 6=科幻, 7=灵异, 8=言情, 9=其他
  return new Promise((resolve, reject) => {
    const path = category ? '/list/' + category + '/1.html' : '/';
    const req = https.get({
      hostname: 'www.39xs.org',
      path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const books = parse39xs(data);
          resolve(books);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parse39xs(html) {
  const books = [];
  // Parse "热门小说" section
  const hotPattern = /<li><a href="\/book_(\d+)\.html">([^<]+)<\/a><span class="y">([^<]+)<\/span><\/li>/g;
  let m;
  let rank = 1;
  while ((m = hotPattern.exec(html)) !== null && rank <= 20) {
    books.push({
      platform: '三九小说',
      rank: rank++,
      bookId: m[1],
      title: m[2].trim(),
      author: m[3].trim(),
      category: '热门',
      synopsis: '',
    });
  }

  // Also parse "已完结小说推荐" section (image cards)
  const cardPattern = /<h3><a href="\/book_(\d+)\.html"[^>]*title="([^ "]+) \/ ([^"]+)"/g;
  while ((m = cardPattern.exec(html)) !== null && books.length < 30) {
    books.push({
      platform: '三九小说',
      rank: books.length + 1,
      bookId: m[1],
      title: m[2].trim(),
      author: m[3].trim(),
      category: '完结推荐',
      synopsis: '',
    });
  }

  return books.slice(0, 30);
}

// ─── Unified CLI ────────────────────────────────────────────────────────────

async function main() {
  const [, , cmd, ...args] = process.argv;
  const platforms = [];

  // Parse args
  let fanqieType = null;
  let xs39Category = null;
  for (const arg of args) {
    if (arg.startsWith('--type=')) fanqieType = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--cat=')) xs39Category = parseInt(arg.split('=')[1]);
  }

  if (cmd === 'fanqie' || cmd === 'all') {
    try {
      const type = fanqieType || 1;
      const data = await fetchFanqie(type);
      platforms.push({ name: '番茄小说', type: type === 1 ? '男频热销' : '女频热销', data });
    } catch(e) {
      platforms.push({ name: '番茄小说', error: e.message, data: [] });
    }
  }

  if (cmd === '39xs' || cmd === 'all') {
    try {
      const data = await fetch39xs(xs39Category);
      platforms.push({ name: '三九小说', type: '热门', data });
    } catch(e) {
      platforms.push({ name: '三九小说', error: e.message, data: [] });
    }
  }

  if (!cmd || cmd === 'all') {
    // Default: show all
    const results = await Promise.allSettled([
      fetchFanqie(1),
      fetchFanqie(2),
      fetch39xs(null),
    ]);
    platforms.push(
      { name: '番茄小说', type: '男频', data: results[0].status === 'fulfilled' ? results[0].value : [] },
      { name: '番茄小说', type: '女频', data: results[1].status === 'fulfilled' ? results[1].value : [] },
      { name: '三九小说', type: '热门', data: results[2].status === 'fulfilled' ? results[2].value : [] },
    );
  }

  // Output
  if (cmd === 'fanqie' || cmd === '39xs') {
    // Single platform: just the data array
    const p = platforms[0];
    if (p.error) {
      console.error('Error:', p.error);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(p.data, null, 2));
  } else {
    // All: structured output
    const output = {
      timestamp: new Date().toISOString(),
      platforms: platforms.map(p => ({
        name: p.name,
        type: p.type,
        count: p.data.length,
        error: p.error || null,
        books: p.data,
      }))
    };
    process.stdout.write(JSON.stringify(output, null, 2));
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
