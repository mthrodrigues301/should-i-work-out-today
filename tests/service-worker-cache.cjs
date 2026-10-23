const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setupServiceWorker({ fetchImpl } = {}) {
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
  let currentFetch = fetchImpl || (async (request) => new Response(`cached ${pathOf(request)}`));
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
      async keys() { return ['siwt-training-v14', 'siwt-training-v15']; },
      async delete() { return true; }
    },
    fetch: (...args) => currentFetch(...args)
  };
  vm.runInNewContext(fs.readFileSync('src/service-worker.js', 'utf8'), context);
  return {
    listeners, entries,
    setFetchImpl(value) { currentFetch = value; },
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
    '/my-workout', '/my-workout/icons.js',
    '/my-workout/app.js', '/my-workout/style.css', '/my-workout/design.css',
    '/my-workout/history', '/my-workout/history.js'
  ]) assert.equal(worker.entries.has(asset), true, `${asset} should be available offline`);
  assert.equal(worker.entries.has('/my-workout/'), false, 'slash URL should not be precached because the host redirects it');
  assert.equal(worker.entries.has('/my-workout/index.html'), false, 'HTML filename should not be precached because cleanUrls redirects it');
  const serviceWorker = fs.readFileSync('src/service-worker.js', 'utf8');
  const assets = [...serviceWorker.matchAll(/const TRAINING_(?:CORE|OPTIONAL)_ASSETS=(\[[^;]+\]);/g)]
    .flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]));
  for (const page of ['public/my-workout/index.html', 'public/my-workout/history.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const linked = [...html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path.startsWith('/my-workout/') || path === '/my-workout/' || path === '/workout-history.js');
    for (const path of linked) {
      const canonicalPath = path === '/my-workout/' || path === '/my-workout/index.html' ? '/my-workout'
        : path === '/my-workout/history.html' ? '/my-workout/history' : path;
      assert.equal(assets.includes(canonicalPath), true, `${path} linked by ${page} should be cached or have an offline fallback`);
    }
  }
  assert.equal(worker.skippedWaiting, true);
});

test('serves cached app immediately while refreshing it in the background', async () => {
  let resolveNetwork;
  const worker = setupServiceWorker();
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);
  worker.setFetchImpl(() => new Promise((resolve) => { resolveNetwork = resolve; }));

  const request = { url: 'https://app.example/my-workout/?source=home', method: 'GET', mode: 'navigate' };
  const event = workerEvent(request);
  worker.listeners.fetch(event);
  const response = await event.response;
  assert.equal(await response.text(), 'cached /my-workout');
  assert.equal(typeof resolveNetwork, 'function', 'network update should run in the background');
});

test('opens the cached workout history route when the device is offline', async () => {
  const worker = setupServiceWorker();
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);
  worker.setFetchImpl(async () => { throw new Error('offline'); });

  const request = { url: 'https://app.example/my-workout/history', method: 'GET', mode: 'navigate' };
  const event = workerEvent(request);
  worker.listeners.fetch(event);
  const response = await event.response;
  assert.equal(await response.text(), 'cached /my-workout/history');
});

test('removes redirect state before returning and caching a fetched response', async () => {
  const worker = setupServiceWorker();
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);

  worker.setFetchImpl(async () => {
    const response = new Response('page after host redirect');
    Object.defineProperty(response, 'redirected', { value: true });
    return response;
  });
  const request = { url: 'https://app.example/my-workout/uncached.js', method: 'GET', mode: 'cors' };
  const event = workerEvent(request);
  worker.listeners.fetch(event);
  const response = await event.response;
  assert.equal(response.redirected, false);
  assert.equal(await response.text(), 'page after host redirect');
  assert.equal(worker.entries.get('/my-workout/uncached.js').redirected, false);
});

test('precache also stores a clean response when the host redirects a canonical request', async () => {
  const worker = setupServiceWorker({ fetchImpl: async (request) => {
    const response = new Response(`redirected ${new URL(request.url || request, 'https://app.example').pathname}`);
    Object.defineProperty(response, 'redirected', { value: true });
    return response;
  } });
  const install = workerEvent();
  worker.listeners.install(install);
  await Promise.all(install.waits);
  const cachedHome = worker.entries.get('/my-workout');
  assert.equal(cachedHome.redirected, false);
  assert.equal(await cachedHome.text(), 'redirected /my-workout');
});
