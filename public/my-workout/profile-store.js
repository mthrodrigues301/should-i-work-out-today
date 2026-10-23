/* Private daily wellness notes stored only in this browser's local storage. */
(function (root) {
  const KEY = 'mt-profile-v1';
  const MOODS = Object.freeze(['great', 'good', 'neutral', 'tired', 'low']);
  const PAIN_AREAS = Object.freeze(['head-neck', 'shoulder', 'arm-wrist', 'chest', 'back', 'abdomen', 'hip', 'thigh', 'knee', 'calf', 'ankle-foot', 'other']);
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return date.getFullYear() === Number(value.slice(0, 4))
      && date.getMonth() + 1 === Number(value.slice(5, 7))
      && date.getDate() === Number(value.slice(8, 10));
  };
  const read = () => {
    try {
      const value = JSON.parse(root.localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };
  const normalize = (value) => {
    if (!value || typeof value !== 'object') return value;
    const pains = Array.isArray(value.painEntries)
      ? value.painEntries
      : value.painStatus === 'yes' && value.painArea ? [{ area: value.painArea, level: value.painLevel }] : [];
    return { ...value, painEntries: pains };
  };
  const get = (date) => validDate(date) ? normalize(read()[date] || null) : null;
  const save = (date, weightKg, mood, painStatus = 'no', painInput = '', painLevel = '', updatedAt = Date.now()) => {
    const weight = Number(weightKg);
    const pains = Array.isArray(painInput) ? painInput.map(({ area, level }) => ({ area, level: Number(level) }))
      : painStatus === 'yes' && painInput ? [{ area: painInput, level: Number(painLevel) }] : [];
    const validPains = pains.length > 0 && pains.every(({ area, level }) => PAIN_AREAS.includes(area) && Number.isInteger(level) && level >= 1 && level <= 10)
      && new Set(pains.map(({ area }) => area)).size === pains.length;
    if (!validDate(date) || !Number.isFinite(weight) || weight < 1 || weight > 500 || !MOODS.includes(mood)
      || !['yes', 'no'].includes(painStatus)
      || (painStatus === 'yes' && !validPains)) {
      throw new Error('Confira a data, o peso, o sentimento e as informações sobre dor.');
    }
    const value = { weightKg: Math.round(weight * 10) / 10, mood, painStatus, painEntries: painStatus === 'yes' ? pains : [], painArea: painStatus === 'yes' ? pains[0].area : '', painLevel: painStatus === 'yes' ? pains[0].level : null, updatedAt };
    const all = read();
    all[date] = value;
    root.localStorage.setItem(KEY, JSON.stringify(all));
    return value;
  };
  root.WorkoutProfileStore = Object.freeze({ KEY, MOODS, PAIN_AREAS, read, get, save });
  if (typeof module !== 'undefined') module.exports = root.WorkoutProfileStore;
})(typeof window !== 'undefined' ? window : globalThis);
