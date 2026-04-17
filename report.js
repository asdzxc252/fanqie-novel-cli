#!/usr/bin/env node
/**
 * Generate a daily novel ranking report in Markdown format.
 * Output: a readable report for blogs, WeChat public accounts, etc.
 */
const { execSync } = require('child_process');

function run(cmd) {
  try {
    const out = execSync('node novel_cli.js ' + cmd + ' 2>NUL', {
      encoding: 'utf8',
      cwd: __dirname,
      shell: true
    });
    return JSON.parse(out);
  } catch(e) {
    console.error('Failed to run: ' + cmd, e.message);
    return [];
  }
}

function mdEscape(text) {
  if (!text) return '';
  return String(text).replace(/[#*_[\]`~>]/g, function(c) { return '\\' + c; });
}

async function main() {
  const male = run('rankings --type=1');
  const female = run('rankings --type=2');
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  var md = '# \uD83D\uDCDA 番茄小说热销榜 \u00B7 ' + today + '\n\n';

  if (male.length > 0) {
    md += '## \uD83C\uDFC6 男频热销榜\n\n';
    md += '| 排名 | 书名 | 作者 | 类型 | 简介 |\n';
    md += '|------|------|------|------|------|\n';
    for (var i = 0; i < male.length; i++) {
      var b = male[i];
      var synopsis = mdEscape(b.synopsis || '').slice(0, 60) + '...';
      md += '| ' + b.rank + ' | ' + mdEscape(b.title) + ' | ' + mdEscape(b.author) + ' | ' + mdEscape(b.category || '都市') + ' | ' + synopsis + ' |\n';
    }
    md += '\n';
  }

  if (female.length > 0) {
    md += '## \uD83D\uDC96 女频热销榜\n\n';
    md += '| 排名 | 书名 | 作者 | 类型 | 简介 |\n';
    md += '|------|------|------|------|------|\n';
    for (var j = 0; j < female.length; j++) {
      var fb = female[j];
      var fsynopsis = mdEscape(fb.synopsis || '').slice(0, 60) + '...';
      md += '| ' + fb.rank + ' | ' + mdEscape(fb.title) + ' | ' + mdEscape(fb.author) + ' | ' + mdEscape(fb.category || '言情') + ' | ' + fsynopsis + ' |\n';
    }
    md += '\n';
  }

  md += '---\n*由 fanqie-novel-cli 自动生成 \u00B7 数据来源：番茄小说*\n';

  process.stdout.write(md);
}

main();
