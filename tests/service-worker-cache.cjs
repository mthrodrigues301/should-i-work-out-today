const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setupServiceWorker({ fetchImpl = async () => { throw new Error('offline'); } } = {}) {
  const listeners = {};
  const entries = new Map();
  let skippedWaiting = false;
  const pathOf = (value) => {
    const url = new URL(typeof value === 'string' ? value : value.url, 'https://app.example');
    return url.pathname + url.search;
  };
  const cache = {
    async addAll(paths) {
      for (const path of paths) entries.set(pathOf(path), new Response(`cached ${path}`));
    },
    async add(path) { entries.set(pathOf(path), new Response(`cached ${path}`)); },
    async match(request) {
      const response = entries.get(pathOf(request));
      return response?.clone();
    },
    async put(request, response) { entries.set(pathOf(request), response.clone()); }
  };
  const context = {
    URL,
    Response,
    self: {
      location: { origin: 'https://app.example' },
      clients: { claim: async () => {} },
      skipWaiting: async () => { skippedWaiting = true; },
      addEventListener(name, handler) { listeners[name] = handler; }
    },
    caches: {
      async open() { return cache; },
      async keys() { return ['siwt-training-v13', 'siwt-training-v14']; },
      async delete() { return true; }
    },
    fetch: fetchImpl
  };
  vm.runInNewContext(fs.readFileSync('src/service-worker.js', 'utf8'), context);
  return {
    listeners, entries,
    get skippedWaiting() { return skippedWaiting; }
  };
}

function workerEvent(request) {
  return {
    request,
    waits: [],
    waitUntil(promise) { this.waits.push(promise); },
    respondWith(promise) { this.response = promise; }
  };
}

test('installs the full My Workout shell, including every script linked by its page', async () => {
  const worker = setupServiceWorker();
  const event = { waits: [], waitUntil(promise) { this.waits.push(promise); } };
  worker.listeners.install(event);
  await Promise.all(event.waits);
  for (const asset of [
    '/my-workout/', '/my-workout/index.html', '/my-workout/icons.js',
    '/my-workout/app.js', '/my-workout/style.css', '/my-workout/design.css',
    '/my-workout/history.html', '/my-workout/history.js'
  ]) assert.equal(worker.entries.has(asset), true, `${asset} should be available offline`);
  const serviceWorker = fs.readFileSync('src/service-worker.js', 'utf8');
  const assets = [...serviceWorker.matchAll(/const TRAINING_(?:CORE|OPTIONAL)_ASSETS=(\[[^;]+\]);/g)]
    .flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]));
  for (const page of ['public/my-workout/index.html', 'public/my-workout/history.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const linked = [...html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path.startsWith('/my-workout/') || path === '/my-workout/' || path === '/workout-history.js');
    for (const path of linked) {
      const hasFallback = path === '/my-workout/history' && assets.includes('/my-workout/history.html');
      assert.equal(assets.includes(path) || hasFallback, true, `${path} linked by ${page} should be cached or have an offline fallback`);
    }
  }
  assert.equal(worker.skippedWaiting, true);
});

test('serves cached app immediately while refreshing it in the background', async () => {
  let resolveNetwork;
  const worker = setupServiceWorker({ fetchImpl: () => new Promise((resolve) => { resolveNetwork = resolve; }) });
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);

  const request = { url: 'https://app.example/my-workout/?source=home', method: 'GET', mode: 'navigate' };
  const event = workerEvent(request);
  worker.listeners.fetch(event);
  const response = await event.response;
  assert.equal(await response.text(), 'cached /my-workout/');
  assert.equal(typeof resolveNetwork, 'function', 'network update should run in the background');
});

test('opens the cached workout history route when the device is offline', async () => {
  const worker = setupServiceWorker();
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);

  const request = { url: 'https://app.example/my-workout/history', method: 'GET', mode: 'navigate' };
  const event = workerEvent(request);
  worker.listeners.fetch(event);
  const response = await event.response;
  assert.equal(await response.text(), 'cached /my-workout/history.html');
});
