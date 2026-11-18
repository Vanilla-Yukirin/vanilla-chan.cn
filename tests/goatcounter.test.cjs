const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../sources/goatcounter.js'), 'utf8');

function page(origin = 'https://vanilla-chan.cn', pathname = '/', readyState = 'complete') {
  const scripts = [], timers = [], events = new Map();
  const window = { addEventListener: (name, fn) => events.set(name, fn) };
  vm.runInNewContext(source, {
    window, location: { origin, pathname },
    document: { readyState, createElement: () => ({ dataset: {}, remove() {} }),
      head: { appendChild: (script) => scripts.push(script) } },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
  });
  return { scripts, timers, events, window };
}

test('previews, unrelated domains and other applications never load the counter', () => {
  for (const [origin, pathname] of [['http://localhost:4000', '/'], ['https://preview.example', '/'],
    ['https://vanilla-chan.cn', '/blog/'], ['https://vanilla-chan.cn', '/not-a-page']]) {
    const p = page(origin, pathname);
    assert.equal(p.scripts.length + p.timers.length + p.events.size, 0);
  }
});

test('loads after the page and records only the homepage canonical path', () => {
  const p = page('https://vanilla-chan.cn', '/vanilla-chan.cn.html', 'loading');
  assert.equal(p.scripts.length, 0);
  p.events.get('load')();
  assert.equal(p.scripts[0].dataset.goatcounter, 'https://cnt.vanilla-chan.cn/count');
  assert.equal(p.window.goatcounter.path, '/');
  assert.equal(p.window.goatcounter.no_onload, true);
  let calls = 0;
  p.window.goatcounter.count = () => calls++;
  p.scripts[0].onload();
  assert.equal(calls, 1);
  assert.equal(p.scripts[0].onload, null);
});

test('a failed or timed-out counter does not throw or retry', () => {
  for (const timeout of [false, true]) {
    const p = page();
    p.timers.find(t => t.ms === 0).fn();
    if (timeout) p.timers.find(t => t.ms === 4000).fn();
    else p.scripts[0].onerror();
    assert.equal(p.scripts.length, 1);
    assert.equal(p.scripts[0].onload, null);
  }
});
