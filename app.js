const STORAGE_KEY = "commcare-mining-hse-state-v1";

const today = new Date("2026-08-21T10:00:00");
const day = 24 * 60 * 60 * 1000;

const seedState = {
  queue: [],
  observations: [
    {
      id: "OBS-1007",
      type: "Unsafe condition",
      site: "Tarkwa North Pit",
      location: "Haul road B4",
      severity: "High",
      category: "Vehicles",
      description: "Blind corner marker is missing near the active haul route.",
      date: "2026-08-21",
      status: "Reviewed",
      owner: "Ama Mensah"
    },
    {
      id: "OBS-1008",
      type: "Positive safety observation",
      site: "Processing Plant",
      location: "Crusher platform",
      severity: "Low",
      category: "PPE",
      description: "Crew completed lockout check and buddy verification before maintenance.",
      date: "2026-08-21",
      status: "Closed",
      owner: "Kojo Addo"
    },
    {
      id: "OBS-1009",
      type: "Hazard",
      site: "Contractor Yard",
      location: "Fuel storage",
      severity: "Medium",
      category: "Fire",
      description: "Empty drums stored too close to the refueling point.",
      date: "2026-08-20",
      status: "Action Required",
      owner: "Fatou Diop"
    }
  ],
  incidents: [
    {
      id: "INC-2041",
      type: "Near miss",
      site: "Tarkwa North Pit",
      location: "Ramp 3",
      severity: "Critical",
      category: "Vehicles",
      description: "Light vehicle entered haul truck exclusion zone during shift change.",
      date: "2026-08-20",
      status: "Investigation Open",
      owner: "HSE Team"
    },
    {
      id: "INC-2042",
      type: "Environmental incident",
      site: "Processing Plant",
      location: "Water treatment",
      severity: "Medium",
      category: "Environmental",
      description: "Minor process-water overflow contained within bunded area.",
      date: "2026-08-19",
      status: "Actions Assigned",
      owner: "Plant Supervisor"
    }
  ],
  inspections: [
    {
      id: "INS-3104",
      type: "Vehicle inspection",
      site: "Tarkwa North Pit",
      location: "Fleet bay",
      severity: "High",
      progress: 82,
      failed: 2,
      description: "Two failed brake-light checks generated corrective actions.",
      owner: "Maintenance Supervisor"
    },
    {
      id: "INS-3105",
      type: "PPE inspection",
      site: "Processing Plant",
      location: "Mill entrance",
      severity: "Low",
      progress: 96,
      failed: 0,
      description: "Shift inspection complete with no failed checklist items.",
      owner: "Plant Supervisor"
    },
    {
      id: "INS-3106",
      type: "Environmental control inspection",
      site: "Contractor Yard",
      location: "Waste sorting area",
      severity: "Medium",
      progress: 64,
      failed: 3,
      description: "Waste segregation labels missing from two containers.",
      owner: "Contractor Lead"
    }
  ],
  actions: [
    {
      id: "ACT-4508",
      source: "OBS-1007",
      issue: "Replace missing blind corner marker",
      site: "Tarkwa North Pit",
      severity: "High",
      owner: "Roads Crew",
      dueDate: "2026-08-21",
      status: "Assigned",
      description: "Install reflective marker and update traffic control map."
    },
    {
      id: "ACT-4509",
      source: "INC-2041",
      issue: "Refresh exclusion-zone briefing",
      site: "Tarkwa North Pit",
      severity: "Critical",
      owner: "Mine Supervisor",
      dueDate: "2026-08-20",
      status: "In Progress",
      description: "Complete crew briefing and collect acknowledgements."
    },
    {
      id: "ACT-4510",
      source: "INS-3106",
      issue: "Relabel waste sorting containers",
      site: "Contractor Yard",
      severity: "Medium",
      owner: "Contractor Lead",
      dueDate: "2026-08-19",
      status: "Open",
      description: "Apply standard labels and upload closure photo."
    },
    {
      id: "ACT-4511",
      source: "INC-2042",
      issue: "Review bund level alarm",
      site: "Processing Plant",
      severity: "Medium",
      owner: "Plant Supervisor",
      dueDate: "2026-08-22",
      status: "Completed",
      description: "Alarm test completed; awaiting HSE verification."
    },
    {
      id: "ACT-4512",
      source: "OBS-1008",
      issue: "Share positive lockout practice",
      site: "Processing Plant",
      severity: "Low",
      owner: "HSE Manager",
      dueDate: "2026-08-23",
      status: "Verified",
      description: "Positive observation included in toolbox talk."
    }
  ],
  training: [
    { title: "Vehicle exclusion zones", role: "All drivers", compliance: 74, expiry: "12 expiring this month" },
    { title: "Working at height", role: "Maintenance teams", compliance: 88, expiry: "4 expiring this month" },
    { title: "Environmental controls", role: "Contractors", compliance: 69, expiry: "18 expiring this month" }
  ]
};

