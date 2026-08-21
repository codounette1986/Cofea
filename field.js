const STORAGE_KEY = "commcare-mining-hse-state-v1";

const formTypes = {
  observation: ["Unsafe condition", "Unsafe act", "Hazard", "Positive safety observation"],
  incident: ["Incident", "Near miss", "Injury", "Environmental incident", "Property/equipment damage"],
  inspection: ["Work area inspection", "Vehicle inspection", "Equipment inspection", "PPE inspection", "Contractor site inspection"]
};

const seedState = {
  queue: [],
  observations: [],
  incidents: [],
  inspections: [],
  actions: [],
  training: []
};

let activeKind = "observation";
let state = loadState();

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(seedState);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2500);
}

function inferCategory(text) {
  const value = text.toLowerCase();
  if (value.includes("vehicle") || value.includes("haul") || value.includes("truck")) return "Vehicles";
  if (value.includes("ppe") || value.includes("helmet") || value.includes("glove")) return "PPE";
  if (value.includes("spill") || value.includes("water") || value.includes("waste")) return "Environmental";
  if (value.includes("height") || value.includes("platform")) return "Working at height";
  if (value.includes("fire") || value.includes("fuel")) return "Fire";
  if (value.includes("electrical") || value.includes("cable")) return "Electrical";
  return "Housekeeping";
}

function nextId(prefix, collection) {
  const max = collection.reduce((acc, item) => {
    const value = Number(String(item.id).split("-")[1] || 0);
    return Math.max(acc, value);
  }, 0);
  return `${prefix}-${max + 1}`;
}

function setKind(kind) {
  activeKind = kind;
  qsa(".field-action").forEach((button) => button.classList.toggle("active", button.dataset.kind === kind));
  qs("#fieldType").innerHTML = formTypes[kind].map((type) => `<option>${type}</option>`).join("");
}

function updateConnection() {
  qs("#fieldStatusDot").classList.toggle("offline", !navigator.onLine);
  qs("#fieldStatus").textContent = `${navigator.onLine ? "Online" : "Offline"} · ${state.queue.length} queued`;
}

function suggest() {
  const form = qs("#fieldForm");
  const description = form.elements.description.value;
  const category = inferCategory(description);
  const severity = description.toLowerCase().includes("near miss") || description.toLowerCase().includes("exclusion")
    ? "Critical"
    : form.elements.severity.value;
  form.elements.severity.value = severity;
  qs("#fieldSuggestion").textContent = `Suggested category: ${category}. Suggested severity: ${severity}. Supervisor should review and assign action if needed.`;
}

function saveReport(event) {
  event.preventDefault();
  const form = new FormData(qs("#fieldForm"));
  const description = form.get("description").trim();
  const location = form.get("location").trim();
  if (!description || !location) return;

  const record = {
    type: form.get("type"),
    site: form.get("site"),
    location,
    severity: form.get("severity"),
    category: inferCategory(description),
    description,
    owner: "Field user",
    date: new Date().toISOString().slice(0, 10),
    status: navigator.onLine ? "Ready to sync" : "Offline queued",
    hasPhoto: Boolean(form.get("photo")?.name)
  };

  if (activeKind === "observation") {
    state.observations.unshift({ id: nextId("OBS", state.observations), ...record });
  } else if (activeKind === "incident") {
    state.incidents.unshift({ id: nextId("INC", state.incidents), ...record, status: "Reported" });
  } else {
    state.inspections.unshift({ id: nextId("INS", state.inspections), ...record, progress: 10, failed: record.severity === "Low" ? 0 : 1 });
  }

  state.queue.unshift({ id: `SYNC-${Date.now()}`, kind: activeKind, status: record.status });
  saveState();
  qs("#fieldForm").reset();
  setKind(activeKind);
  renderRecords();
  updateConnection();
  showToast("Saved on this device.");
}

function renderRecords() {
  const records = [
    ...state.observations.map((item) => ({ ...item, module: "Observation" })),
    ...state.incidents.map((item) => ({ ...item, module: "Incident" })),
    ...state.inspections.map((item) => ({ ...item, module: "Inspection" }))
  ].slice(0, 8);

  qs("#fieldRecords").innerHTML = records.map((item) => `
    <article class="record-card">
      <div class="record-topline">
        <span class="record-title">${item.id} · ${item.module}</span>
        <span class="pill severity-${item.severity.toLowerCase()}">${item.severity}</span>
      </div>
      <p class="record-description">${item.description}</p>
      <div class="record-meta">
        <span>${item.site}</span>
        <span>${item.location}</span>
        <span>${item.status}</span>
        ${item.hasPhoto ? "<span>Photo attached</span>" : ""}
      </div>
    </article>
  `).join("") || `<article class="record-card"><p class="record-description">No reports saved yet.</p></article>`;
}

function sync() {
  if (!navigator.onLine) {
    showToast("Offline: reports remain queued.");
    return;
  }
  const count = state.queue.length;
  state.queue = [];
  saveState();
  updateConnection();
  showToast(count ? `${count} report${count === 1 ? "" : "s"} synced.` : "Nothing to sync.");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

qsa(".field-action").forEach((button) => button.addEventListener("click", () => setKind(button.dataset.kind)));
qs("#fieldSuggest").addEventListener("click", suggest);
qs("#fieldForm").addEventListener("submit", saveReport);
qs("#fieldSync").addEventListener("click", sync);
window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);

setKind(activeKind);
renderRecords();
updateConnection();
registerServiceWorker();
