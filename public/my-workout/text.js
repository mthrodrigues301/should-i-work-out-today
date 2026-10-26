(function (root) {
  const emojiPattern = /(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}\uFE0F|\p{Emoji_Presentation}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Emoji_Presentation}(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])?)*)/gu;

  function strip(value) {
    return String(value ?? "")
      .replace(emojiPattern, "")
      .replace(/[\uFE0E\uFE0F\u200D\u20E3\u{1F3FB}-\u{1F3FF}]/gu, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function cleanPlan(plan) {
    return Object.fromEntries(Object.entries(plan).map(([day, workout]) => [day, {
      ...workout,
      title: strip(workout.title) || "Treino",
      items: workout.items.map((item) => ({
        ...item,
        name: strip(item.name) || "Exercício",
        sets: strip(item.sets) || "1",
        reps: strip(item.reps) || "Conforme seu plano",
        ...(item.machine ? { machine: strip(item.machine) } : {}),
        ...(item.cycle ? { cycle: strip(item.cycle) } : {}),
        ...(item.image ? { image: strip(item.image) } : {})
      }))
    }]));
  }

  root.WorkoutText = Object.freeze({ strip, cleanPlan });
  if (typeof module !== "undefined") module.exports = root.WorkoutText;
})(typeof window !== "undefined" ? window : globalThis);
