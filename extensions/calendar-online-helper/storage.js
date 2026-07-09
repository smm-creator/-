const DEFAULT_SETTINGS = {
  capabilityId: "93db73458eb6edaca115",
  subCalendarId: 3476304,
  timeZone: "Europe/Kiev",
  presets: [
    "постинг p1g prof1",
    "відповіді на коментарі",
    "ГА данні у звіт",
    "замовлення",
    "звіт за квартал",
    "монтаж відео lowa",
    "тест моделей генерації фото",
    "пошук моделей+референси",
  ],
};

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve({
        ...DEFAULT_SETTINGS,
        ...items,
        subCalendarId: Number(items.subCalendarId || DEFAULT_SETTINGS.subCalendarId),
      });
    });
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, resolve);
  });
}