let state = loadState();
let activeForm = "observation";

const views = ["dashboard", "observations", "incidents", "inspections", "actions", "training"];
const formTypes = {
  observation: ["Unsafe condition", "Unsafe act", "Hazard", "Positive safety observation"],
  incident: ["Incident", "Near miss", "Injury", "Environmental incident", "Property/equipment damage"],
  inspection: ["Work area inspection", "Vehicle inspection", "Equipment inspection", "PPE inspection", "Contractor site inspection"],
  action: ["Corrective action"]
};

const roleProfiles = {
  "Worker / Field Agent": {
    workspace: "Field Reporting Workspace",
    focus: "Fast hazard, near-miss, and incident capture for frontline users.",
    kicker: "Offline field mode",
    headline: "Report a hazard or near miss in under two minutes",
    summary: "A simplified frontline view for quick capture, photos, AI-assisted classification, and local offline queueing.",
    meterValue: "3",
    meterLabel: "My reports",
    quickForm: "observation",
    defaultView: "observations",
    nav: ["observations", "incidents", "training"],
    kpis: ["My observations", "My incidents", "Queued records", "Safety messages"]
  },
  Supervisor: {
    workspace: "Supervisor Follow-up Workspace",
    focus: "Review team submissions, conduct inspections, assign actions, and verify closure evidence.",
    kicker: "Team shift control",
    headline: "Review field risk and close the loop with your crew",
    summary: "A supervisor view centered on inspections, assigned corrective actions, overdue follow-up, and closure verification.",
    meterValue: "6",
    meterLabel: "Team actions",
    quickForm: "inspection",
    defaultView: "inspections",
    nav: ["dashboard", "observations", "incidents", "inspections", "actions"],
    kpis: ["Team observations", "Open actions", "Overdue actions", "Inspections"]
  },
  "HSE Manager": {
    workspace: "HSE Manager Command Center",
    focus: "Cross-site KPIs, recurring hazards, incidents, and corrective action closure.",
    kicker: "Tarkwa North Pit",
    headline: "Today's HSE operating picture",
    summary: "Capture field risk, route corrective action, verify closure, and keep leadership aligned from a single offline-ready workspace.",
    meterValue: "68",
    meterLabel: "Risk index",
    quickForm: "observation",
    defaultView: "dashboard",
    nav: ["dashboard", "observations", "incidents", "inspections", "actions", "training"],
    kpis: ["Incidents", "Near misses", "Observations", "Open actions", "Inspections", "Training compliance", "High/Critical", "Closure rate"]
  },
  "Mine / Country Manager": {
    workspace: "Leadership Risk Overview",
    focus: "Major risks, serious incidents, overdue actions, trends, and site performance.",
    kicker: "Executive overview",
    headline: "See the highest-risk sites and decisions that need attention",
    summary: "A leadership view focused on serious events, overdue corrective actions, contractor performance, and management reporting.",
    meterValue: "4",
    meterLabel: "Major risks",
    quickForm: "incident",
    defaultView: "dashboard",
    nav: ["dashboard", "incidents", "actions", "training"],
    kpis: ["Serious events", "Overdue actions", "High/Critical", "Closure rate", "Training compliance", "Top site risk"]
  }
};

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function currentRole() {
  return qs("#roleSelect")?.value || "HSE Manager";
}

