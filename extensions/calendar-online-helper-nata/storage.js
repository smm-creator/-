const DEFAULT_SETTINGS = {
  capabilityId: "93db73458eb6edaca115",
  subCalendarId: 3440917,
  timeZone: "Europe/Kiev",
  presets: [
    "Фото журналу",
    "Алібіба",
    "Розкадравки П1Ж",
    "Перші кадри П1Ж",
    "Зйомка",
    "Друк постерів",
    "Оформлення акції",
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
