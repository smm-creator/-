function setStatus(text) {
  document.getElementById("status").textContent = text;
}

async function init() {
  const settings = await getSettings();

  document.getElementById("capabilityId").value = settings.capabilityId;
  document.getElementById("subCalendarId").value = settings.subCalendarId;
  document.getElementById("timeZone").value = settings.timeZone;
  document.getElementById("presets").value = settings.presets.join("\n");

  document.getElementById("save").addEventListener("click", async () => {
    const capabilityId = document.getElementById("capabilityId").value.trim();
    const subCalendarId = Number(document.getElementById("subCalendarId").value);
    const timeZone = document.getElementById("timeZone").value.trim();
    const presets = document
      .getElementById("presets")
      .value.split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!capabilityId) {
      setStatus("Вкажіть ID календаря");
      return;
    }

    await saveSettings({
      capabilityId,
      subCalendarId,
      timeZone: timeZone || "Europe/Kiev",
      presets,
    });

    setStatus("Збережено");
  });
}

init();
