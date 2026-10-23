/* Private daily wellness notes stored only in this browser's local storage. */
(function (root) {
  const KEY = 'mt-profile-v1';
  const MOODS = Object.freeze(['great', 'good', 'neutral', 'tired', 'low']);
  const PAIN_AREAS = Object.freeze(['head-neck', 'shoulder', 'arm-wrist', 'chest', 'back', 'abdomen', 'hip', 'thigh', 'knee', 'calf', 'ankle-foot', 'multiple', 'other']);
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
  const get = (date) => validDate(date) ? read()[date] || null : null;
  const save = (date, weightKg, mood, painStatus = 'no', painArea = '', painLevel = '', updatedAt = Date.now()) => {
    const weight = Number(weightKg);
    const level = painLevel === '' || painLevel === null ? null : Number(painLevel);
    if (!validDate(date) || !Number.isFinite(weight) || weight < 1 || weight > 500 || !MOODS.includes(mood)
      || !['yes', 'no'].includes(painStatus)
      || (painStatus === 'yes' && (!PAIN_AREAS.includes(painArea) || !Number.isInteger(level) || level < 1 || level > 10))) {
      throw new Error('Confira a data, o peso, o sentimento e as informações sobre dor.');
    }
    const value = { weightKg: Math.round(weight * 10) / 10, mood, painStatus, painArea: painStatus === 'yes' ? painArea : '', painLevel: painStatus === 'yes' ? level : null, updatedAt };
    const all = read();
    all[date] = value;
    root.localStorage.setItem(KEY, JSON.stringify(all));
    return value;
  };
  root.WorkoutProfileStore = Object.freeze({ KEY, MOODS, PAIN_AREAS, read, get, save });
  if (typeof module !== 'undefined') module.exports = root.WorkoutProfileStore;
})(typeof window !== 'undefined' ? window : globalThis);
