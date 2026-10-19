const test = require('node:test');
const assert = require('node:assert/strict');
const WorkoutPlan = require('../public/my-workout/workout-plan.js');

const valid = (plan) => plan && typeof plan === 'object' && Object.values(plan).every((day) =>
  day && typeof day.title === 'string' && Array.isArray(day.items));
const clean = (plan) => plan;

test('new installs start with empty days and no preloaded exercises', () => {
  const plan = WorkoutPlan.initialize(null, valid, clean);
  assert.equal(Object.keys(plan).length, 7);
  assert.ok(Object.values(plan).every((day) => day.title === '' && day.items.length === 0));
});

test('saved workout data is preserved while unused days stay empty', () => {
  const saved = { 1: { title: 'Treino A', items: [{ name: 'Supino' }] } };
  const plan = WorkoutPlan.initialize(saved, valid, clean);
  assert.deepEqual(plan[1], saved[1]);
  assert.deepEqual(plan[2], { title: '', items: [] });
});

test('the old built-in workout sample is detected for first-run setup', () => {
  const items = (rows) => rows.map(([name, sets, reps]) => ({ name, sets, reps }));
  const sample = {
    0: { title: 'Dia de descanso', items: [] },
    1: { title: 'Full Body A · Força', items: items([['Agachamento livre', '3', '6–8'], ['Supino reto', '3', '6–8'], ['Remada baixa', '3', '8–10'], ['Mesa flexora', '3', '10–12'], ['Elevação lateral', '3', '12–15'], ['Prancha', '3', '30–45 s']]) },
    2: { title: 'Esteira + abdômen', items: items([['Esteira plana', '1', '15–20 min'], ['Abdômen', '—', 'Conforme seu plano']]) },
    3: { title: 'Full Body B · Hipertrofia', items: items([['Leg press', '3', '10–12'], ['Puxada alta', '3', '8–12'], ['Supino inclinado', '3', '8–12'], ['Cadeira flexora', '3', '10–12'], ['Rosca direta', '3', '10–12'], ['Tríceps corda', '3', '10–12']]) },
    4: { title: 'Esteira + mobilidade', items: items([['Esteira', '1', '15–20 min'], ['Mobilidade', '—', 'Conforme seu plano']]) },
    5: { title: 'Full Body C · Volume', items: items([['Agachamento no Smith', '3', '10–12'], ['Remada articulada', '3', '8–12'], ['Supino com halteres', '3', '8–12'], ['Cadeira extensora', '3', '12–15'], ['Desenvolvimento de ombros', '3', '10–12'], ['Abdominal na polia', '3', '12–15']]) },
    6: { title: 'Caminhada ou elíptico', items: items([['Caminhada ou elíptico', '1', '20–30 min']]) }
  };
  assert.equal(WorkoutPlan.isPreloadedSample(sample), true);
  sample[1].title = 'Meu treino';
  assert.equal(WorkoutPlan.isPreloadedSample(sample), false);
});
