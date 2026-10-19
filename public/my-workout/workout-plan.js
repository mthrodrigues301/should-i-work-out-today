(function (root) {
  const days = [0, 1, 2, 3, 4, 5, 6];
  const preloadedSample = {
    0: ['Dia de descanso', []],
    1: ['Full Body A · Força', [['Agachamento livre', '3', '6–8'], ['Supino reto', '3', '6–8'], ['Remada baixa', '3', '8–10'], ['Mesa flexora', '3', '10–12'], ['Elevação lateral', '3', '12–15'], ['Prancha', '3', '30–45 s']]],
    2: ['Esteira + abdômen', [['Esteira plana', '1', '15–20 min'], ['Abdômen', '—', 'Conforme seu plano']]],
    3: ['Full Body B · Hipertrofia', [['Leg press', '3', '10–12'], ['Puxada alta', '3', '8–12'], ['Supino inclinado', '3', '8–12'], ['Cadeira flexora', '3', '10–12'], ['Rosca direta', '3', '10–12'], ['Tríceps corda', '3', '10–12']]],
    4: ['Esteira + mobilidade', [['Esteira', '1', '15–20 min'], ['Mobilidade', '—', 'Conforme seu plano']]],
    5: ['Full Body C · Volume', [['Agachamento no Smith', '3', '10–12'], ['Remada articulada', '3', '8–12'], ['Supino com halteres', '3', '8–12'], ['Cadeira extensora', '3', '12–15'], ['Desenvolvimento de ombros', '3', '10–12'], ['Abdominal na polia', '3', '12–15']]],
    6: ['Caminhada ou elíptico', [['Caminhada ou elíptico', '1', '20–30 min']]]
  };

  function empty() {
    return Object.fromEntries(days.map((day) => [day, { title: '', items: [] }]));
  }

  function initialize(saved, isValid, clean) {
    return isValid(saved) ? clean({ ...empty(), ...saved }) : empty();
  }

  function isPreloadedSample(plan) {
    if (!plan || Object.keys(plan).length !== days.length) return false;
    return days.every((day) => {
      const expected = preloadedSample[day];
      const actual = plan[day];
      return actual?.title === expected[0]
        && Array.isArray(actual.items)
        && actual.items.length === expected[1].length
        && actual.items.every((item, index) => item && [item.name, item.sets, item.reps].every((value, field) => value === expected[1][index][field]));
    });
  }

  root.WorkoutPlan = Object.freeze({ empty, initialize, isPreloadedSample });
  if (typeof module !== 'undefined') module.exports = root.WorkoutPlan;
})(typeof window !== 'undefined' ? window : globalThis);
