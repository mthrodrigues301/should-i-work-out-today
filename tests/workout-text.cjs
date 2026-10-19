const test = require('node:test');
const assert = require('node:assert/strict');
const WorkoutText = require('../public/my-workout/text.js');

test('removes emoji, flags and keycaps while preserving symbols and workout notation', () => {
  assert.equal(WorkoutText.strip('Treino 💪 🇧🇷 3️⃣ 3 séries ↗ — 3 × 8–12'), 'Treino 3 séries ↗ — 3 × 8–12');
});

test('cleans persisted workout names and uses readable fallbacks', () => {
  const plan = WorkoutText.cleanPlan({
    1: { title: '🏋️', items: [{ name: '🔥', sets: '3', reps: '8–12' }] }
  });
  assert.equal(plan[1].title, 'Treino');
  assert.equal(plan[1].items[0].name, 'Exercício');
  assert.equal(plan[1].items[0].reps, '8–12');
});
