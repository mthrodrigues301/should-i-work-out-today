const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ enabled = true, permission = 'granted', hidden = false } = {}) {
  const shown = [];
  const registration = { async showNotification(title, options) { shown.push({ title, ...options }); } };
  const values = new Map([['mt-rest-push-settings', JSON.stringify({ enabled })]]);
  const context = {
    document: { hidden },
    navigator: { serviceWorker: { async getRegistration() { return registration; } } },
    Notification: { permission },
    localStorage: { getItem(key) { return values.get(key) ?? null; } },
    location: { hostname: 'app.example' },
    console
  };
  vm.runInNewContext(fs.readFileSync('public/my-workout/rest-push.js', 'utf8') + '\nglobalThis.restPush = RestPush;', context);
  return { restPush: context.restPush, shown };
}

test('notifies in the system when an enabled rest timer finishes in the foreground', async () => {
  const { restPush, shown } = setup();
  assert.equal(await restPush.notifyComplete(true), true);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, 'Descanso concluído');
  assert.equal(shown[0].body, 'Hora do próximo exercício.');
});

test('respects the separate rest-notification preference and leaves hidden delivery to push', async () => {
  const disabled = setup({ enabled: false });
  assert.equal(await disabled.restPush.notifyComplete(false), false);
  assert.equal(disabled.shown.length, 0);
  const hidden = setup({ hidden: true });
  assert.equal(await hidden.restPush.notifyComplete(false), false);
  assert.equal(hidden.shown.length, 0);
});