function roleProfile() {
  return roleProfiles[currentRole()] || roleProfiles["HSE Manager"];
}

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

function severityClass(severity) {
  return `severity-${severity.toLowerCase()}`;
}

function passesFilters(record) {
  const site = qs("#siteFilter").value;
  const severity = qs("#severityFilter").value;
  return (site === "all" || record.site === site) && (severity === "all" || record.severity === severity);
}

function records() {
  const all = [...state.observations, ...state.incidents, ...state.actions];
  return all.filter(passesFilters);
}

function isOverdue(action) {
  return action.status !== "Verified" && action.status !== "Completed" && new Date(action.dueDate) < today;
}

function renderKpis() {
  const actions = state.actions.filter(passesFilters);
  const allKpis = {
    "Incidents": { label: "Incidents", value: state.incidents.filter(passesFilters).length, delta: "+1 from yesterday" },
    "Near misses": { label: "Near misses", value: state.incidents.filter((item) => item.type === "Near miss" && passesFilters(item)).length, delta: "Critical focus" },
    "Observations": { label: "Observations", value: state.observations.filter(passesFilters).length, delta: "67% reviewed" },
    "Open actions": { label: "Open actions", value: actions.filter((item) => item.status !== "Verified").length, delta: `${actions.filter(isOverdue).length} overdue` },
    "Inspections": { label: "Inspections", value: state.inspections.filter(passesFilters).length, delta: "81% complete" },
    "Training compliance": { label: "Training compliance", value: "77%", delta: "Contractors below target" },
    "High/Critical": { label: "High/Critical", value: records().filter((item) => ["High", "Critical"].includes(item.severity)).length, delta: "Leadership watch" },
    "Closure rate": { label: "Closure rate", value: "72%", delta: "+8% this week" },
    "My observations": { label: "My observations", value: state.observations.length, delta: "2 need follow-up" },
    "My incidents": { label: "My incidents", value: state.incidents.length, delta: "1 near miss" },
    "Queued records": { label: "Queued records", value: state.queue.length, delta: navigator.onLine ? "Ready to sync" : "Offline queue" },
    "Safety messages": { label: "Safety messages", value: 5, delta: "2 unread" },
    "Team observations": { label: "Team observations", value: state.observations.length, delta: "Shift total" },
    "Overdue actions": { label: "Overdue actions", value: actions.filter(isOverdue).length, delta: "Needs attention" },
    "Serious events": { label: "Serious events", value: state.incidents.filter((item) => item.severity === "Critical").length, delta: "Leadership watch" },
    "Top site risk": { label: "Top site risk", value: "Tarkwa", delta: "Vehicle controls" }
  };
  const data = roleProfile().kpis.map((key) => allKpis[key]).filter(Boolean);

  qs("#kpiGrid").innerHTML = data.map((item) => `
    <article class="kpi-card">
      <span class="kpi-label">${item.label}</span>
      <strong class="kpi-value">${item.value}</strong>
      <span class="kpi-delta">${item.delta}</span>
    </article>
  `).join("");
}

