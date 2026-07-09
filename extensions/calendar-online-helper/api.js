const API_BASE = "https://api.calendar.online";

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextDayString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  return formatDateInput(date);
}

function buildEventPayload(title, dateStr, subCalendarId) {
  return {
    id: null,
    start_date: `${dateStr} 00:00:00`,
    end_date: `${nextDayString(dateStr)} 00:00:00`,
    title,
    text: "",
    who: "",
    where: "",
    wholeDay: true,
    repeatInterval: 0,
    repeatExpiry: 0,
    repeatExpiryDate: "",
    numberOfRepeats: null,
    repeatSeriesId: null,
    subCalendars: [subCalendarId],
    created: `${dateStr} 00:00:00`,
    readonly: false,
    version: "1.0",
    reminder: [],
    registration: {
      active: false,
      deadline: "",
      useDeadline: false,
      limit: 1,
      useLimit: false,
      visibleFor: 2,
      hideAttendeeNames: false,
      showDetails: false,
      organisatorContactId: null,
      attendees: [],
    },
    externalLinks: [],
    files: [],
  };
}

async function fetchDayEvents(capabilityId, dateStr, timeZone) {
  const params = new URLSearchParams({
    capabilityId,
    startDate: `${dateStr} 00:00:00`,
    endDate: `${dateStr} 23:59:59`,
    timeZone,
  });

  const res = await fetch(`${API_BASE}/event?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "CalendarOnlineHelper/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Не вдалося завантажити події (${res.status})`);
  }

  return res.json();
}

async function createTask(capabilityId, subCalendarId, title, dateStr, timeZone) {
  const body = {
    event: buildEventPayload(title, dateStr, subCalendarId),
    capabilityId,
    timeZone,
    seriesEdit: null,
  };

  const res = await fetch(`${API_BASE}/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
      "User-Agent": "CalendarOnlineHelper/1.0",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.msg || `Помилка API (${res.status})`);
  }

  return data;
}

async function getSubCalendars(capabilityId) {
  const params = new URLSearchParams({ capabilityId });
  const res = await fetch(`${API_BASE}/calendar?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "CalendarOnlineHelper/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Не вдалося завантажити календар (${res.status})`);
  }

  const data = await res.json();
  return (data.subCalendars || []).map((s) => ({
    id: s.id,
    name: s.name,
    canAdd: s.add !== false,
  }));
}
