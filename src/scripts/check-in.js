(() => {
  const KEY = "workout-check-ins-v1";
  const section = document.querySelector("#checkIn");
  const button = document.querySelector("#checkInButton");
  const undo = document.querySelector("#checkInUndo");
  const done = document.querySelector("#checkInDone");
  let locale;
  let rollover;

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function readDates() {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(data) ? data.filter(value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) : []);
  }

  function render(copy = locale) {
    if (!copy) return;
    locale = copy;
    const text = copy.checkIn;
    let dates;
    try { dates = readDates(); } catch { dates = new Set(); }
    const now = new Date();
    const today = dateKey(now);
    const checked = dates.has(today);
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const days = document.querySelector("#checkInDays");
    days.replaceChildren();
    let count = 0;
    for (let index = 0; index < 7; index++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dateKey(date);
      const logged = dates.has(key) && key <= today;
      if (logged) count++;
      const item = document.createElement("li");
      item.className = `${logged ? "logged" : ""} ${key > today ? "future" : ""}`;
      if (key === today) item.setAttribute("aria-current", "date");
      item.setAttribute("aria-label", `${date.toLocaleDateString(copy.lang, { weekday: "long", day: "numeric", month: "long" })}: ${logged ? text.logged : text.empty}`);
      const label = document.createElement("span");
      label.textContent = date.toLocaleDateString(copy.lang, { weekday: "short" });
      const mark = document.createElement("strong");
      mark.textContent = logged ? "✓" : String(date.getDate());
      label.setAttribute("aria-hidden", "true");
      mark.setAttribute("aria-hidden", "true");
      item.append(label, mark);
      days.append(item);
    }
    document.querySelector("#checkInTitle").textContent = text.week;
    document.querySelector("#checkInCount").textContent = (count === 1 ? text.one : text.many).replace("{count}", count);
    document.querySelector("#checkInNote").textContent = text.local;
    button.textContent = text.action;
    undo.textContent = text.undo;
    done.textContent = text.done;
    button.hidden = checked;
    undo.hidden = !checked;
    done.hidden = !checked;
    clearTimeout(rollover);
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    rollover = setTimeout(() => render(), midnight - now + 100);
  }

  function save(remove) {
    try {
      let dates;
      try { dates = readDates(); } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        dates = new Set();
      }
      const today = dateKey(new Date());
      if (remove) dates.delete(today);
      else dates.add(today);
      localStorage.setItem(KEY, JSON.stringify([...dates].sort()));
      render();
      (remove ? button : undo).focus({ preventScroll: true });
      if (!remove) {
        section.classList.remove("celebrate");
        void section.offsetWidth;
        section.classList.add("celebrate");
      }
      showToast(remove ? locale.checkIn.removed : locale.checkIn.celebrate);
    } catch {
      showToast(locale.checkIn.error);
    }
  }

  button.addEventListener("click", () => save(false));
  undo.addEventListener("click", () => save(true));
  window.addEventListener("storage", event => {
    if (event.key === KEY || event.key === null) render();
  });
  window.addEventListener("focus", () => render());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
  window.workoutCheckIn = { render };
})();