function renderTrendChart() {
  const values = [7, 10, 8, 13, 9, 15, 12];
  const labels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const max = Math.max(...values);
  qs("#trendChart").innerHTML = values.map((value, index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.max(18, (value / max) * 100)}%" title="${value} records"></div>
      <span class="bar-label">${labels[index]}</span>
    </div>
  `).join("");
}

function renderCategories() {
  const counts = records().reduce((acc, item) => {
    const key = item.category || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((entry) => entry[1]));

  qs("#categoryList").innerHTML = entries.map(([name, count]) => `
    <div class="category-row">
      <strong>${name}</strong>
      <span class="category-track"><span class="category-fill" style="width:${(count / max) * 100}%"></span></span>
      <span>${count}</span>
    </div>
  `).join("") || `<p class="record-description">No matching categories.</p>`;
}

function recordCard(item, options = {}) {
  const status = item.status ? `<span class="pill">${item.status}</span>` : "";
  const actionButton = options.actionButton || "";
  return `
    <article class="record-card">
      <div class="record-topline">
        <span class="record-title">${item.id} · ${item.type || item.issue}</span>
        <span class="pill ${severityClass(item.severity)}">${item.severity}</span>
      </div>
      <p class="record-description">${item.description}</p>
      <div class="record-meta">
        <span>${item.site}</span>
        <span>${item.location || item.owner}</span>
        <span>${item.date || item.dueDate || ""}</span>
        ${status}
      </div>
      ${actionButton}
    </article>
  `;
}

function renderRecords() {
  qs("#observationsList").innerHTML = state.observations.filter(passesFilters).map((item) => recordCard(item, {
    actionButton: `<div class="record-actions"><button class="secondary-button" data-create-action="${item.id}" type="button">Create action</button></div>`
  })).join("") || emptyState("No observations match the current filters.");

  qs("#incidentsList").innerHTML = state.incidents.filter(passesFilters).map((item) => recordCard(item, {
    actionButton: `<div class="record-actions"><button class="secondary-button" data-create-action="${item.id}" type="button">Assign corrective action</button></div>`
  })).join("") || emptyState("No incidents match the current filters.");

  const overdue = state.actions.filter((item) => passesFilters(item) && isOverdue(item));
  qs("#overdueCount").textContent = `${overdue.length} overdue`;
  qs("#overdueList").innerHTML = overdue.map((item) => recordCard({
    ...item,
    type: item.issue,
    location: item.owner,
    date: item.dueDate
  })).join("") || emptyState("No overdue actions.");
}

function renderInspections() {
  qs("#inspectionBoard").innerHTML = state.inspections.filter(passesFilters).map((item) => `
    <article class="inspection-card">
      <div class="record-topline">
        <span class="record-title">${item.id} · ${item.type}</span>
        <span class="pill ${severityClass(item.severity)}">${item.severity}</span>
      </div>
      <p class="record-description">${item.description}</p>
      <progress value="${item.progress}" max="100"></progress>
      <div class="record-meta">
        <span>${item.progress}% complete</span>
        <span>${item.failed} failed item${item.failed === 1 ? "" : "s"}</span>
        <span>${item.owner}</span>
      </div>
    </article>
  `).join("") || emptyState("No inspections match the current filters.");
}

function renderActions() {
  const statuses = ["Open", "Assigned", "In Progress", "Completed", "Verified"];
  qs("#actionsBoard").innerHTML = statuses.map((status) => {
    const items = state.actions.filter((item) => item.status === status && passesFilters(item));
    return `
      <section class="kanban-column" aria-label="${status} actions">
        <div class="kanban-title"><span>${status}</span><span>${items.length}</span></div>
        ${items.map((item) => recordCard({
          ...item,
          type: item.issue,
          location: item.owner,
          date: item.dueDate
        }, {
          actionButton: status === "Verified" ? "" : `<div class="record-actions"><button class="secondary-button" data-advance-action="${item.id}" type="button">Advance status</button></div>`
        })).join("") || emptyState("No actions")}
      </section>
    `;
  }).join("");
}

function renderTraining() {
  qs("#trainingGrid").innerHTML = state.training.map((item) => `
    <article class="training-card">
      <div class="record-topline">
        <span class="record-title">${item.title}</span>
        <span class="pill">${item.compliance}%</span>
      </div>
      <p class="record-description">${item.role}</p>
      <progress value="${item.compliance}" max="100"></progress>
      <div class="record-meta">
        <span>${item.expiry}</span>
      </div>
    </article>
  `).join("");
}

function emptyState(text) {
  return `<article class="record-card"><p class="record-description">${text}</p></article>`;
}

function renderAll() {
  applyRoleProfile();
  renderKpis();
  renderTrendChart();
  renderCategories();
  renderRecords();
  renderInspections();
  renderActions();
  renderTraining();
  updateConnectionStatus();
}

function switchView(view) {
  const profile = roleProfile();
  if (!profile.nav.includes(view)) {
    showToast(`${currentRole()} profile does not use the ${view} workspace in this demo.`);
    view = profile.defaultView;
  }
  qsa(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  qsa(".content-view").forEach((item) => item.classList.toggle("active", item.id === `${view}View`));
  qs("#viewTitle").textContent = view === "actions" ? "Corrective Actions" : view[0].toUpperCase() + view.slice(1);
  if (location.hash !== `#${view}`) {
    history.replaceState(null, "", `#${view}`);
  }
}

