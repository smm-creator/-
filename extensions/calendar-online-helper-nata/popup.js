function todayInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function setStatus(text, type = "") {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = `status ${type}`.trim();
}

function renderPresets(presets) {
  const container = document.getElementById("presets");
  container.innerHTML = "";

  presets.forEach((title, index) => {
    const label = document.createElement("label");
    label.className = "preset-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = title;
    input.id = `preset-${index}`;

    const span = document.createElement("span");
    span.textContent = title;

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  });
}

function getSelectedTasks() {
  const tasks = Array.from(document.querySelectorAll("#presets input:checked")).map(
    (el) => el.value.trim()
  );

  const custom = document.getElementById("custom").value.trim();
  if (custom) {
    tasks.push(custom);
  }

  return [...new Set(tasks)];
}

async function loadPeople(settings) {
  const select = document.getElementById("person");
  select.innerHTML = "";

  try {
    const people = await getSubCalendars(settings.capabilityId);
    const addable = people.filter((p) => p.canAdd);

    addable.forEach((person) => {
      const option = document.createElement("option");
      option.value = String(person.id);
      option.textContent = person.name;
      if (person.id === settings.subCalendarId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    if (!addable.length) {
      const option = document.createElement("option");
      option.value = String(settings.subCalendarId);
      option.textContent = "Ната";
      select.appendChild(option);
    }
  } catch {
    const option = document.createElement("option");
    option.value = String(settings.subCalendarId);
    option.textContent = "Ліза";
    select.appendChild(option);
  }
}

async function init() {
  const settings = await getSettings();
  document.getElementById("date").value = todayInputValue();
  renderPresets(settings.presets);
  await loadPeople(settings);

  document.getElementById("submit").addEventListener("click", async () => {
    const button = document.getElementById("submit");
    const tasks = getSelectedTasks();
    const dateStr = document.getElementById("date").value;
    const subCalendarId = Number(document.getElementById("person").value);
    const currentSettings = await getSettings();
    const timeZone =
      currentSettings.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Europe/Kiev";

    if (!dateStr) {
      setStatus("Оберіть дату", "err");
      return;
    }

    if (!tasks.length) {
      setStatus("Оберіть або введіть хоча б одну задачу", "err");
      return;
    }

    button.disabled = true;
    setStatus("Додаю задачі...");

    try {
      let existingTitles = new Set();
      try {
        const existing = await fetchDayEvents(
          currentSettings.capabilityId,
          dateStr,
          timeZone
        );
        existing
          .filter((e) => e.subCalendars?.includes(subCalendarId))
          .forEach((e) => existingTitles.add(e.title.trim()));
      } catch {
        existingTitles = new Set();
      }

      const created = [];
      const skipped = [];

      for (const title of tasks) {
        if (existingTitles.has(title)) {
          skipped.push(title);
          continue;
        }

        await createTask(
          currentSettings.capabilityId,
          subCalendarId,
          title,
          dateStr,
          timeZone
        );
        created.push(title);
        existingTitles.add(title);
      }

      document.getElementById("custom").value = "";
      document.querySelectorAll("#presets input:checked").forEach((el) => {
        el.checked = false;
      });

      if (!created.length && skipped.length) {
        setStatus("Усі обрані задачі вже є на цей день", "err");
      } else if (skipped.length) {
        setStatus(
          `Додано: ${created.length}. Пропущено (вже є): ${skipped.length}`,
          "ok"
        );
      } else {
        setStatus(`Додано ${created.length} задач(у)`, "ok");
      }
    } catch (error) {
      setStatus(error.message || "Помилка додавання", "err");
    } finally {
      button.disabled = false;
    }
  });
}

init();
