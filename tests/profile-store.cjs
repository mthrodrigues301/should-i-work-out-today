const test = require('node:test');
const assert = require('node:assert/strict');

const values = new Map();
global.localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); }
};
const Profile = require('../public/my-workout/profile-store.js');

test('stores weight and mood by local date in local storage', () => {
  values.clear();
  const saved = Profile.save('2026-10-23', '72.36', 'good', 'yes', 'back', '6', 1234);
  assert.deepEqual(saved, { weightKg: 72.4, mood: 'good', painStatus: 'yes', painEntries: [{ area: 'back', level: 6 }], painArea: 'back', painLevel: 6, updatedAt: 1234 });
  assert.deepEqual(Profile.get('2026-10-23'), saved);
  assert.equal(Profile.get('2026-10-24'), null);
  assert.equal(values.has(Profile.KEY), true);
});

test('rejects invalid dates, weights, and moods without overwriting saved data', () => {
  values.clear();
  const saved = Profile.save('2026-10-23', 72, 'neutral', 'no', '', '', 1234);
  for (const args of [
    ['2026-02-31', 70, 'good'],
    ['2026-10-24', 0, 'good'],
    ['2026-10-24', 501, 'good'],
    ['2026-10-24', 70, 'unknown'],
    ['2026-10-24', 70, 'good', 'maybe', '', ''],
    ['2026-10-24', 70, 'good', 'yes', 'unknown', 4],
    ['2026-10-24', 70, 'good', 'yes', 'knee', 0],
    ['2026-10-24', 70, 'good', 'yes', 'knee', 11],
    ['2026-10-24', 70, 'good', 'yes', 'knee', 3.5]
  ]) assert.throws(() => Profile.save(...args));
  assert.deepEqual(Profile.get('2026-10-23'), saved);
  assert.equal(Profile.get('2026-10-24'), null);
});

test('clears pain region and level when the user reports no pain', () => {
  values.clear();
  const saved = Profile.save('2026-10-23', 72, 'good', 'no', 'back', 8, 1234);
  assert.deepEqual(saved, { weightKg: 72, mood: 'good', painStatus: 'no', painEntries: [], painArea: '', painLevel: null, updatedAt: 1234 });
});

test('stores more than one painful area and rejects repeated areas', () => {
  values.clear();
  const pains = [{ area: 'shoulder', level: 3 }, { area: 'back', level: 7 }, { area: 'knee', level: 5 }];
  const saved = Profile.save('2026-10-23', 72, 'tired', 'yes', pains, '', 1234);
  assert.deepEqual(saved.painEntries, pains);
  assert.equal(saved.painArea, 'shoulder');
  assert.equal(saved.painLevel, 3);
  assert.throws(() => Profile.save('2026-10-24', 72, 'good', 'yes', [{ area: 'back', level: 5 }, { area: 'back', level: 8 }]));
});

test('reads existing single-area pain entries in the new format', () => {
  values.clear();
  values.set(Profile.KEY, JSON.stringify({ '2026-10-23': { weightKg: 72, mood: 'good', painStatus: 'yes', painArea: 'back', painLevel: 6, updatedAt: 1 } }));
  assert.deepEqual(Profile.get('2026-10-23').painEntries, [{ area: 'back', level: 6 }]);
});