function applyRoleProfile() {
  const profile = roleProfile();
  qs("#roleWorkspace").textContent = profile.workspace;
  qs("#roleFocus").textContent = profile.focus;
  qs("#roleKicker").textContent = profile.kicker;
  qs("#roleHeadline").textContent = profile.headline;
  qs("#roleSummary").textContent = profile.summary;
  qs("#roleMeterValue").textContent = profile.meterValue;
  qs("#roleMeterLabel").textContent = profile.meterLabel;
  qs("#roleMeter").setAttribute("aria-label", `${profile.meterLabel} ${profile.meterValue}`);
  qs("#quickReportButton").textContent = profile.quickForm === "inspection" ? "Start inspection" : "New report";
  qsa(".nav-item").forEach((item) => {
    const available = profile.nav.includes(item.dataset.view);
    item.classList.toggle("locked", !available);
    item.disabled = false;
  });
}

function changeRole() {
  const profile = roleProfile();
  renderAll();
  switchView(profile.defaultView);
  showToast(`${currentRole()} workspace loaded.`);
}

function openForm(kind, defaults = {}) {
  activeForm = kind;
  const modal = qs("#recordModal");
  const form = qs("#recordForm");
  form.reset();
  qs("#recordType").innerHTML = formTypes[kind].map((type) => `<option>${type}</option>`).join("");
  qs("#modalEyebrow").textContent = kind === "action" ? "Corrective action" : "Frontline capture";
  qs("#modalTitle").textContent = {
    observation: "New safety observation",
    incident: "New incident or near miss",
    inspection: "Start inspection",
    action: "New corrective action"
  }[kind];
  qs("#aiSuggestion").textContent = "Describe the record to generate category, severity, and action suggestions.";

  Object.entries(defaults).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });

  modal.showModal();
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

function suggestFromDescription() {
  const form = qs("#recordForm");
  const description = form.elements.description.value;
  const category = inferCategory(description);
  const severity = description.toLowerCase().includes("near miss") || description.toLowerCase().includes("exclusion")
    ? "Critical"
    : form.elements.severity.value;
  form.elements.severity.value = severity;
  qs("#aiSuggestion").textContent = `Suggested category: ${category}. Suggested severity: ${severity}. Suggested action: assign owner, set due date, and require closure evidence.`;
}

function saveRecord(event) {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const form = new FormData(qs("#recordForm"));
  const description = form.get("description").trim();
  const site = form.get("site");
  const severity = form.get("severity");
  const location = form.get("location").trim();
  const owner = form.get("owner").trim() || "Unassigned";
  const dueDate = form.get("dueDate") || new Date(today.getTime() + day).toISOString().slice(0, 10);
  const type = form.get("type");
  const category = inferCategory(description);

  if (!description || !location) return;

  const base = { type, site, location, severity, category, description, owner };
  if (activeForm === "observation") {
    state.observations.unshift({ id: nextId("OBS", state.observations), ...base, date: "2026-08-21", status: "Submitted" });
  } else if (activeForm === "incident") {
    state.incidents.unshift({ id: nextId("INC", state.incidents), ...base, date: "2026-08-21", status: "Reported" });
  } else if (activeForm === "inspection") {
    state.inspections.unshift({ id: nextId("INS", state.inspections), ...base, progress: 18, failed: severity === "Low" ? 0 : 1 });
  } else {
    state.actions.unshift({
      id: nextId("ACT", state.actions),
      source: "Manual",
      issue: type,
      site,
      severity,
      owner,
      dueDate,
      status: owner === "Unassigned" ? "Open" : "Assigned",
      description
    });
  }

  state.queue.unshift({ id: `SYNC-${Date.now()}`, kind: activeForm, status: navigator.onLine ? "Ready" : "Offline queued" });
  saveState();
  qs("#recordModal").close();
  renderAll();
  showToast(navigator.onLine ? "Record saved and ready to sync." : "Offline record queued on this device.");
}

function nextId(prefix, collection) {
  const max = collection.reduce((acc, item) => {
    const value = Number(String(item.id).split("-")[1] || 0);
    return Math.max(acc, value);
  }, 0);
  return `${prefix}-${max + 1}`;
}

function createActionFromSource(sourceId) {
  const source = [...state.observations, ...state.incidents].find((item) => item.id === sourceId);
  if (!source) return;
  openForm("action", {
    severity: source.severity,
    site: source.site,
    location: source.location,
    description: `Corrective action for ${source.id}: ${source.description}`
  });
}

function advanceAction(id) {
  const order = ["Open", "Assigned", "In Progress", "Completed", "Verified"];
  const action = state.actions.find((item) => item.id === id);
  if (!action) return;
  const index = order.indexOf(action.status);
  action.status = order[Math.min(index + 1, order.length - 1)];
  saveState();
  renderAll();
  showToast(`${id} moved to ${action.status}.`);
}

function updateConnectionStatus() {
  const status = qs("#connectionStatus");
  const dot = status.querySelector(".status-dot");
  dot.classList.toggle("offline", !navigator.onLine);
  const queueText = state.queue.length ? ` · ${state.queue.length} queued` : "";
  status.lastElementChild.textContent = `${navigator.onLine ? "Online" : "Offline"}${queueText}`;
}

function syncQueue() {
  if (!navigator.onLine) {
    showToast("Offline mode: records remain safely queued.");
    return;
  }
  const count = state.queue.length;
  state.queue = [];
  saveState();
  updateConnectionStatus();
  showToast(count ? `${count} queued record${count === 1 ? "" : "s"} synced.` : "Nothing to sync.");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      showToast("Offline cache registration was blocked by the browser.");
    });
  }
}

qsa(".nav-item").forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
qsa("[data-open-form]").forEach((item) => item.addEventListener("click", () => openForm(item.dataset.openForm)));
qs("#quickReportButton").addEventListener("click", () => openForm(roleProfile().quickForm));
qs("#roleSelect").addEventListener("change", changeRole);
qs("#recordForm").addEventListener("submit", saveRecord);
qs("#aiSuggestButton").addEventListener("click", suggestFromDescription);
qs("#siteFilter").addEventListener("change", renderAll);
qs("#severityFilter").addEventListener("change", renderAll);
qs("#syncButton").addEventListener("click", syncQueue);
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
document.addEventListener("click", (event) => {
  const createButton = event.target.closest("[data-create-action]");
  const advanceButton = event.target.closest("[data-advance-action]");
  if (createButton) createActionFromSource(createButton.dataset.createAction);
  if (advanceButton) advanceAction(advanceButton.dataset.advanceAction);
});

renderAll();
switchView(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : "dashboard");
registerServiceWorker();

if (!views.includes("dashboard")) {
  throw new Error("Required dashboard view is missing.");
}
