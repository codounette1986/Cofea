const stateKey = "agripilot-state-v1";
const activeProfileKey = "agripilot-active-profile-v1";
const authUserKey = "agripilot-auth-user-v1";
const lastRemoteSyncKey = "agripilot-last-remote-sync-v1";
const weatherCacheKey = "agripilot-weather-forecast-v1";
const weatherLocationCacheKey = "agripilot-weather-location-v1";
const deletionRetentionDays = 30;

const supabaseConfig = {
  url: "https://zulvxofvazgsllibodfp.supabase.co",
  key: "sb_publishable_OgcGnMHMk8M_7pJBg-El2g_lQTNIqz7",
  metaTable: "app_sync_meta",
  rowId: "agripilot-main",
  tables: {
    profiles: "profiles",
    fields: "fields",
    tasks: "tasks",
    dailyTaskTemplates: "daily_task_templates",
    harvests: "harvests",
    crops: "crops",
    stock: "stock",
    finance: "finance",
    team: "team",
    userAccounts: "user_accounts"
  }
};

function createId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function repairTextEncoding(value) {
  if (typeof value === "string") return repairStringEncoding(value);
  if (Array.isArray(value)) return value.map(repairTextEncoding);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairTextEncoding(item)]));
  }
  return value;
}

function repairStringEncoding(value) {
  if (!/[ÃÂ�]/.test(value)) return value;
  try {
    if (typeof TextDecoder !== "undefined") {
      const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 255);
      return new TextDecoder("utf-8").decode(bytes);
    }
  } catch (error) {
    return value;
  }
  return value
    .replaceAll("Ã©", "é")
    .replaceAll("Ã¨", "è")
    .replaceAll("Ãª", "ê")
    .replaceAll("Ã ", "à")
    .replaceAll("Ã§", "ç")
    .replaceAll("Ã‰", "É")
    .replaceAll("Â°C", "°C")
    .replaceAll("Â", "");
}

const starterState = {
  profiles: [
    { id: "admin-profile", name: "Admins", role: "Admin", note: "Accès complet à toute l'application." },
    { id: "chef-profile", name: "Chef d'exploitation", role: "Chef exploitation", note: "Pilotage opérationnel sans accès aux finances." },
    { id: "commercial-profile", name: "Commercial", role: "Commercial", note: "Suivi des cultures, récoltes, stock et contacts sans accès aux dépenses." },
    { id: "comptable-profile", name: "Comptable", role: "Comptable", note: "Accès aux finances, revenus et dépenses." },
    { id: "terrain-profile", name: "Équipe terrain", role: "Terrain", note: "Accès terrain. Finances et revenus masqués." }
  ],
  fields: [],
  tasks: [],
  harvests: [],
  crops: [],
  stock: [],
  finance: [],
  team: [
    { id: "admin-user", name: "Administrateur", role: "Admin", phone: "", profileId: "admin-profile", login: "admin", password: "admin123" }
  ]
};

const retiredDemoUserLogins = new Set(["awa", "mamadou", "ibrahima"]);
const retiredDemoUserNames = new Set(["awa ndiaye", "mamadou fall", "ibrahima diop"]);
const retiredStarterExamples = {
  fields: new Set(["Serre 1|Poivrons|0.6|Serre", "Serre 2|Piment|0.4|Serre", "Plein champ Nord|Papayes|2.8|Plein champ", "Plein champ Sud|Piment|1.7|Plein champ"]),
  tasks: new Set(["Contrôle goutte-à-goutte|Serre 1|Awa|2026-08-18", "Tuteurage des poivrons|Serre 1|Mamadou|2026-08-19", "Surveillance thrips et acariens|Serre 2|Ibrahima|2026-08-17", "Paillage papayers|Plein champ Nord|Awa|2026-08-22", "Désherbage plein champ|Plein champ Sud|Mamadou|2026-08-20"]),
  harvests: new Set(["2026-08-10|Serre 2|Piment|64", "2026-08-13|Serre 1|Poivrons|48", "2026-08-15|Plein champ Nord|Papayes|32"]),
  stock: new Set(["Semences poivron|Semences|8", "Plants papayer|Plantation|120", "Compost|Fertilisation|1.6", "Film serre|Serre|2"]),
  finance: new Set(["2026-08-12|Vente piment frais|Piment|185000", "2026-08-13|Vente poivrons restaurant|Poivrons|144000", "2026-08-14|Main d'oeuvre serre|Poivrons|42000", "2026-08-15|Achat compost papayes|Papayes|38000"])
};

let state;
let currentView = "dashboard";
let activeTaskFilter = "Tous";
let activePriceCrop = "Toutes";
let activeFinanceUserFilter = "Tous";
let periodFilters = {
  tasks: { from: "", to: "" },
  harvests: { from: "", to: "" },
  finance: { from: "", to: "" },
  prices: { from: "", to: "" }
};
let tableSorts = {
  tasks: { key: "due", direction: "asc" },
  harvests: { key: "date", direction: "desc" },
  finance: { key: "date", direction: "desc" },
  financeByCrop: { key: "crop", direction: "asc" },
  prices: { key: "date", direction: "desc" }
};
let modalType = "task";
let modalAccessType = "task";
let editingRecord = null;
let activeProfileId = localStorage.getItem(activeProfileKey) || "admin-profile";
let activeUserId = sessionStorage.getItem(authUserKey) || "";
let syncTimer = null;
let autoSyncTimer = null;
let syncInProgress = false;
let remoteWriteInProgress = false;
let weatherForecast = loadCachedWeather();
let weatherLocation = loadCachedWeatherLocation();
let weatherInProgress = false;
let syncState = {
  status: "idle",
  detail: localStorage.getItem(lastRemoteSyncKey) ? `Dernière synchro : ${localStorage.getItem(lastRemoteSyncKey)}` : "Supabase prêt"
};

window.addEventListener("error", (event) => {
  showStartupError(event.message || "Erreur de chargement de l'application.");
});

window.addEventListener("unhandledrejection", (event) => {
  showStartupError((event.reason && event.reason.message) || "Erreur réseau ou synchronisation interrompue.");
});

const cropStages = [
  "Pépinière",
  "Repiquage",
  "Reprise",
  "Croissance",
  "Floraison",
  "Nouaison",
  "Fructification",
  "Récolte",
  "Fin de cycle"
];

const healthRanges = [
  "95 - Très saine : plants vigoureux, feuillage propre, croissance régulière",
  "80 - Bonne : quelques points à surveiller, production normale",
  "65 - Moyenne : stress visible, ravageurs légers ou croissance irrégulière",
  "45 - Faible : problème important, intervention nécessaire rapidement",
  "20 - Critique : forte maladie, manque d'eau sévère ou pertes de plants"
];

const navItems = [
  ["dashboard", "Tableau de bord", "dashboard"],
  ["fields", "Parcelles", "fields"],
  ["crops", "Cultures", "crops"],
  ["tasks", "Travaux", "tasks"],
  ["harvests", "Récoltes", "harvests"],
  ["stock", "Stock", "stock"],
  ["finance", "Finances", "finance"],
  ["prices", "Prix vente", "prices"],
  ["profiles", "Profils", "profiles"],
  ["team", "Équipe", "team"]
];

const accessPages = navItems
  .filter(([id]) => id !== "profiles")
  .map(([id, label]) => ({ id, label }));

const defaultPagesByRole = {
  Admin: accessPages.map((page) => page.id).concat("profiles"),
  Comptable: ["dashboard", "finance", "prices"],
  "Chef exploitation": ["dashboard", "fields", "crops", "tasks", "harvests", "stock", "team"],
  Commercial: ["dashboard", "fields", "crops", "harvests", "stock", "prices", "team"],
  Terrain: ["dashboard", "fields", "tasks", "harvests", "stock", "team"]
};

const dailyTaskTemplates = [];
const accessSections = {
  dashboard: [
    { id: "dashboard:kpis", label: "Indicateurs" },
    { id: "dashboard:tasks", label: "Travaux prioritaires" },
    { id: "dashboard:weather", label: "Météo agricole" },
    { id: "dashboard:fields", label: "Aperçu parcelles" },
    { id: "dashboard:stock", label: "Alertes stock" },
    { id: "dashboard:harvests", label: "Récoltes par culture active" },
    { id: "dashboard:revenues", label: "Revenus" }
  ],
  fields: [
    { id: "fields:list", label: "Liste des parcelles" },
    { id: "fields:write", label: "Ajout / modification" },
    { id: "fields:delete", label: "Suppression" }
  ],
  crops: [
    { id: "crops:list", label: "Base des cultures" },
    { id: "crops:write", label: "Ajout / modification" },
    { id: "crops:delete", label: "Suppression" }
  ],
  tasks: [
    { id: "tasks:base", label: "Base quotidienne" },
    { id: "tasks:filters", label: "Filtres des travaux" },
    { id: "tasks:list", label: "Planning des travaux" },
    { id: "tasks:write", label: "Ajout / modification" },
    { id: "tasks:delete", label: "Suppression" }
  ],
  harvests: [
    { id: "harvests:summary", label: "Résumé par parcelle" },
    { id: "harvests:table", label: "Historique des récoltes" },
    { id: "harvests:write", label: "Ajout / modification" },
    { id: "harvests:delete", label: "Suppression" }
  ],
  stock: [
    { id: "stock:list", label: "Inventaire" },
    { id: "stock:write", label: "Ajout / modification" },
    { id: "stock:delete", label: "Suppression" }
  ],
  finance: [
    { id: "finance:summary", label: "Résumé financier" },
    { id: "finance:operations", label: "Tableau des opérations" },
    { id: "finance:byCrop", label: "Recettes et dépenses par culture" },
    { id: "finance:cash", label: "Caisse et avances" },
    { id: "finance:userFilter", label: "Filtre par utilisateur" },
    { id: "finance:allOperations", label: "Voir toutes les opérations" },
    { id: "finance:ownOperations", label: "Voir seulement ses opérations" },
    { id: "finance:validate", label: "Validation caisse" },
    { id: "finance:write", label: "Ajout / modification" },
    { id: "finance:delete", label: "Suppression" }
  ],
  prices: [
    { id: "prices:filters", label: "Filtre par culture" },
    { id: "prices:chart", label: "Courbe du prix/kg" },
    { id: "prices:sales", label: "Tableau des ventes" },
    { id: "prices:write", label: "Ajout / modification" }
  ],
  team: [
    
    { id: "team:list", label: "Liste de l'équipe" },
    { id: "team:write", label: "Ajout / modification" },
    { id: "team:delete", label: "Suppression" }
  ]
};

const modalConfig = {
  profile: {
    title: "Ajouter un profil",
    collection: "profiles",
    fields: [
      ["name", "Nom du profil", "text"],
      ["role", "Rôle", "select", ["Admin", "Chef exploitation", "Commercial", "Comptable", "Terrain"]],
      ["pages", "Pages autorisées", "pagesSelect"],
      ["sections", "Sous-sections autorisées", "sectionsSelect"],
      ["note", "Note", "textarea"]
    ]
  },
  field: {
    title: "Ajouter une parcelle",
    collection: "fields",
    fields: [
      ["name", "Nom", "text"],
      ["crop", "Culture", "cropSelect"],
      ["area", "Surface (ha)", "number"],
      ["active", "Parcelle active", "checkbox"],
      ["stage", "Stade", "select", cropStages],
      ["health", "Santé de la parcelle", "select", healthRanges],
      ["mode", "Mode", "select", ["Plein champ", "Serre"]],
      ["update", "Mise à jour / observation", "textarea"]
    ]
  },
  crop: {
    title: "Ajouter une culture",
    collection: "crops",
    fields: [
      ["name", "Nom de la culture", "text"],
      ["active", "Culture active", "checkbox"],
      ["family", "Famille", "text"],
      ["cycle", "Cycle de production", "text"],
      ["water", "Besoin en eau", "text"],
      ["spacing", "Espacement", "text"],
      ["notes", "Notes techniques", "textarea"]
    ]
  },
  task: {
    title: "Ajouter une tâche",
    collection: "tasks",
    fields: [
      ["title", "Travail", "text"],
      ["field", "Parcelle", "fieldSelect"],
      ["owner", "Responsable", "staffSelect"],
      ["due", "Échéance", "date"],
      ["status", "Statut", "select", ["À faire", "En cours", "Terminé", "En retard"]],
      ["note", "Consigne", "textarea"]
    ]
  },
  baseTask: {
    title: "Ajouter une tâche de base",
    collection: "dailyTaskTemplates",
    fields: [
      ["title", "Travail de base", "text"],
      ["crops", "Cultures concernées", "cropCheckboxes"],
      ["modes", "Mode concerné", "modeCheckboxes"],
      ["note", "Consignes", "textarea"]
    ]
  },
  harvest: {
    title: "Ajouter une récolte",
    collection: "harvests",
    fields: [
      ["date", "Date", "date"],
      ["field", "Parcelle", "fieldSelect"],
      ["crop", "Culture", "cropSelect"],
      ["quantity", "Quantité", "number"],
      ["unit", "Unité", "select", ["kg", "cageots", "pièces", "tonnes"]],
      ["quality", "Qualité", "select", ["Très bonne", "Bonne", "À trier", "Déclassée"]],
      ["destination", "Destination", "text"]
    ]
  },
  stock: {
    title: "Ajouter un stock",
    collection: "stock",
    fields: [
      ["item", "Article", "text"],
      ["category", "Catégorie", "text"],
      ["quantity", "Quantité", "number"],
      ["unit", "Unité", "text"],
      ["threshold", "Seuil d'alerte", "number"]
    ]
  },
  finance: {
    title: "Ajouter une opération",
    collection: "finance",
    fields: [
      ["date", "Date", "date"],
      ["label", "Libellé", "text"],
      ["crop", "Culture", "cropSelectOptional"],
      ["assignedTo", "Utilisateur assigné", "financeAssigneeSelect"],
      ["type", "Type", "financeTypeSelect", ["Recette", "Dépense", "Avance utilisateur", "Retour caisse"]],
      ["status", "Statut", "financeStatusSelect", ["Brouillon", "Soumis", "Validé", "Rejeté"]],
      ["isSale", "C'est une vente", "checkbox"],
      ["amount", "Montant FCFA", "number"],
      ["saleQuantity", "Quantité vendue", "number"],
      ["salePrice", "Prix de vente unitaire", "number"],
      ["saleUnit", "Unité vendue", "select", ["kg", "cageots", "pièces", "tonnes"]],
      ["saleKgEquivalent", "Équivalent total en kg", "number"]
    ]
  },
  team: {
    title: "Ajouter une personne",
    collection: "team",
    fields: [
      ["name", "Nom complet", "text"],
      ["role", "Rôle", "text"],
      ["phone", "Téléphone", "tel"],
      ["profileId", "Profil d'accès", "profileSelect"],
      ["login", "Identifiant", "text"],
      ["password", "Mot de passe", "password"]
    ]
  }
};

function loadState() {
  const stored = localStorage.getItem(stateKey);
  if (!stored) return createInitialState();
  let parsed = {};
  try {
    parsed = repairTextEncoding(JSON.parse(stored));
  } catch (error) {
    localStorage.removeItem(stateKey);
    return createInitialState();
  }
  const parsedDeletedRecords = deletedRecordsFromRows(parsed);
  parsed = withoutStarterExamples(parsed);
  const sourceTeam = withoutRetiredDemoUsers(parsed.team || starterState.team);
  const sourceAccounts = withoutRetiredDemoAccounts(parsed.userAccounts || userAccountsFromTeam(sourceTeam));
  const localTeam = teamWithUserAccounts(sourceTeam, sourceAccounts);
  const localAccounts = mergeUserAccounts(sourceAccounts, localTeam);
  return {
    ...parsed,
    profiles: mergeDefaultProfiles(parsed.profiles),
    fields: arrayOrEmpty(parsed.fields),
    tasks: arrayOrEmpty(parsed.tasks),
    harvests: arrayOrEmpty(parsed.harvests),
    crops: arrayOrEmpty(parsed.crops),
    stock: arrayOrEmpty(parsed.stock),
    finance: arrayOrEmpty(parsed.finance),
    team: ensureAdminAccess(mergeDefaultTeam(localTeam)),
    userAccounts: localAccounts,
    dailyTaskTemplates: normalizeDailyTaskTemplates(parsed.dailyTaskTemplates || dailyTaskTemplates),
    deletedRecords: mergeDeletedRecords(parsed.deletedRecords, parsedDeletedRecords),
    updatedAt: parsed.updatedAt || new Date().toISOString()
  };
}

function createInitialState() {
  return normalizeLoadedState({
    profiles: starterState.profiles,
    fields: [],
    tasks: [],
    harvests: [],
    crops: starterState.crops,
    stock: [],
    finance: [],
    team: starterState.team,
    userAccounts: userAccountsFromTeam(starterState.team),
    dailyTaskTemplates,
    deletedRecords: {},
    updatedAt: new Date().toISOString()
  });
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function collectionObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeDeletedRecords(value = {}) {
  const normalized = {};
  syncedCollections().forEach((collection) => {
    normalized[collection] = collectionObject(value[collection]);
  });
  return normalized;
}

function deletedRecordsFromRows(data = {}) {
  const deleted = normalizeDeletedRecords(data.deletedRecords);
  syncedCollections().forEach((collection) => {
    arrayOrEmpty(data[collection]).forEach((row) => {
      if (row.deletedAt) deleted[collection][row.id] = row.deletedAt;
    });
  });
  return deleted;
}

function mergeDeletedRecords(localDeleted = {}, remoteDeleted = {}) {
  const merged = normalizeDeletedRecords(localDeleted);
  const remote = normalizeDeletedRecords(remoteDeleted);
  syncedCollections().forEach((collection) => {
    Object.entries(remote[collection]).forEach(([id, deletedAt]) => {
      const localTime = new Date(merged[collection][id] || 0).getTime();
      const remoteTime = new Date(deletedAt || 0).getTime();
      if (!merged[collection][id] || remoteTime >= localTime) merged[collection][id] = deletedAt;
    });
  });
  return merged;
}

function recordTime(record = {}) {
  const time = new Date(record.updatedAt || record.updated_at || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function touchRecord(record, timestamp = new Date().toISOString()) {
  return { ...record, updatedAt: timestamp, updatedBy: currentUserLabel() };
}

function currentUserLabel() {
  if (!state || !Array.isArray(state.team)) return "Système";
  const user = currentUser && currentUser();
  if (!user) return "Système";
  return user.name || user.login || user.role || "Utilisateur";
}

function mergeRecords(localRows = [], remoteRows = [], deletedRows = {}) {
  const merged = new Map();
  const tombstones = { ...deletedRows };
  remoteRows.forEach((row) => {
    if (!row.deletedAt) return;
    const existingTime = new Date(tombstones[row.id] || 0).getTime();
    const remoteDeleteTime = new Date(row.deletedAt || 0).getTime();
    if (!tombstones[row.id] || remoteDeleteTime >= existingTime) tombstones[row.id] = row.deletedAt;
  });
  remoteRows.forEach((row) => {
    if (!tombstones[row.id]) merged.set(row.id, row);
  });
  localRows.forEach((row) => {
    if (tombstones[row.id]) return;
    const existing = merged.get(row.id);
    if (!existing || recordTime(row) >= recordTime(existing)) merged.set(row.id, row);
  });
  return Array.from(merged.values());
}

function rememberDeletion(collection, id) {
  state.deletedRecords = normalizeDeletedRecords(state.deletedRecords);
  state.deletedRecords[collection][id] = new Date().toISOString();
}

function collectionForSync(collection, sourceState = state) {
  if (collection === "team") return stripTeamCredentials(sourceState.team || []);
  if (collection === "userAccounts") return mergeUserAccounts(sourceState.userAccounts || [], sourceState.team || []).filter(keepAccount);
  return sourceState[collection] || [];
}

function matchesStarterExample(item, key) {
  if (key === "fields") return retiredStarterExamples.fields.has(`${item.name}|${item.crop}|${Number(item.area)}|${item.mode}`);
  if (key === "tasks") return retiredStarterExamples.tasks.has(`${item.title}|${item.field}|${item.owner}|${item.due}`);
  if (key === "harvests") return retiredStarterExamples.harvests.has(`${item.date}|${item.field}|${item.crop}|${Number(item.quantity)}`);
  if (key === "stock") return retiredStarterExamples.stock.has(`${item.item}|${item.category}|${Number(item.quantity)}`);
  if (key === "finance") return retiredStarterExamples.finance.has(`${item.date}|${item.label}|${item.crop}|${Number(item.amount)}`);
  return false;
}

function withoutStarterExamples(data = {}) {
  const clean = { ...data };
  ["fields", "tasks", "harvests", "stock", "finance"].forEach((key) => {
    clean[key] = arrayOrEmpty(clean[key]).filter((item) => !item.deletedAt && !matchesStarterExample(item, key));
  });
  ["profiles", "crops", "dailyTaskTemplates", "team", "userAccounts"].forEach((key) => {
    clean[key] = arrayOrEmpty(clean[key]).filter((item) => !item.deletedAt);
  });
  return clean;
}

function saveState(options = {}) {
  const shouldTouch = options.touch !== false;
  const shouldSync = options.sync !== false;
  if (shouldTouch) state.updatedAt = new Date().toISOString();
  state.deletedRecords = normalizeDeletedRecords(state.deletedRecords);
  state.userAccounts = mergeUserAccounts(state.userAccounts, state.team);
  localStorage.setItem(stateKey, JSON.stringify(state));
  if (shouldSync) scheduleRemoteSave();
}

function mergeDefaultProfiles(profiles = []) {
  const existing = profiles.length ? profiles : [];
  const missingDefaults = starterState.profiles.filter((profile) =>
    !existing.some((item) => item.id === profile.id || item.role === profile.role)
  );
  return [...existing, ...missingDefaults];
}
function mergeDefaultTeam(team = []) {
  const existing = team.length ? team : [];
  const missingDefaults = starterState.team.filter((person) =>
    !existing.some((item) => item.id === person.id || item.login === person.login)
  );
  return [...existing, ...missingDefaults];
}

function withoutRetiredDemoUsers(team = []) {
  return team.filter((person) => {
    const login = String(person.login || "").trim().toLowerCase();
    const name = String(person.name || "").trim().toLowerCase();
    return !retiredDemoUserLogins.has(login) && !retiredDemoUserNames.has(name);
  });
}

function withoutRetiredDemoAccounts(accounts = []) {
  return accounts.filter((account) => !retiredDemoUserLogins.has(String(account.login || "").trim().toLowerCase()));
}

function ensureAdminAccess(team = state.team) {
  const defaultAdmin = starterState.team.find((person) => person.id === "admin-user");
  const existingAdmin = team.find((person) => person.id === "admin-user" || person.login === "admin");
  const withoutDuplicateAdmin = team.filter((person) => person.id !== "admin-user" && person.login !== "admin");
  return [{ ...defaultAdmin, ...existingAdmin, id: "admin-user", login: "admin", profileId: "admin-profile" }, ...withoutDuplicateAdmin];
}

function userAccountsFromTeam(team = []) {
  return ensureAdminAccess(team).map((person) => ({
    id: person.id,
    teamId: person.id,
    login: person.login || "",
    password: person.password || "",
    profileId: person.profileId || "terrain-profile",
    updatedAt: person.updatedAt || new Date().toISOString(),
    updatedBy: person.updatedBy || currentUserLabel()
  }));
}

function keepAccount(account) {
  return account && (account.id === "admin-user" || account.login || account.password);
}

function mergeUserAccounts(existingAccounts = [], team = []) {
  const accountsById = new Map(arrayOrEmpty(existingAccounts).filter(keepAccount).map((account) => [account.teamId || account.id, account]));
  ensureAdminAccess(team).forEach((person) => {
    const existing = accountsById.get(person.id) || {};
    const login = existing.login || person.login || "";
    const password = existing.password || person.password || "";
    accountsById.set(person.id, {
      ...existing,
      id: person.id,
      teamId: person.id,
      login,
      password,
      profileId: person.profileId || existing.profileId || "terrain-profile",
      updatedAt: person.updatedAt || existing.updatedAt || new Date().toISOString(),
      updatedBy: person.updatedBy || existing.updatedBy || currentUserLabel()
    });
  });
  return Array.from(accountsById.values()).filter(keepAccount);
}

function upsertUserAccountForTeamMember(memberId, data = {}) {
  if (!data.login && !data.password && memberId !== "admin-user") return;
  const timestamp = new Date().toISOString();
  const existing = arrayOrEmpty(state.userAccounts).find((account) => account.id === memberId || account.teamId === memberId) || {};
  const account = touchRecord({
    ...existing,
    id: memberId,
    teamId: memberId,
    login: data.login !== undefined ? data.login : existing.login || "",
    password: data.password !== undefined ? data.password : existing.password || "",
    profileId: data.profileId || existing.profileId || defaultTeamProfileId()
  }, timestamp);
  state.userAccounts = [account, ...arrayOrEmpty(state.userAccounts).filter((item) => item.id !== memberId)];
}

function stripTeamCredentials(team = []) {
  return team.map(({ login, password, ...person }) => person);
}

function teamWithUserAccounts(team = [], accounts = []) {
  const accountsByTeamId = new Map(accounts.filter(keepAccount).map((account) => [account.teamId || account.id, account]));
  return team.map((person) => {
    const account = accountsByTeamId.get(person.id);
    return account ? {
      ...person,
      login: account.login || "",
      password: account.password || "",
      profileId: account.profileId || person.profileId
    } : person;
  });
}

function accountForTeamMember(person = {}) {
  return arrayOrEmpty(state.userAccounts).find((account) =>
    keepAccount(account) && (account.id === person.id || account.teamId === person.id || account.login === person.login)
  ) || {};
}

function teamRecordWithAccount(person = {}) {
  const account = accountForTeamMember(person);
  return {
    ...person,
    login: person.login || account.login || "",
    password: person.password || account.password || "",
    profileId: person.profileId || account.profileId || defaultTeamProfileId()
  };
}

function hasUsableAccounts(accounts = []) {
  return accounts.some((account) => account.login && account.password);
}

function hasBusinessData(data = {}) {
  return ["fields", "tasks", "harvests", "stock", "finance"].some((key) => arrayOrEmpty(data[key]).length > 0)
    || arrayOrEmpty(data.crops).some((crop) => !starterState.crops.some((defaultCrop) => defaultCrop.name === crop.name))
    || arrayOrEmpty(data.team).some((person) => person.id !== "admin-user");
}

function normalizeDailyTaskTemplates(templates = []) {
  return templates.map((template) => ({
    id: template.id || createId(),
    title: template.title || "Tâche de base",
    active: template.active === true,
    crops: Array.isArray(template.crops) ? template.crops : [],
    modes: Array.isArray(template.modes) ? template.modes : [],
    note: template.note || "",
    updatedAt: template.updatedAt,
    updatedBy: template.updatedBy,
    deletedAt: template.deletedAt,
    deletedBy: template.deletedBy
  }));
}

function supabaseEnabled() {
  return Boolean(supabaseConfig.url && supabaseConfig.key && supabaseConfig.metaTable && supabaseConfig.tables);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabaseConfig.key,
    Authorization: `Bearer ${supabaseConfig.key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("Délai Supabase dépassé. Vérifiez la connexion puis relancez la synchronisation.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function remoteTableUrl(table) {
  return `${supabaseConfig.url}/rest/v1/${table}`;
}

function syncedCollections() {
  return Object.keys(supabaseConfig.tables);
}

const remoteColumnMap = {
  profiles: {
    name: "name",
    role: "role",
    pages: "pages",
    sections: "sections",
    note: "note"
  },
  fields: {
    name: "name",
    crop: "crop",
    active: "active",
    area: "area",
    stage: "stage",
    health: "health",
    mode: "mode",
    update: "field_update"
  },
  tasks: {
    title: "title",
    baseTaskId: "base_task_id",
    field: "field",
    owner: "owner",
    due: "due",
    status: "status",
    note: "note"
  },
  dailyTaskTemplates: {
    title: "title",
    active: "active",
    crops: "crops",
    modes: "modes",
    note: "note"
  },
  harvests: {
    date: "date",
    field: "field",
    crop: "crop",
    quantity: "quantity",
    unit: "unit",
    quality: "quality",
    destination: "destination"
  },
  crops: {
    name: "name",
    active: "active",
    family: "family",
    cycle: "cycle",
    water: "water",
    spacing: "spacing",
    notes: "notes"
  },
  stock: {
    item: "item",
    category: "category",
    quantity: "quantity",
    unit: "unit",
    threshold: "threshold"
  },
  finance: {
    date: "date",
    label: "label",
    crop: "crop",
    assignedTo: "assigned_to",
    type: "type",
    status: "status",
    amount: "amount",
    isSale: "is_sale",
    saleQuantity: "sale_quantity",
    salePrice: "sale_price",
    saleUnit: "sale_unit",
    saleKgEquivalent: "sale_kg_equivalent"
  },
  team: {
    name: "name",
    role: "role",
    phone: "phone",
    profileId: "profile_id"
  },
  userAccounts: {
    teamId: "team_id",
    login: "login",
    password: "password",
    profileId: "profile_id"
  }
};

const remoteNumericFields = new Set([
  "area",
  "health",
  "quantity",
  "threshold",
  "amount",
  "saleQuantity",
  "salePrice",
  "saleKgEquivalent"
]);
const remoteDateFields = new Set(["date", "due"]);
const remoteJsonFields = new Set(["pages", "sections", "crops", "modes"]);
const remoteBooleanFields = new Set(["active"]);

function remoteRowToRecord(collection, row) {
  if (row.data && typeof row.data === "object") {
    return repairTextEncoding({ id: row.id, updatedAt: row.updated_at || row.data.updatedAt || "", updatedBy: row.updated_by || row.data.updatedBy || "", deletedAt: row.deleted_at || row.data.deletedAt || "", deletedBy: row.deleted_by || row.data.deletedBy || "", ...row.data });
  }
  const columnMap = remoteColumnMap[collection] || {};
  const record = { id: row.id };
  Object.entries(columnMap).forEach(([appKey, columnKey]) => {
    if (Object.prototype.hasOwnProperty.call(row, columnKey)) {
      record[appKey] = row[columnKey];
    }
  });
  record.updatedAt = row.updated_at || "";
  record.updatedBy = row.updated_by || "";
  record.deletedAt = row.deleted_at || "";
  record.deletedBy = row.deleted_by || "";
  if (collection === "finance") record.isSale = row.is_sale ? "on" : "";
  return repairTextEncoding(record);
}

function normalizeRemoteValue(collection, appKey, value) {
  if (collection === "finance" && appKey === "isSale") return Boolean(value);
  if (remoteBooleanFields.has(appKey)) return Boolean(value);
  if (value === undefined || value === "") return null;
  if (remoteNumericFields.has(appKey)) return Number(value);
  if (remoteDateFields.has(appKey)) return value || null;
  if (remoteJsonFields.has(appKey)) return Array.isArray(value) ? value : null;
  return value;
}

function recordToRemoteRow(collection, item) {
  const columnMap = remoteColumnMap[collection] || {};
  const row = {
    id: item.id,
    updated_at: item.updatedAt || state.updatedAt || new Date().toISOString(),
    updated_by: item.updatedBy || currentUserLabel()
  };
  Object.entries(columnMap).forEach(([appKey, columnKey]) => {
    row[columnKey] = normalizeRemoteValue(collection, appKey, item[appKey]);
  });
  if (item.deletedAt) {
    row.deleted_at = item.deletedAt;
    row.deleted_by = item.deletedBy || item.updatedBy || currentUserLabel();
  }
  return row;
}

function recordToDeletedRemoteRow(id, deletedAt) {
  return {
    id,
    updated_at: deletedAt,
    updated_by: currentUserLabel(),
    deleted_at: deletedAt,
    deleted_by: currentUserLabel()
  };
}

function recordToJsonRemoteRow(item) {
  return {
    id: item.id,
    data: item,
    updated_at: item.updatedAt || state.updatedAt || new Date().toISOString()
  };
}

async function responseErrorText(response) {
  const body = await response.text().catch(() => "");
  if (!body) return `${response.status}`;
  return `${response.status} ${body}`;
}

function normalizeLoadedState(data) {
  data = repairTextEncoding(data || {});
  const deletedRecords = deletedRecordsFromRows(data);
  data = withoutStarterExamples(data);
  const sourceTeam = withoutRetiredDemoUsers(data.team || starterState.team);
  const sourceAccounts = withoutRetiredDemoAccounts(data.userAccounts || userAccountsFromTeam(sourceTeam));
  const remoteTeam = teamWithUserAccounts(sourceTeam, sourceAccounts);
  const mergedAccounts = mergeUserAccounts(sourceAccounts, remoteTeam);
  return {
    ...data,
    profiles: mergeDefaultProfiles(data.profiles),
    fields: arrayOrEmpty(data.fields),
    tasks: arrayOrEmpty(data.tasks),
    harvests: arrayOrEmpty(data.harvests),
    crops: arrayOrEmpty(data.crops),
    stock: arrayOrEmpty(data.stock),
    finance: arrayOrEmpty(data.finance),
    team: ensureAdminAccess(mergeDefaultTeam(remoteTeam)),
    userAccounts: mergedAccounts,
    dailyTaskTemplates: normalizeDailyTaskTemplates(data.dailyTaskTemplates || dailyTaskTemplates),
    deletedRecords,
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

function mergeRemoteState(remoteData = {}) {
  const remoteState = normalizeLoadedState(remoteData);
  state.deletedRecords = mergeDeletedRecords(state.deletedRecords, remoteState.deletedRecords);
  syncedCollections().forEach((collection) => {
    if (collection === "team" || collection === "userAccounts") return;
    state[collection] = mergeRecords(
      collectionForSync(collection, state),
      collectionForSync(collection, remoteState),
      collectionObject(state.deletedRecords[collection])
    );
  });
  const mergedAccounts = mergeRecords(
    mergeUserAccounts(state.userAccounts || [], state.team || []),
    mergeUserAccounts(remoteState.userAccounts || [], remoteState.team || []),
    collectionObject(state.deletedRecords.userAccounts)
  );
  const mergedTeam = mergeRecords(
    stripTeamCredentials(state.team || []),
    stripTeamCredentials(remoteState.team || []),
    collectionObject(state.deletedRecords.team)
  );
  state.team = ensureAdminAccess(teamWithUserAccounts(mergedTeam, mergedAccounts));
  state.userAccounts = mergeUserAccounts(mergedAccounts, state.team);
  const localTime = new Date(state.updatedAt || 0).getTime();
  const remoteTime = new Date(remoteState.updatedAt || 0).getTime();
  state.updatedAt = new Date(Math.max(localTime || 0, remoteTime || 0, Date.now())).toISOString();
}

function setSyncStatus(status, detail) {
  syncState = { status, detail };
  renderConnection();
}

async function fetchRemoteMeta() {
  const response = await supabaseRequest(`${remoteTableUrl(supabaseConfig.metaTable)}?id=eq.${encodeURIComponent(supabaseConfig.rowId)}&select=updated_at&limit=1`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Lecture Supabase impossible (${response.status})`);
  const rows = await response.json();
  return rows[0] || null;
}

async function readRemoteRows(table) {
  const attempts = [
    `${remoteTableUrl(table)}?select=*&order=updated_at.asc`,
    `${remoteTableUrl(table)}?select=*`,
    `${remoteTableUrl(table)}?select=id,data,updated_at`
  ];
  let lastError = "";
  for (const url of attempts) {
    const response = await supabaseRequest(url, {
      headers: supabaseHeaders()
    });
    if (response.ok) return response.json();
    lastError = await response.text().catch(() => "");
  }
  throw new Error(`Lecture ${table} impossible. Vérifiez le SQL Supabase. ${lastError}`);
}

async function fetchRemoteCollection(collection, options = {}) {
  const table = supabaseConfig.tables[collection];
  const rows = await readRemoteRows(table);
  const records = rows.map((row) => remoteRowToRecord(collection, row));
  const visibleRecords = options.includeDeleted ? records : records.filter((row) => !row.deletedAt);
  return collection === "userAccounts" ? visibleRecords.filter(keepAccount) : visibleRecords;
}

async function fetchRemoteState() {
  const remoteMeta = await fetchRemoteMeta();
  if (!remoteMeta) return null;
  const remoteData = { updatedAt: remoteMeta.updated_at };
  const collections = await Promise.all(syncedCollections().map(async (collection) => [
    collection,
    await fetchRemoteCollection(collection, { includeDeleted: true }).catch(() => [])
  ]));
  collections.forEach(([collection, rows]) => {
    remoteData[collection] = rows;
  });
  return { data: remoteData, updated_at: remoteMeta.updated_at };
}

function isExpiredDeletion(row) {
  if (!row.deletedAt) return false;
  const deletedTime = new Date(row.deletedAt).getTime();
  return Number.isFinite(deletedTime) && deletedTime < Date.now() - deletionRetentionDays * 24 * 60 * 60 * 1000;
}

async function purgeExpiredDeletedRows(collection, rows) {
  const expiredRows = rows.filter(isExpiredDeletion);
  if (!expiredRows.length) return rows;
  const table = supabaseConfig.tables[collection];
  for (const row of expiredRows) {
    const response = await supabaseRequest(`${remoteTableUrl(table)}?id=eq.${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      headers: supabaseHeaders({ Prefer: "return=minimal" })
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Nettoyage définitif ${table} impossible (${await responseErrorText(response)})`);
    }
    if (state.deletedRecords && state.deletedRecords[collection]) delete state.deletedRecords[collection][row.id];
  }
  return rows.filter((row) => !isExpiredDeletion(row));
}

async function replaceRemoteCollection(collection) {
  const table = supabaseConfig.tables[collection];
  const source = collectionForSync(collection, state);
  const remoteRowsRaw = await readRemoteRows(table).catch(() => []);
  let remoteRows = remoteRowsRaw.map((row) => remoteRowToRecord(collection, row));
  remoteRows = await purgeExpiredDeletedRows(collection, remoteRows);
  const deletedRows = collectionObject((state.deletedRecords || {})[collection]);
  if (collection === "userAccounts") {
    remoteRows.filter((row) => !keepAccount(row)).forEach((row) => {
      deletedRows[row.id] = new Date().toISOString();
    });
    remoteRows = remoteRows.filter(keepAccount);
  }
  const appliedDeletedRows = { ...deletedRows };

  if (!source.length && !Object.keys(deletedRows).length) {
    if (remoteRows.length && collection !== "userAccounts") state[collection] = mergeRecords([], remoteRows, {});
    return;
  }

  for (const [id, deletedAt] of Object.entries(deletedRows)) {
    const tombstoneResponse = await supabaseRequest(`${remoteTableUrl(table)}?on_conflict=id`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify([recordToDeletedRemoteRow(id, deletedAt)])
    });
    if (!tombstoneResponse.ok) {
      const deleteResponse = await supabaseRequest(`${remoteTableUrl(table)}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: supabaseHeaders({ Prefer: "return=minimal" })
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error(`Suppression ${table} impossible (${await responseErrorText(tombstoneResponse)})`);
      }
    }
  }

  const remoteRowsAfterDeletes = remoteRows.filter((row) => !appliedDeletedRows[row.id]);
  const mergedSource = mergeRecords(source, remoteRowsAfterDeletes, appliedDeletedRows);
  if (collection !== "userAccounts") state[collection] = mergedSource;
  if (collection === "team") {
    state.team = ensureAdminAccess(teamWithUserAccounts(mergedSource, userAccountsFromTeam(state.team || [])));
  }
  state.deletedRecords = normalizeDeletedRecords(state.deletedRecords);

  if (mergedSource.length) {
    const rows = mergedSource.map((item) => recordToRemoteRow(collection, item));
    const upsertResponse = await supabaseRequest(`${remoteTableUrl(table)}?on_conflict=id`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows)
    });
    if (!upsertResponse.ok) {
      const columnError = await responseErrorText(upsertResponse);
      throw new Error(`Sauvegarde ${table} impossible. Vérifiez les colonnes Supabase : ${columnError}`);
    }
  }
}

async function saveRemoteMeta() {
  const payload = {
    id: supabaseConfig.rowId,
    updated_at: state.updatedAt || new Date().toISOString()
  };
  const response = await supabaseRequest(remoteTableUrl(supabaseConfig.metaTable), {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Sauvegarde suivi Supabase impossible (${response.status})`);
}

async function pushRemoteState() {
  if (!supabaseEnabled() || !navigator.onLine) return;
  if (remoteWriteInProgress) return;
  remoteWriteInProgress = true;
  try {
    setSyncStatus("syncing", "Synchronisation Supabase...");
    for (const collection of syncedCollections()) {
      await replaceRemoteCollection(collection);
    }
    await saveRemoteMeta();
    saveState({ sync: false, touch: false });
    markRemoteSynced();
  } finally {
    remoteWriteInProgress = false;
  }
}

function scheduleRemoteSave() {
  if (!supabaseEnabled() || !navigator.onLine) {
    setSyncStatus("offline", "Sauvegardé sur cet appareil, synchro dès le retour Internet");
    return;
  }
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    if (syncInProgress || remoteWriteInProgress) {
      scheduleRemoteSave();
      return;
    }
    pushRemoteState().catch((error) => setSyncStatus("error", error.message));
  }, 700);
}

function startAutoSync() {
  window.clearInterval(autoSyncTimer);
  autoSyncTimer = window.setInterval(() => {
    if (currentUser() && navigator.onLine) syncFromSupabase();
  }, 60000);
}

function stopAutoSync() {
  window.clearInterval(autoSyncTimer);
  autoSyncTimer = null;
}

async function syncFromSupabase() {
  if (!supabaseEnabled()) return;
  if (syncInProgress) return;
  if (!navigator.onLine) {
    setSyncStatus("offline", "Hors ligne : données conservées sur cet appareil");
    return;
  }
  syncInProgress = true;
  setSyncStatus("syncing", "Lecture Supabase...");
  try {
    const localUpdatedAt = state.updatedAt;
    const localHasPendingDeletes = syncedCollections().some((collection) =>
      Object.keys(collectionObject((state.deletedRecords || {})[collection])).length
    );
    const remoteRow = await fetchRemoteState();
    if (!remoteRow || !remoteRow.data) {
      await pushRemoteState();
      return;
    }
    const remoteData = remoteRow.data;
    const localTime = new Date(localUpdatedAt || 0).getTime();
    const remoteTime = new Date(remoteData.updatedAt || remoteRow.updated_at || 0).getTime();
    const shouldPushAfterMerge = (Number.isFinite(localTime) && Number.isFinite(remoteTime) && localTime > remoteTime) || localHasPendingDeletes;
    const localAccounts = userAccountsFromTeam(state.team || []);
    if (!hasUsableAccounts(remoteData.userAccounts) && hasUsableAccounts(localAccounts)) {
      state.userAccounts = localAccounts;
      await pushRemoteState();
      return;
    }
    mergeRemoteState(remoteData);
    saveState({ sync: false, touch: false });
    if (shouldPushAfterMerge) {
      await pushRemoteState();
    } else {
      markRemoteSynced();
    }
    render();
  } catch (error) {
    setSyncStatus("error", error.message);
  } finally {
    syncInProgress = false;
  }
}

function markRemoteSynced() {
  const label = new Date().toLocaleString("fr-SN", { dateStyle: "short", timeStyle: "short" });
  localStorage.setItem(lastRemoteSyncKey, label);
  setSyncStatus("synced", `Synchronisé Supabase : ${label}`);
}

function money(value) {
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

function init() {
  state = loadState();
  localStorage.removeItem(authUserKey);
  activeUserId = sessionStorage.getItem(authUserKey) || "";
  bindEvents();
  registerServiceWorker();
  if (currentUser()) {
    showApp();
  } else {
    activeUserId = "";
    sessionStorage.removeItem(authUserKey);
    showLogin();
  }
}

function loadCachedWeather() {
  try {
    const cached = JSON.parse(localStorage.getItem(weatherCacheKey) || "null");
    return cached && Array.isArray(cached.days) ? cached : null;
  } catch (error) {
    return null;
  }
}

function loadCachedWeatherLocation() {
  try {
    const cached = JSON.parse(localStorage.getItem(weatherLocationCacheKey) || "null");
    if (cached && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude)) return cached;
  } catch (error) {
    return null;
  }
  return null;
}

function renderNav() {
  const nav = document.querySelector("#navList");
  nav.innerHTML = navItems.filter(([id]) => canAccessView(id)).map(([id, label, icon]) => `
    <button class="nav-button ${id === currentView ? "active" : ""}" data-target="${id}">
      ${navIcon(icon)}<span>${label}</span>
    </button>
  `).join("");
}

function navIcon(name) {
  const icons = {
    dashboard: '<path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-4H4v4Z" />',
    fields: '<path d="M4 5h16v14H4V5Z" /><path d="M4 10h16M10 5v14M15 5v14" />',
    crops: '<path d="M12 20V9" /><path d="M12 13c-4 0-6-2-7-6 4 0 6 2 7 6Z" /><path d="M12 11c4 0 6-2 7-6-4 0-6 2-7 6Z" />',
    tasks: '<path d="m5 12 4 4L19 6" /><path d="M5 20h14" />',
    harvests: '<path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /><path d="M9 12h6M10 16h4" />',
    stock: '<path d="M4 8 12 4l8 4-8 4-8-4Z" /><path d="M4 8v8l8 4 8-4V8" /><path d="M12 12v8" />',
    finance: '<path d="M7 7h10M7 12h10M7 17h6" /><path d="M16 15c0 2 3 2 3 0s-3-2-3-4 3-2 3 0" />',
    prices: '<path d="M4 18h16" /><path d="m6 15 4-4 3 3 5-7" /><path d="M16 7h2v2" />',
    profiles: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4 20a8 8 0 0 1 16 0" />',
    team: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M3 20a5 5 0 0 1 10 0" /><path d="M11 20a5 5 0 0 1 10 0" />'
  };
  return `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.dashboard}</svg>`;
}

function bindEvents() {
  document.body.addEventListener("click", (event) => {
    const targetButton = event.target.closest("[data-target]");
    const modalButton = event.target.closest("[data-modal]");
    const deleteButton = event.target.closest("[data-delete]");
    const editButton = event.target.closest("[data-edit]");
    const completeButton = event.target.closest("[data-complete]");
    const toggleFieldButton = event.target.closest("[data-toggle-field]");
    const toggleCropButton = event.target.closest("[data-toggle-crop]");
    const periodResetButton = event.target.closest("[data-period-reset]");
    const closeDialogButton = event.target.closest("[data-close-dialog]");
    const passwordToggleButton = event.target.closest("[data-toggle-password]");

    if (event.target.closest(".daily-task-actions")) event.preventDefault();
    if (closeDialogButton) closeDialog(closeDialogButton.dataset.closeDialog);
    if (passwordToggleButton) togglePasswordVisibility(passwordToggleButton);
    if (targetButton) switchView(targetButton.dataset.target);
    if (modalButton) openModal(modalButton.dataset.modal);
    if (editButton) openModal(editButton.dataset.type, editButton.dataset.edit);
    if (deleteButton) deleteRecord(deleteButton.dataset.collection, deleteButton.dataset.delete);
    if (completeButton) completeTask(completeButton.dataset.complete);
    if (toggleFieldButton) toggleField(toggleFieldButton.dataset.toggleField);
    if (toggleCropButton) toggleCrop(toggleCropButton.dataset.toggleCrop);
    if (periodResetButton) resetPeriodFilter(periodResetButton.dataset.periodReset);
  });
  document.body.addEventListener("change", (event) => {
    const baseTaskCheckbox = event.target.closest("[data-base-task-check]");
    const taskStatusCheckbox = event.target.closest("[data-task-status-check]");
    if (baseTaskCheckbox) toggleBaseTaskActive(baseTaskCheckbox.dataset.baseTaskCheck, baseTaskCheckbox.checked);
    if (taskStatusCheckbox) setTaskCompletion(taskStatusCheckbox.dataset.taskStatusCheck, taskStatusCheckbox.checked);
  });
  const handlePeriodInput = (event) => {
    const periodInput = event.target.closest("[data-period-key]");
    if (!periodInput) return;
    updatePeriodFilter(periodInput.dataset.periodKey, periodInput.dataset.periodBound, periodInput.value);
  };
  document.body.addEventListener("input", handlePeriodInput);
  document.body.addEventListener("change", handlePeriodInput);

  document.body.addEventListener("change", (event) => {
    const financeUserSelect = event.target.closest("#financeUserFilter");
    if (!financeUserSelect) return;
    activeFinanceUserFilter = financeUserSelect.value || "Tous";
    renderFinance();
    applySectionAccess();
  });
  document.querySelector("#loginForm").addEventListener("submit", handleLogin);
  window.agriPilotLoginReady = true;
  const quickTaskButton = document.querySelector("#quickTaskBtn");
  if (quickTaskButton) quickTaskButton.addEventListener("click", () => openModal("task"));
  document.querySelector("#logoutBtn").addEventListener("click", logout);
  document.querySelector("#recordForm").addEventListener("submit", handleFormSubmit);
  document.querySelector("#changePasswordBtn").addEventListener("click", openPasswordModal);
  document.querySelector("#passwordForm").addEventListener("submit", handlePasswordSubmit);
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    const closeHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeDialog(button.dataset.closeDialog);
    };
    button.addEventListener("click", closeHandler);
    button.addEventListener("touchend", closeHandler);
  });
  ["recordModal", "passwordModal"].forEach((dialogId) => {
    const dialog = document.querySelector(`#${dialogId}`);
    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialogId);
      });
    }
  });
  const syncNowButton = document.querySelector("#syncNowBtn");
  if (syncNowButton) syncNowButton.addEventListener("click", syncFromSupabase);
  const mobileSyncNowButton = document.querySelector("#mobileSyncNowBtn");
  if (mobileSyncNowButton) mobileSyncNowButton.addEventListener("click", syncFromSupabase);
  window.addEventListener("online", () => {
    renderConnection();
    loadWeatherForecast({ force: true });
    syncFromSupabase();
  });
  window.addEventListener("offline", renderConnection);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUser()) syncFromSupabase();
  });
}

function closeDialog(dialogId) {
  const dialog = document.querySelector(`#${dialogId}`);
  if (dialog) {
    try {
      if (dialog.open && dialog.close) dialog.close();
    } catch (error) {
      dialog.removeAttribute("open");
    }
    if (dialog.open) dialog.removeAttribute("open");
    const form = dialog.querySelector("form");
    if (form) form.reset();
  }
  if (dialogId === "recordModal") editingRecord = null;
}


function currentUser() {
  return state.team.find((person) => person.id === activeUserId) || null;
}

function showLogin(message = "", type = "error") {
  document.body.classList.add("app-ready");
  document.body.classList.remove("authenticated");
  const loginMessage = document.querySelector("#loginMessage");
  if (loginMessage) {
    loginMessage.textContent = message;
    loginMessage.className = message ? `password-message ${type}` : "password-message";
  }
  const pageTitle = document.querySelector("#pageTitle");
  if (pageTitle) pageTitle.textContent = "Connexion";
}

function showStartupError(message) {
  const loginMessage = document.querySelector("#loginMessage");
  const startupBanner = document.querySelector("#startupBanner");
  if (startupBanner) {
    startupBanner.textContent = `Erreur de chargement : ${message}`;
    startupBanner.classList.add("startup-error");
  }
  if (!loginMessage) return;
  document.body.classList.remove("authenticated");
  loginMessage.textContent = `Erreur : ${message}`;
  loginMessage.className = "password-message error";
}

function showApp() {
  const user = currentUser();
  if (!user) {
    showLogin();
    return;
  }
  activeProfileId = user.profileId || "terrain-profile";
  localStorage.setItem(activeProfileKey, activeProfileId);
  document.body.classList.add("app-ready");
  document.body.classList.add("authenticated");
  try {
    ensureAllowedView();
    render();
    loadWeatherForecast();
    startAutoSync();
    syncFromSupabase();
  } catch (error) {
    document.body.classList.remove("authenticated");
    showStartupError(error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const login = form.elements.login.value.trim();
  const password = form.elements.password.value;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  showLogin("Connexion en cours...", "success");
  let user = state.team.find((person) => String(person.login || "").trim() === login && String(person.password || "") === password);
  if (!user) {
    user = await loginFromSupabaseAccounts(login, password);
  }
  if (!user) {
    showLogin("Identifiant ou mot de passe incorrect.");
    if (submitButton) submitButton.disabled = false;
    return;
  }
  activeUserId = user.id;
  sessionStorage.setItem(authUserKey, activeUserId);
  form.reset();
  if (submitButton) submitButton.disabled = false;
  showApp();
}

async function loginFromSupabaseAccounts(login, password) {
  if (!supabaseEnabled() || !navigator.onLine) return null;
  try {
    const accounts = await fetchRemoteCollection("userAccounts");
    const account = accounts.find((item) =>
      String(item.login || "").trim() === login && String(item.password || "") === password
    );
    if (!account) return null;
    const remoteRow = await fetchRemoteState().catch(() => null);
    if (remoteRow && remoteRow.data) {
      state = normalizeLoadedState(remoteRow.data);
    } else {
      const remoteTeam = await fetchRemoteCollection("team").catch(() => []);
      const remoteProfiles = await fetchRemoteCollection("profiles").catch(() => []);
      state = normalizeLoadedState({
        ...state,
        profiles: remoteProfiles.length ? remoteProfiles : state.profiles,
        team: remoteTeam.length ? remoteTeam : state.team,
        userAccounts: accounts,
        updatedAt: new Date().toISOString()
      });
    }
    saveState({ sync: false, touch: false });
    const personId = account.teamId || account.id;
    let person = state.team.find((item) => item.id === personId);
    if (!person) {
      person = touchRecord({
        id: personId,
        name: account.login || "Utilisateur",
        role: profileRole(account.profileId) || "Terrain",
        phone: "",
        profileId: account.profileId || "terrain-profile",
        login: account.login,
        password: account.password
      });
      state.team.unshift(person);
      state.userAccounts = mergeUserAccounts(state.userAccounts, state.team);
      saveState({ sync: false });
    }
    return person;
  } catch (error) {
    setSyncStatus("error", `Connexion Supabase impossible : ${error.message}`);
    return null;
  }
}

function logout() {
  activeUserId = "";
  stopAutoSync();
  sessionStorage.removeItem(authUserKey);
  localStorage.removeItem(authUserKey);
  showLogin();
}
function switchView(view) {
  if (!canAccessView(view)) return;
  currentView = view;
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  document.querySelector("#pageTitle").textContent = navItems.find(([id]) => id === view)[1];
  renderNav();
  render();
}

function render() {
  renderProfileSelect();
  ensureAllowedView();
  renderNav();
  renderConnection();
  renderDashboard();
  renderFields();
  renderCrops();
  renderTasks();
  renderHarvests();
  renderStock();
  renderFinance();
  renderPrices();
  renderProfiles();
  renderTeam();
  applySectionAccess();
}

function renderConnection() {
  const online = navigator.onLine;
  const controlled = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
  const statusDot = document.querySelector("#statusDot");
  const statusText = document.querySelector("#statusText");
  const statusDetail = document.querySelector("#statusDetail");
  const syncButton = document.querySelector("#syncNowBtn");
  const mobileSyncButton = document.querySelector("#mobileSyncNowBtn");
  if (!statusDot || !statusText || !statusDetail) return;
  if (!online) {
    statusDot.style.background = "var(--sun)";
    statusText.textContent = "Hors ligne";
    statusDetail.textContent = "Données locales, synchro au retour Internet";
  } else if (syncState.status === "syncing") {
    statusDot.style.background = "var(--sun)";
    statusText.textContent = "Synchronisation";
    statusDetail.textContent = syncState.detail;
  } else if (syncState.status === "error") {
    statusDot.style.background = "var(--danger)";
    statusText.textContent = "Supabase à vérifier";
    statusDetail.textContent = syncState.detail;
  } else if (supabaseEnabled()) {
    statusDot.style.background = "var(--leaf)";
    statusText.textContent = "Supabase connecté";
    statusDetail.textContent = syncState.detail || (controlled ? "Application disponible hors ligne" : "Données synchronisables");
  } else {
    statusDot.style.background = "var(--leaf)";
    statusText.textContent = "Mode local prêt";
    statusDetail.textContent = controlled ? "Application disponible hors ligne" : "Données conservées sur cet appareil";
  }
  [syncButton, mobileSyncButton].forEach((button) => {
    if (!button) return;
    button.disabled = !online || syncState.status === "syncing";
    button.textContent = syncState.status === "syncing" ? "Synchronisation..." : "Synchroniser";
  });
}

function renderWeather() {
  const weatherCard = document.querySelector("#weatherCard");
  const locationLabel = document.querySelector("#weatherLocationLabel");
  if (locationLabel) locationLabel.textContent = weatherForecast?.location || weatherLocation?.label || "Localisation requise";
  if (!weatherCard) return;
  if (!weatherForecast) {
    weatherCard.innerHTML = `
      <strong>Localisation requise</strong>
      <span>Autorisez la position pour afficher les prévisions de la semaine.</span>
    `;
    return;
  }
  const updatedAt = weatherForecast.updatedAt ? new Date(weatherForecast.updatedAt) : null;
  const current = weatherForecast.current || {};
  const days = weatherForecast.days || [];
  const currentTemp = Number.isFinite(current.temperature) ? `${Math.round(current.temperature)}°C` : "5 jours";
  const currentLine = [
    weatherLabel(current.weatherCode),
    Number.isFinite(current.windSpeed) ? `Vent ${Math.round(current.windSpeed)} km/h` : "",
    Number.isFinite(current.humidity) ? `Humidité ${Math.round(current.humidity)}%` : ""
  ].filter(Boolean).join(" · ");
  weatherCard.innerHTML = `
    <div class="weather-current">
      <div>
        <strong>${currentTemp}</strong>
        <span>${currentLine || "Prévision agricole sur 5 jours"}</span>
      </div>
      <span class="pill">${updatedAt ? `MAJ ${updatedAt.toLocaleTimeString("fr-SN", { hour: "2-digit", minute: "2-digit" })}` : "Prévision"}</span>
    </div>
    <div class="weather-week">
      ${days.map((day) => `
        <article class="weather-day">
          <strong>${formatWeatherDay(day.date)}</strong>
          <span>${weatherLabel(day.weatherCode)}</span>
          <div>${Math.round(day.min)}° / ${Math.round(day.max)}°C</div>
          <small>Pluie ${formatWeatherNumber(day.precipitation)} mm · Vent ${Math.round(day.wind)} km/h</small>
          <p>${irrigationAdvice(day)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadWeatherForecast(options = {}) {
  if (weatherInProgress || !navigator.onLine) {
    renderWeather();
    return;
  }
  weatherInProgress = true;
  try {
    weatherLocation = await resolveWeatherLocation();
    if (!weatherLocation) {
      weatherForecast = null;
      localStorage.removeItem(weatherCacheKey);
      return;
    }
    const cachedAge = weatherForecast && weatherForecast.updatedAt ? Date.now() - new Date(weatherForecast.updatedAt).getTime() : Infinity;
    const cacheMatchesLocation = weatherForecast && locationsClose(weatherForecast, weatherLocation);
    if (!options.force && cacheMatchesLocation && cachedAge < 2 * 60 * 60 * 1000) {
      renderWeather();
      return;
    }
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(weatherLocation.latitude),
      longitude: String(weatherLocation.longitude),
      timezone: "auto",
      forecast_days: "5",
      current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration"
    }).toString();
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Météo impossible (${response.status})`);
    weatherForecast = normalizeWeatherForecast(await response.json());
    localStorage.setItem(weatherCacheKey, JSON.stringify(weatherForecast));
  } catch (error) {
    weatherForecast = weatherLocation ? loadCachedWeather() : null;
  } finally {
    weatherInProgress = false;
    renderWeather();
  }
}

function locationsClose(forecast, location) {
  if (!forecast || !location) return false;
  return Math.abs(Number(forecast.latitude) - Number(location.latitude)) < 0.05
    && Math.abs(Number(forecast.longitude) - Number(location.longitude)) < 0.05;
}

function resolveWeatherLocation() {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const placeName = await fetchPlaceName(position.coords.latitude, position.coords.longitude);
        const location = {
          label: placeName || "Position actuelle",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        localStorage.setItem(weatherLocationCacheKey, JSON.stringify(location));
        resolve(location);
      },
      () => {
        weatherLocation = null;
        weatherForecast = null;
        localStorage.removeItem(weatherLocationCacheKey);
        localStorage.removeItem(weatherCacheKey);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 6 * 60 * 60 * 1000 }
    );
  });
}

async function fetchPlaceName(latitude, longitude) {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "fr"
    }).toString();
    const response = await fetch(url.toString());
    if (!response.ok) return "";
    const data = await response.json();
    return formatPlaceName(data);
  } catch (error) {
    return "";
  }
}

function formatPlaceName(data) {
  const locality = data.locality || data.city || "";
  const area = data.principalSubdivision || "";
  const country = data.countryName || "";
  return [locality, area, country].filter(Boolean).slice(0, 2).join(", ") || country;
}

function normalizeWeatherForecast(data) {
  const daily = data.daily || {};
  const current = data.current || {};
  const times = daily.time || [];
  return {
    updatedAt: new Date().toISOString(),
    location: weatherLocation.label,
    latitude: weatherLocation.latitude,
    longitude: weatherLocation.longitude,
    current: {
      temperature: Number(current.temperature_2m),
      humidity: Number(current.relative_humidity_2m),
      precipitation: Number(current.precipitation),
      weatherCode: Number(current.weather_code),
      windSpeed: Number(current.wind_speed_10m)
    },
    days: times.map((date, index) => ({
      date,
      weatherCode: Number(daily.weather_code?.[index]),
      max: Number(daily.temperature_2m_max?.[index]),
      min: Number(daily.temperature_2m_min?.[index]),
      precipitation: Number(daily.precipitation_sum?.[index] || 0),
      wind: Number(daily.wind_speed_10m_max?.[index] || 0),
      evapotranspiration: Number(daily.et0_fao_evapotranspiration?.[index] || 0)
    }))
  };
}

function weatherLabel(code) {
  if ([0, 1].includes(code)) return "Ensoleillé";
  if ([2, 3].includes(code)) return "Nuageux";
  if ([45, 48].includes(code)) return "Brume";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Pluie";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Variable";
}

function irrigationAdvice(day) {
  if (day.precipitation >= 10) return "Limiter l'arrosage et vérifier le drainage.";
  if (day.precipitation >= 3) return "Réduire l'arrosage selon l'humidité du sol.";
  if (day.max >= 34 || day.evapotranspiration >= 5) return "Arroser tôt le matin, surveiller les jeunes plants.";
  return "Arrosage normal, contrôler l'humidité au pied.";
}

function formatWeatherDay(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("fr-SN", { weekday: "short", day: "2-digit" });
}

function formatWeatherNumber(value) {
  return Number(value || 0).toLocaleString("fr-SN", { maximumFractionDigits: 1 });
}

function renderDashboard() {
  const dashboardCash = cashTotals(state.finance.filter(isFinanceValidated));
  const dashboardOpenAdvances = openAdvancesTotal(state.finance);
  const lateTasks = state.tasks.filter((task) => task.status === "En retard").length;
  const activeFields = state.fields.filter(isFieldActive);
  const area = activeFields.reduce((sum, field) => sum + Number(field.area), 0);
  const harvestWeight = state.harvests.filter((harvest) => harvest.unit === "kg").reduce((sum, harvest) => sum + Number(harvest.quantity), 0);
  const kpis = [
    ["Surface active", formatArea(area)],
    ["Travaux ouverts", state.tasks.filter((task) => task.status !== "Terminé").length],
    ["Récoltes kg", `${harvestWeight} kg`],
    canSeeFinance() ? ["Solde exploitation", money(dashboardCash.receipts - dashboardCash.expenses)] : ["Profil actif", currentProfile().role]
  ];
  document.querySelector("#kpiGrid").innerHTML = kpis.map(([label, value]) => `
    <article class="kpi"><span>${label}</span><strong>${value}</strong></article>
  `).join("");
  renderWeather();
  const openPriorityTasks = state.tasks.filter((task) => taskStatus(task) !== "Terminé").slice(0, 4);
  document.querySelector("#priorityTasks").innerHTML = openPriorityTasks.length ? openPriorityTasks.map(taskItem).join("") : `<p class="muted">Aucun travail ouvert.</p>`;
  document.querySelector("#fieldStrip").innerHTML = activeFields.slice(0, 3).map(fieldMini).join("");
  document.querySelector("#stockAlerts").innerHTML = lowStock().map((stock) => `
    <div class="stock-alert"><div><strong>${stock.item}</strong><span class="muted">${stock.quantity} ${stock.unit} restant</span></div><span class="status-pill late">Bas</span></div>
  `).join("") || `<p class="muted">Aucune alerte de stock.</p>`;
  document.querySelector("#cultureHarvests").innerHTML = harvestByActiveCrop().map((item) => `
    <div class="culture-row">
      <div>
        <strong>${item.crop}</strong>
        <span class="muted">${item.fields} parcelle${item.fields > 1 ? "s" : ""} active${item.fields > 1 ? "s" : ""}</span>
      </div>
      <strong>${item.total}</strong>
    </div>
  `).join("") || `<p class="muted">Aucune récolte enregistrée pour les cultures actives.</p>`;
  const showDashboardRevenue = canAccessSection("dashboard:revenues") && canSeeFinance();
  document.querySelector("#dashboardRevenuePanel").classList.toggle("access-hidden", !showDashboardRevenue);
  document.querySelector("#revenueDetailsBtn").hidden = !showDashboardRevenue;
  document.querySelector("#revenueCard").innerHTML = showDashboardRevenue
    ? `
      <strong>${money(dashboardCash.balance)}</strong>
      <span>Solde caisse validé</span>
      <div class="summary-line"><span>Solde d'exploitation</span><strong>${money(dashboardCash.receipts - dashboardCash.expenses)}</strong></div>
      <div class="summary-line"><span>Entrées caisse</span><strong>${money(dashboardCash.cashIn)}</strong></div>
      <div class="summary-line"><span>Dépenses validées</span><strong>${money(dashboardCash.expenses)}</strong></div>
      <div class="summary-line"><span>Dépenses payées caisse</span><strong>${money(dashboardCash.cashExpenses)}</strong></div>
      <div class="summary-line"><span>Avances données</span><strong>${money(dashboardCash.advances)}</strong></div>
      <div class="summary-line"><span>Sorties caisse</span><strong>${money(dashboardCash.cashOut)}</strong></div>
      <div class="summary-line"><span>Avances en cours</span><strong>${money(dashboardOpenAdvances)}</strong></div>
    `
    : `
      <strong>Masqué</strong>
      <span>Revenus visibles uniquement pour Admin et Comptable.</span>
    `;
}

function renderProfiles() {
  const grid = document.querySelector("#profilesGrid");
  if (!grid) return;
  grid.innerHTML = state.profiles.map((profile) => `
    <article class="record-card">
      <strong>${profile.name}</strong>
      <span class="muted">${profile.role}</span>
      <p class="field-update">${profile.note || accessDescription(profile.role)}</p>
      <div class="record-meta">
        <span class="pill">${accessDescription(profile.role)}</span>
        <span class="pill">${profilePages(profile).length} page(s)</span>
        <span class="pill">${profileSections(profile).length} sous-section(s)</span>
      </div>
      <div class="card-actions">
        <button data-edit="${profile.id}" data-type="profile">Modifier</button>
        ${profile.id === "admin-profile" ? "" : `<button data-delete="${profile.id}" data-collection="profiles">Supprimer</button>`}
      </div>
    </article>
  `).join("");
}

function renderFields() {
  document.querySelector("#fieldsGrid").innerHTML = state.fields.map((field) => `
    <article class="record-card">
      <strong>${field.name}</strong>
      <span class="muted">${field.crop} · ${formatArea(field.area)} · ${field.mode || "Plein champ"}</span>
      <div class="record-meta">
        <span class="${isFieldActive(field) ? "status-pill done" : "status-pill late"}">${isFieldActive(field) ? "Active" : "Inactive"}</span>
        <span class="pill">${field.stage}</span>
        <span class="pill">${field.mode || "Plein champ"}</span>
        <span class="pill">${field.health}% santé</span>
      </div>
      <div class="progress"><span style="width:${Math.min(field.health, 100)}%"></span></div>
      <p class="field-update">${field.update || "Aucune mise à jour enregistrée pour cette parcelle."}</p>
      <div class="field-harvests">
        <strong>${harvestSummaryForField(field.name, state.harvests)}</strong>
        <span class="muted">récolté sur cette parcelle</span>
      </div>
      <div class="card-actions">
        <button data-toggle-field="${field.id}">${isFieldActive(field) ? "Désactiver" : "Activer"}</button>
        <button data-edit="${field.id}" data-type="field">Modifier</button>
        <button data-delete="${field.id}" data-collection="fields">Supprimer</button>
      </div>
    </article>
  `).join("");
}

function renderCrops() {
  document.querySelector("#cropsGrid").innerHTML = state.crops.map((crop) => `
    <article class="record-card">
      <strong>${crop.name}</strong>
      <span class="muted">${crop.family || "Famille non renseignée"}</span>
      <div class="record-meta">
        <span class="${crop.active === false ? "status-pill late" : "status-pill done"}">${crop.active === false ? "Inactive" : "Active"}</span>
        <span class="pill">${crop.cycle || "Cycle à préciser"}</span>
        <span class="pill">${crop.spacing || "Espacement à préciser"}</span>
      </div>
      <div class="crop-details">
        <span><strong>Eau</strong>${crop.water || "À préciser"}</span>
        <span><strong>Notes</strong>${crop.notes || "Aucune note technique."}</span>
      </div>
      <div class="card-actions">
        <button data-toggle-crop="${crop.id}">${crop.active === false ? "Activer" : "Désactiver"}</button>
        <button data-edit="${crop.id}" data-type="crop">Modifier</button>
        <button data-delete="${crop.id}" data-collection="crops">Supprimer</button>
      </div>
    </article>
  `).join("");
}

function renderTasks() {
  refreshTaskStatuses();
  ensureActiveBaseTasksForToday();
  repairTaskInstructionsFromTemplates();
  renderDailyTaskBase();
  const filters = ["Tous", "À faire", "En cours", "En retard", "Terminé"];
  document.querySelector("#taskFilters").innerHTML = filters.map((filter) => `
    <button class="filter-button ${filter === activeTaskFilter ? "active" : ""}" data-filter="${filter}">${filter}</button>
  `).join("");
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTaskFilter = button.dataset.filter;
      renderTasks();
    });
  });
  const periodTasks = state.tasks.filter((task) => dateInPeriod(task.due, "tasks"));
  const filteredTasks = activeTaskFilter === "Tous" ? periodTasks : periodTasks.filter((task) => task.status === activeTaskFilter);
  const tasks = sortRows(filteredTasks, "tasks", {
    title: (task) => task.title,
    field: (task) => task.field,
    owner: (task) => task.owner,
    due: (task) => task.due,
    status: (task) => task.status
  });
  setupTableSort("tasks", "#tasksView thead", [null, "title", "field", "owner", "due", "status", null], renderTasks);
  document.querySelector("#tasksTable").innerHTML = tasks.map((task) => `
    <tr>
      <td>
        <label class="task-status-check task-status-check-compact" aria-label="Marquer la tâche comme terminée">
          <input type="checkbox" data-task-status-check="${task.id}" ${task.status === "Terminé" ? "checked" : ""} ${canAccessSection("tasks:write") ? "" : "disabled"} />
        </label>
      </td>
      <td><strong>${task.title}</strong>${taskInstruction(task) ? `<span class="task-note">${taskInstruction(task)}</span>` : ""}</td>
      <td>${task.field}</td>
      <td>${task.owner}</td>
      <td>${task.due}</td>
      <td><span class="${statusClass(task.status)}">${task.status}</span></td>
      <td><button class="text-button" data-edit="${task.id}" data-type="task">Modifier</button><button class="text-button" data-delete="${task.id}" data-collection="tasks">Supprimer</button></td>
    </tr>
  `).join("");
}

function renderDailyTaskBase() {
  const container = document.querySelector("#dailyTaskBase");
  if (!container) return;
  const templates = state.dailyTaskTemplates || [];
  container.innerHTML = templates.map((template) => `
    <label class="daily-task-check">
      <input type="checkbox" data-base-task-check="${template.id}" aria-label="${escapeHtml(template.title)}" ${template.active === true ? "checked" : ""} />
      <span class="daily-task-body">
        <strong>${template.title}</strong>
        <span class="muted">${template.crops.length ? template.crops.join(" · ") : "Toutes les cultures"}${template.modes && template.modes.length ? ` · ${template.modes.join(" · ")}` : " · Tous modes"}</span>
        <small>${template.active === true ? "Active : une tâche À faire est générée chaque jour." : "Inactive : aucune génération automatique."}</small>
        ${template.note ? `<small>${template.note}</small>` : ""}
      </span>
      <span class="daily-task-actions">
        <button type="button" data-edit="${template.id}" data-type="baseTask">Modifier</button>
        <button type="button" data-delete="${template.id}" data-collection="dailyTaskTemplates">Supprimer</button>
      </span>
    </label>
  `).join("") || `<p class="muted">Aucune tâche de base enregistrée.</p>`;
}

function baseTaskGeneratedToday(template) {
  const today = currentDateValue();
  return state.tasks.some((task) => task.due === today && (task.baseTaskId === template.id || task.title === template.title));
}

function taskInstruction(task) {
  if (task.note) return task.note;
  const template = matchingBaseTaskTemplate(task);
  return template ? template.note || "" : "";
}

function matchingBaseTaskTemplate(task) {
  const taskTitle = String(task.title || "").trim().toLowerCase();
  return (state.dailyTaskTemplates || []).find((item) =>
    item.id === task.baseTaskId || String(item.title || "").trim().toLowerCase() === taskTitle
  );
}

function repairTaskInstructionsFromTemplates() {
  let changed = false;
  state.tasks = state.tasks.map((task) => {
    if (task.note && task.baseTaskId) return task;
    const template = matchingBaseTaskTemplate(task);
    if (!template || !template.note) return task;
    changed = true;
    return touchRecord({
      ...task,
      baseTaskId: task.baseTaskId || template.id,
      note: task.note || template.note
    });
  });
  if (changed) saveState();
}

function ensureActiveBaseTasksForToday() {
  const templates = state.dailyTaskTemplates || [];
  let created = false;
  templates.filter((template) => template.active === true).forEach((template) => {
    if (baseTaskGeneratedToday(template)) return;
    state.tasks.unshift(touchRecord({
      id: createId(),
      baseTaskId: template.id,
      title: template.title,
      field: template.crops && template.crops.length ? template.crops.join(", ") : "Toutes les cultures",
      owner: currentUserLabel(),
      due: currentDateValue(),
      status: "À faire",
      note: template.note || ""
    }));
    created = true;
  });
  if (created) {
    activeTaskFilter = "Tous";
    saveState();
  }
}

function toggleBaseTaskActive(templateId, active) {
  if (!canAccessSection("tasks:write")) return;
  let changed = false;
  state.dailyTaskTemplates = (state.dailyTaskTemplates || []).map((template) => {
    if (template.id !== templateId) return template;
    changed = template.active !== active;
    return touchRecord({ ...template, active });
  });
  if (!changed) {
    renderDailyTaskBase();
    return;
  }
  if (active) ensureActiveBaseTasksForToday();
  saveState();
  render();
}

function dateInPeriod(dateValue, key) {
  if (!dateValue) return true;
  const filter = periodFilters[key] || {};
  return (!filter.from || dateValue >= filter.from) && (!filter.to || dateValue <= filter.to);
}

function sortRows(rows, tableKey, accessors) {
  const sort = tableSorts[tableKey];
  if (!sort || !sort.key || !accessors[sort.key]) return rows;
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => compareValues(accessors[sort.key](a), accessors[sort.key](b)) * direction);
}

function compareValues(a, b) {
  const first = normalizeSortValue(a);
  const second = normalizeSortValue(b);
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first).localeCompare(String(second), "fr", { numeric: true, sensitivity: "base" });
}

function normalizeSortValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return value;
  const numeric = Number(value);
  if (value !== "" && Number.isFinite(numeric)) return numeric;
  const date = new Date(`${value}T00:00:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(date.getTime())) return date.getTime();
  return value;
}

function setupTableSort(tableKey, headerSelector, columns, renderFn) {
  const headers = document.querySelectorAll(`${headerSelector} th`);
  headers.forEach((header, index) => {
    const column = columns[index];
    if (!column) return;
    const active = tableSorts[tableKey] && tableSorts[tableKey].key === column;
    header.innerHTML = `<button class="sort-header" type="button">${header.textContent.replace(/[▲▼]/g, "").trim()}<span>${active ? tableSorts[tableKey].direction === "asc" ? "▲" : "▼" : ""}</span></button>`;
    header.querySelector("button").addEventListener("click", () => {
      const current = tableSorts[tableKey] || {};
      tableSorts[tableKey] = {
        key: column,
        direction: current.key === column && current.direction === "asc" ? "desc" : "asc"
      };
      renderFn();
    });
  });
}

function isFieldActive(field) {
  return !field || field.active !== false;
}

function activeFields() {
  return state.fields.filter(isFieldActive);
}

function formatArea(value) {
  const area = Number(value || 0);
  if (area > 0 && area < 0.1) return `${Math.round(area * 10000)} m² (${area.toFixed(2).replace(".", ",")} ha)`;
  return `${area.toLocaleString("fr-FR", { minimumFractionDigits: area % 1 ? 2 : 0, maximumFractionDigits: 2 })} ha`;
}

function updatePeriodFilter(key, bound, value) {
  if (!periodFilters[key]) return;
  periodFilters[key][bound] = value;
  renderPeriodView(key);
}

function resetPeriodFilter(key) {
  if (!periodFilters[key]) return;
  periodFilters[key] = { from: "", to: "" };
  if (key === "finance") activeFinanceUserFilter = "Tous";
  document.querySelectorAll(`[data-period-key="${key}"]`).forEach((input) => { input.value = ""; });
  renderPeriodView(key);
}

function renderPeriodView(key) {
  if (key === "tasks") renderTasks();
  if (key === "harvests") renderHarvests();
  if (key === "finance") renderFinance();
  if (key === "prices") renderPrices();
  applySectionAccess();
}

function currentDateValue() {
  const today = todayDateOnly();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function renderHarvests() {
  const harvestRecords = sortRows(state.harvests.filter((harvest) => dateInPeriod(harvest.date, "harvests")), "harvests", {
    date: (harvest) => harvest.date,
    field: (harvest) => harvest.field,
    crop: (harvest) => harvest.crop,
    quantity: (harvest) => Number(harvest.quantity),
    quality: (harvest) => harvest.quality,
    destination: (harvest) => harvest.destination
  });
  setupTableSort("harvests", "#harvestsView thead", ["date", "field", "crop", "quantity", "quality", "destination", null], renderHarvests);
  document.querySelector("#harvestSummary").innerHTML = activeFields().map((field) => `
    <div class="summary-line">
      <span>${field.name}</span>
      <strong>${harvestSummaryForField(field.name, harvestRecords)}</strong>
    </div>
  `).join("");
  document.querySelector("#harvestsTable").innerHTML = harvestRecords.map((harvest) => `
    <tr>
      <td>${harvest.date}</td>
      <td>${harvest.field}</td>
      <td>${harvest.crop}</td>
      <td><strong>${harvest.quantity} ${harvest.unit}</strong></td>
      <td>${harvest.quality}</td>
      <td>${harvest.destination}</td>
      <td><button class="text-button" data-edit="${harvest.id}" data-type="harvest">Modifier</button><button class="text-button" data-delete="${harvest.id}" data-collection="harvests">Supprimer</button></td>
    </tr>
  `).join("");
}

function renderStock() {
  document.querySelector("#stockGrid").innerHTML = state.stock.map((stock) => `
    <article class="record-card">
      <strong>${stock.item}</strong>
      <span class="muted">${stock.category}</span>
      <div class="record-meta">
        <span class="pill">${stock.quantity} ${stock.unit}</span>
        <span class="${Number(stock.quantity) <= Number(stock.threshold) ? "status-pill late" : "status-pill done"}">Seuil ${stock.threshold}</span>
      </div>
      <div class="card-actions">
        <button data-edit="${stock.id}" data-type="stock">Modifier</button>
        <button data-delete="${stock.id}" data-collection="stock">Supprimer</button>
      </div>
    </article>
  `).join("");
}

function renderFinance() {
  renderFinanceUserFilter();
  const financeRecords = financeRecordsForCurrentFilter().filter((item) => dateInPeriod(item.date, "finance"));
  const sortedFinanceRecords = sortRows(financeRecords, "finance", {
    date: (item) => item.date,
    label: (item) => item.label,
    crop: (item) => item.crop || "Non affecté",
    user: (item) => financeRecordUserLabel(item),
    type: (item) => item.type,
    status: (item) => financeStatus(item),
    amount: (item) => Number(item.amount)
  });
  const validatedFinanceRecords = financeRecords.filter(isFinanceValidated);
  const totals = cashTotals(validatedFinanceRecords);
  const openAdvances = openAdvancesTotal(financeRecords);
  const personalFinanceView = !canSeeAllFinanceOperations() || activeFinanceUserFilter !== "Tous";
  const financeSummaryRows = personalFinanceView ? [
    [personalFinanceView ? "Mes recettes validées" : "Recettes validées", money(totals.receipts)],
    [personalFinanceView ? "Mes dépenses validées" : "Dépenses validées", money(totals.expenses)],
    ["Solde caisse", money(totals.balance)]
  ] : [
    ["Solde d'exploitation", money(totals.receipts - totals.expenses)],
    ["Entrées caisse", money(totals.cashIn)],
    ["Dépenses validées", money(totals.expenses)],
    ["Dépenses payées caisse", money(totals.cashExpenses)],
    ["Avances données", money(totals.advances)],
    ["Sorties caisse", money(totals.cashOut)],
    ["Solde caisse", money(totals.balance)],
    ["Avances en cours", money(openAdvances)]
  ];
  document.querySelector("#financeSummary").innerHTML = financeSummaryRows.map(([label, value]) => `<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
  renderCashSummary(financeRecords);
  updateFinancePersonalLayout(personalFinanceView);
  setupTableSort("finance", "#financeView .finance-transactions thead", ["date", "label", "crop", "user", "type", "status", "amount", null], renderFinance);
  document.querySelector("#financeTable").innerHTML = sortedFinanceRecords.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.label}</td>
      <td>${item.crop || "Non affecté"}</td>
      <td>${financeRecordUserLabel(item)}</td>
      <td>${item.type}</td>
      <td>${financeStatus(item)}</td>
      <td>${money(Number(item.amount))}</td>
      <td>${financeActionButtons(item)}</td>
    </tr>
  `).join("") || `<tr><td colspan="8">Aucune opération sur cette période.</td></tr>`;
  const financeByCropRows = sortRows(financeByCrop(validatedFinanceRecords), "financeByCrop", {
    crop: (item) => item.crop,
    revenue: (item) => item.revenue,
    expense: (item) => item.expense,
    balance: (item) => item.revenue - item.expense
  });
  setupTableSort("financeByCrop", "#financeView .finance-by-crop thead", ["crop", "revenue", "expense", "balance"], renderFinance);
  document.querySelector("#financeByCropTable").innerHTML = financeByCropRows.map((item) => `
    <tr>
      <td><strong>${item.crop}</strong></td>
      <td>${money(item.revenue)}</td>
      <td>${money(item.expense)}</td>
      <td><strong>${money(item.revenue - item.expense)}</strong></td>
    </tr>
  `).join("") || `<tr><td colspan="4">Aucune recette ou dépense validée par culture sur cette période.</td></tr>`;
}

function financeRecordsForCurrentAccess() {
  if (canSeeAllFinanceOperations()) return state.finance;
  return state.finance.filter(recordBelongsToCurrentUser);
}

function financeRecordsForCurrentFilter() {
  const records = financeRecordsForCurrentAccess();
  if (!canAccessSection("finance:userFilter") || activeFinanceUserFilter === "Tous") return records;
  return records.filter((record) => financeRecordUserLabel(record) === activeFinanceUserFilter);
}

function renderFinanceUserFilter() {
  const select = document.querySelector("#financeUserFilter");
  if (!select) return;
  const labels = ["Tous", ...new Set(financeRecordsForCurrentAccess().map(financeRecordUserLabel).filter(Boolean))];
  if (!labels.includes(activeFinanceUserFilter)) activeFinanceUserFilter = "Tous";
  select.innerHTML = labels.map((label) => optionTag(label, activeFinanceUserFilter)).join("");
  select.value = activeFinanceUserFilter;
}

function financeActionButtons(record) {
  return [
    canEditFinanceRecord(record) ? `<button class="text-button" data-edit="${record.id}" data-type="finance">Modifier</button>` : "",
    canDeleteFinanceRecord(record) ? `<button class="text-button" data-delete="${record.id}" data-collection="finance">Supprimer</button>` : ""
  ].join("") || `<span class="muted">Verrouillé</span>`;
}

function renderCashSummary(records) {
  const cashPanel = document.querySelector("#cashSummary");
  const userPanel = document.querySelector("#userCashBalances");
  if (!cashPanel || !userPanel) return;
  const validated = records.filter(isFinanceValidated);
  const pendingCount = records.filter((record) => !isFinanceFinal(record)).length;
  if (!canSeeAllFinanceOperations() || activeFinanceUserFilter !== "Tous") {
    renderUserCashSummary(cashPanel, userPanel, records, validated, pendingCount);
    return;
  }
  setPanelTitle("#financeCashPanel", "Caisse");
  setPanelTitle("#financeUserBalancePanel", "Soldes utilisateurs");
  const totals = cashTotals(validated);
  const openAdvances = openAdvancesTotal(records);
  cashPanel.innerHTML = [
    ["Solde caisse validé", money(totals.balance)],
    ["Entrées validées", money(totals.cashIn)],
    ["Dépenses validées", money(totals.expenses)],
    ["Dépenses payées caisse", money(totals.cashExpenses)],
    ["Avances données", money(totals.advances)],
    ["Sorties validées", money(totals.cashOut)],
    ["Avances en cours", money(openAdvances)],
    ["À valider", `${pendingCount} opération${pendingCount > 1 ? "s" : ""}`]
  ].map(([label, value]) => `<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
  const balances = userCashBalances(records);
  userPanel.innerHTML = balances.length ? balances.map((item) => `
    <div class="summary-line">
      <span>${item.user} - reste à justifier/rendre</span>
      <strong>${money(item.balance)}</strong>
    </div>
  `).join("") : `<p class="muted">Aucune avance utilisateur validée.</p>`;
}

function renderUserCashSummary(cashPanel, userPanel, records, validated, pendingCount) {
  setPanelTitle("#financeCashPanel", "Résumé");
  setPanelTitle("#financeUserBalancePanel", "Détail avances");
  const totals = cashTotals(validated);
  const accountability = userAccountabilityTotals(records);
  const pendingAmount = records.filter((record) => !isFinanceFinal(record)).reduce((sum, record) => sum + Number(record.amount || 0), 0);
  cashPanel.innerHTML = [
    ["Recettes validées", money(totals.receipts)],
    ["Recettes à reverser", money(accountability.pendingReceipts)],
    ["Avances reçues validées", money(totals.advances)],
    ["Dépenses validées", money(totals.expenses)],
    ["Retours caisse validés", money(totals.returns)],
    ["Solde à justifier / rendre", money(accountability.balance)],
    ["Opérations en attente", `${pendingCount} (${money(pendingAmount)})`]
  ].map(([label, value]) => `<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
  userPanel.innerHTML = [
    ["Recettes validées saisies", money(totals.receipts)],
    ["Avances moins dépenses", money(totals.advances - totals.expenses)],
    ["Solde après retours", money(accountability.balance)]
  ].map(([label, value]) => `<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function cashTotals(records = []) {
  const receipts = records.filter((record) => record.type === "Recette").reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = records.filter((record) => record.type === "Dépense").reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const cashExpenses = records
    .filter((record) => record.type === "Dépense" && (!financeRecordAssignee(record) || isAdminFinanceAssignee(record)))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const advances = records.filter((record) => record.type === "Avance utilisateur").reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const returns = records.filter((record) => record.type === "Retour caisse").reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const cashIn = receipts + returns;
  const cashOut = cashExpenses + advances;
  return {
    receipts,
    expenses,
    cashExpenses,
    advances,
    returns,
    cashIn,
    cashOut,
    balance: cashIn - cashOut,
    userBalance: advances - expenses - returns,
    openAdvances: Math.max(0, advances - expenses - returns)
  };
}

function openAdvancesTotal(records = []) {
  return userCashBalances(records).reduce((sum, row) => sum + Math.max(0, row.balance), 0);
}

function userAccountabilityTotals(records = []) {
  const validated = records.filter(isFinanceValidated);
  const totals = cashTotals(validated);
  const pendingReceipts = records
    .filter((record) => record.type === "Recette" && !isFinanceFinal(record))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return {
    ...totals,
    pendingReceipts,
    balance: totals.advances - totals.expenses - totals.returns + pendingReceipts
  };
}

function updateFinancePersonalLayout(personalFinanceView) {
  ["#financeMainSummaryPanel", "#financeUserBalancePanel", "#financeByCropPanel"].forEach((selector) => {
    const node = document.querySelector(selector);
    if (node) node.classList.toggle("personal-finance-hidden", personalFinanceView);
  });
}

function setPanelTitle(selector, title) {
  const heading = document.querySelector(`${selector} h2`);
  if (heading) heading.textContent = title;
}

function userCashBalances(records) {
  const balances = new Map();
  records.forEach((record) => {
    const user = financeRecordUserLabel(record);
    if (!user || user === "Non assigné") return;
    if (isAdminFinanceAssignee(record)) return;
    if (!balances.has(user)) balances.set(user, { user, records: [] });
    balances.get(user).records.push(record);
  });
  return Array.from(balances.values())
    .map((row) => {
      const totals = userAccountabilityTotals(row.records);
      return { ...row, ...totals };
    })
    .filter((row) => row.advances || row.expenses || row.returns || row.pendingReceipts)
    .sort((a, b) => b.balance - a.balance);
}

function financeStatus(record) {
  return record.status || "Validé";
}

function isFinanceValidated(record) {
  return financeStatus(record) === "Validé";
}

function isFinanceFinal(record) {
  return ["Validé", "Rejeté"].includes(financeStatus(record));
}

function financeRecordUserLabel(record) {
  const person = financeRecordAssigneePerson(record);
  if (person) return person.name || person.login || financeRecordAssignee(record);
  const assignedTo = financeRecordAssignee(record);
  if (!assignedTo) return "Non assigné";
  return person ? person.name || person.login || assignedTo : assignedTo;
}

function financeRecordAssignee(record) {
  if (Object.prototype.hasOwnProperty.call(record, "assignedTo")) return String(record.assignedTo || "").trim();
  return String(record.updatedBy || "").trim();
}

function financeRecordAssigneePerson(record) {
  const assignedTo = financeRecordAssignee(record);
  if (!assignedTo) return null;
  const normalized = assignedTo.toLowerCase();
  return state.team.find((member) => [member.name, member.login, member.role, member.id].some((value) => String(value || "").trim().toLowerCase() === normalized)) || null;
}

function isAdminTeamMember(person) {
  if (!person) return false;
  return person.profileId === "admin-profile" || profileRole(person.profileId) === "Admin" || String(person.role || "").trim() === "Admin";
}

function isAdminFinanceAssignee(record) {
  return isAdminTeamMember(financeRecordAssigneePerson(record));
}

function canSeeAllFinanceOperations() {
  const sections = profileSections(currentProfile());
  const hasAllScope = sections.includes("finance:allOperations");
  return currentProfile().role === "Admin" || hasAllScope;
}

function recordBelongsToCurrentUser(record) {
  const user = currentUser();
  if (!user) return false;
  const assignedTo = financeRecordAssignee(record).toLowerCase();
  const aliases = [currentUserLabel(), user.name, user.login, user.role, user.id]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  return aliases.includes(assignedTo);
}

function canAccessFinanceRecord(record) {
  return canSeeAllFinanceOperations() || recordBelongsToCurrentUser(record);
}

function canEditFinanceRecord(record) {
  if (!record) return canWriteModal("finance");
  if (currentProfile().role === "Admin") return canAccessSection("finance:write");
  if (!canAccessFinanceRecord(record) || !canAccessSection("finance:write")) return false;
  if (record.type === "Avance utilisateur") return false;
  return !isFinanceValidated(record);
}

function canDeleteFinanceRecord(record) {
  if (!record) return canDeleteCollection("finance");
  if (currentProfile().role === "Admin") return canAccessSection("finance:delete");
  if (!canAccessFinanceRecord(record) || !canAccessSection("finance:delete")) return false;
  if (record.type === "Avance utilisateur") return false;
  return !isFinanceValidated(record);
}

function renderPrices() {
  const priceView = document.querySelector("#pricesView");
  if (!priceView) return;
  const sales = salesWithPrice();
  const cropNames = ["Toutes", ...new Set(sales.map((sale) => sale.crop))];
  if (!cropNames.includes(activePriceCrop)) activePriceCrop = "Toutes";
  document.querySelector("#priceFilters").innerHTML = cropNames.map((crop) => `
    <button class="filter-button ${crop === activePriceCrop ? "active" : ""}" data-price-crop="${crop}">${crop}</button>
  `).join("");
  document.querySelectorAll("[data-price-crop]").forEach((button) => {
    button.addEventListener("click", () => {
      activePriceCrop = button.dataset.priceCrop;
      renderPrices();
    });
  });
  const datedSales = sales.filter((sale) => dateInPeriod(sale.date, "prices"));
  const unsortedSales = activePriceCrop === "Toutes" ? datedSales : datedSales.filter((sale) => sale.crop === activePriceCrop);
  const filteredSales = sortRows(unsortedSales, "prices", {
    date: (sale) => sale.date,
    crop: (sale) => sale.crop,
    amount: (sale) => Number(sale.amount),
    quantity: (sale) => Number(sale.saleQuantity),
    price: (sale) => Number(sale.pricePerKg)
  });
  document.querySelector("#priceSummary").innerHTML = priceSummary(filteredSales);
  document.querySelector("#priceChart").innerHTML = renderPriceChart(filteredSales);
  setupTableSort("prices", "#pricesView .finance-by-crop thead", ["date", "crop", "amount", "quantity", "price"], renderPrices);
  document.querySelector("#priceSalesTable").innerHTML = filteredSales.map((sale) => `
    <tr>
      <td>${sale.date}</td>
      <td>${sale.crop}</td>
      <td>${money(Number(sale.amount))}</td>
      <td>${sale.saleQuantity} ${sale.saleUnit}</td>
      <td><strong>${money(sale.pricePerKg)} / kg</strong></td>
    </tr>
  `).join("") || `<tr><td colspan="5">Aucune vente avec quantité renseignée.</td></tr>`;
}

function renderTeam() {
  const canEditTeam = canManageTeam();
  document.querySelector("#teamGrid").innerHTML = state.team.map((rawPerson) => {
    const person = teamRecordWithAccount(rawPerson);
    return `
    <article class="record-card">
      <strong>${person.name}</strong>
      <span class="muted">${person.role}</span>
      <div class="record-meta">
        <span class="pill">${person.phone}</span>
        ${canManageProfiles() ? `<span class="pill">${profileName(person.profileId)}</span>` : ""}
      </div>
      ${canManageProfiles() ? `<p class="field-update">Identifiant : ${person.login || "Non défini"}</p>` : ""}
      ${canEditTeam ? `<div class="card-actions">
        <button data-edit="${person.id}" data-type="team">Modifier</button>
        ${person.id === "admin-user" || person.id === activeUserId ? "" : `<button data-delete="${person.id}" data-collection="team">Supprimer</button>`}
      </div>` : ""}
    </article>
  `;
  }).join("");
}

function fieldMini(field) {
  return `
    <article class="mini-field">
      <strong>${field.name}</strong>
      <span class="muted">${field.crop} · ${field.stage} · ${field.mode || "Plein champ"}</span>
      <div class="progress"><span style="width:${Math.min(field.health, 100)}%"></span></div>
    </article>
  `;
}

function taskItem(task) {
  const status = taskStatus(task);
  return `
    <div class="task-item">
      <div><strong>${task.title}</strong><span class="muted">${task.field} · ${task.owner} · ${task.due}</span></div>
      <div>
        <span class="${statusClass(status)}">${status}</span>
        ${status !== "Terminé" ? `<button class="text-button" data-complete="${task.id}">OK</button>` : ""}
      </div>
    </div>
  `;
}

function todayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function taskStatus(task) {
  if (task.status === "Terminé") return "Terminé";
  if (!task.due) return task.status || "À faire";
  const due = new Date(`${task.due}T00:00:00`);
  if (Number.isNaN(due.getTime())) return task.status || "À faire";
  return due < todayDateOnly() ? "En retard" : task.status || "À faire";
}

function refreshTaskStatuses() {
  let changed = false;
  state.tasks = state.tasks.map((task) => {
    const status = taskStatus(task);
    if (status !== task.status) {
      changed = true;
      return touchRecord({ ...task, status });
    }
    return task;
  });
  if (changed) saveState();
}

function statusClass(status) {
  if (status === "Terminé") return "status-pill done";
  if (status === "En retard") return "status-pill late";
  return "status-pill todo";
}

function lowStock() {
  return state.stock.filter((stock) => Number(stock.quantity) <= Number(stock.threshold));
}

function harvestSummaryForField(fieldName, sourceHarvests) {
  const fieldHarvestRecords = (sourceHarvests || state.harvests || []).filter((harvest) => harvest.field === fieldName);
  if (!fieldHarvestRecords.length) return "0";
  const totals = fieldHarvestRecords.reduce((summary, harvest) => {
    summary[harvest.unit] = (summary[harvest.unit] || 0) + Number(harvest.quantity);
    return summary;
  }, {});
  return Object.entries(totals).map(([unit, quantity]) => `${quantity} ${unit}`).join(" + ");
}

function harvestByActiveCrop() {
  const activeCrops = [...new Set(activeFields().map((field) => field.crop).filter(isCropActive))];
  return activeCrops.map((crop) => {
    const cropHarvests = state.harvests.filter((harvest) => harvest.crop === crop);
    const totals = cropHarvests.reduce((summary, harvest) => {
      summary[harvest.unit] = (summary[harvest.unit] || 0) + Number(harvest.quantity);
      return summary;
    }, {});
    const total = Object.keys(totals).length
      ? Object.entries(totals).map(([unit, quantity]) => `${quantity} ${unit}`).join(" + ")
      : "0";
    return {
      crop,
      fields: activeFields().filter((field) => field.crop === crop).length,
      total
    };
  });
}

function isCropActive(cropName) {
  const crop = state.crops.find((item) => item.name === cropName);
  return !crop || crop.active !== false;
}

function cropOptions(currentValue = "") {
  const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];
  const names = state.crops
    .filter((crop) => crop.active !== false || currentValues.includes(crop.name))
    .map((crop) => crop.name);
  return [...new Set(names)];
}

function fieldOptionsForSelect(currentValue = "") {
  const names = activeFields().map((field) => field.name);
  return [...new Set([...names, currentValue].filter(Boolean))];
}

function financeByCrop(records = state.finance) {
  const cropNames = [...new Set([...state.crops.map((crop) => crop.name), ...records.map((item) => item.crop || "Non affecté")])];
  return cropNames.map((crop) => {
    const cropRecords = records.filter((item) => (item.crop || "Non affecté") === crop);
    return {
      crop,
      revenue: cropRecords.filter((item) => item.type === "Recette").reduce((sum, item) => sum + Number(item.amount), 0),
      expense: cropRecords.filter((item) => item.type === "Dépense").reduce((sum, item) => sum + Number(item.amount), 0)
    };
  }).filter((item) => item.revenue || item.expense);
}

function salesWithPrice() {
  return state.finance
    .filter((item) => item.type === "Recette" && item.isSale && item.crop && item.crop !== "Non affecté" && Number(item.saleQuantity) > 0)
    .map((item) => ({
      ...item,
      kgQuantity: saleKgQuantity(item),
      unitPrice: Number(item.salePrice) || Number(item.amount) / Number(item.saleQuantity)
    }))
    .filter((item) => item.kgQuantity > 0)
    .map((item) => ({
      ...item,
      pricePerKg: Number(item.amount) / item.kgQuantity
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function saleKgQuantity(item) {
  if (item.saleUnit === "kg") return Number(item.saleQuantity);
  if (item.saleUnit === "tonnes") return Number(item.saleQuantity) * 1000;
  return Number(item.saleKgEquivalent) || 0;
}

function priceSummary(sales) {
  if (!sales.length) return `<p class="muted">Aucune vente avec quantité pour cette sélection.</p>`;
  const latest = sales[sales.length - 1];
  const average = sales.reduce((sum, sale) => sum + sale.pricePerKg, 0) / sales.length;
  const best = sales.reduce((max, sale) => sale.pricePerKg > max.pricePerKg ? sale : max, sales[0]);
  return `
    <div class="summary-line"><span>Dernier prix/kg</span><strong>${money(latest.pricePerKg)} / kg</strong></div>
    <div class="summary-line"><span>Prix moyen</span><strong>${money(average)}</strong></div>
    <div class="summary-line"><span>Meilleur prix/kg</span><strong>${money(best.pricePerKg)}</strong></div>
  `;
}

function renderPriceChart(sales) {
  if (sales.length < 2) return `<p class="muted">Ajoutez au moins deux ventes avec quantité pour voir la courbe.</p>`;
  const width = 720;
  const height = 260;
  const pad = 34;
  const prices = sales.map((sale) => sale.pricePerKg);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = sales.map((sale, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(sales.length - 1, 1);
    const y = height - pad - ((sale.pricePerKg - min) / range) * (height - pad * 2);
    return { x, y, sale };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Courbe d'évolution des prix de vente">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" class="chart-axis" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" class="chart-axis" />
      <polyline points="${line}" class="chart-line" />
      ${points.map((point) => `
        <g>
          <circle cx="${point.x}" cy="${point.y}" r="5" class="chart-point" />
          <text x="${point.x}" y="${point.y - 10}" text-anchor="middle">${Math.round(point.sale.pricePerKg)}</text>
        </g>
      `).join("")}
      <text x="${pad}" y="${height - 8}">${sales[0].date}</text>
      <text x="${width - pad}" y="${height - 8}" text-anchor="end">${sales[sales.length - 1].date}</text>
    </svg>
  `;
}

function profileOptions() {
  return state.profiles.map((profile) => ({ value: profile.id, label: `${profile.name} - ${profile.role}` }));
}

function defaultTeamProfileId() {
  return state.profiles.some((profile) => profile.id === "terrain-profile") ? "terrain-profile" : (state.profiles.find((profile) => profile.role === "Terrain") || state.profiles[0] || {}).id || "terrain-profile";
}

function profileName(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  return profile ? profile.name : "Profil non défini";
}

function profileRole(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  return profile ? profile.role : "";
}

function profilePages(profile) {
  if (profile.role === "Admin") return defaultPagesByRole.Admin;
  return Array.isArray(profile.pages) && profile.pages.length ? profile.pages : defaultPagesByRole[profile.role] || ["dashboard"];
}

function allSectionsForPages(pages) {
  return pages.flatMap((page) => (accessSections[page] || []).map((section) => section.id));
}

function expandLegacySections(sections = []) {
  const expanded = new Set(sections);
  sections.forEach((section) => {
    if (!section.endsWith(":form")) return;
    const prefix = section.replace(":form", "");
    expanded.add(`${prefix}:write`);
    expanded.add(`${prefix}:delete`);
  });
  return Array.from(expanded).filter((section) => !section.endsWith(":form"));
}

function profileSections(profile) {
  const pages = profilePages(profile);
  if (profile.role === "Admin") return allSectionsForPages(pages);
  if (Array.isArray(profile.sections)) return expandLegacySections(profile.sections);
  const sections = allSectionsForPages(pages);
  return profilePages(profile).includes("finance") ? sections : sections.filter((section) => section !== "dashboard:revenues");
}

function canAccessSection(sectionId) {
  const profile = currentProfile();
  if (profile.role === "Admin") return true;
  if (sectionId === "finance:cash") return profilePages(profile).includes("finance");
  return profileSections(profile).includes(sectionId);
}

function pageLabel(pageId) {
  const page = navItems.find(([id]) => id === pageId);
  return page ? page[1] : pageId;
}

function staffOptions() {
  return state.team.map((person) => person.name);
}

function financeAssigneeOptions(currentValue = "") {
  const options = [{ value: "", label: "Non assigné" }, ...state.team.map((person) => ({
    value: person.id || person.name || person.login,
    label: person.name || person.login || person.role || "Utilisateur"
  }))];
  const normalizedCurrent = String(currentValue || "").trim().toLowerCase();
  if (normalizedCurrent && !options.some((option) => [option.value, option.label].some((value) => String(value || "").trim().toLowerCase() === normalizedCurrent))) {
    options.push({ value: currentValue, label: currentValue });
  }
  const current = currentUser();
  if (!options.length && current) return [{ value: current.id || current.name || current.login, label: currentUserLabel() }];
  return options;
}

function currentProfile() {
  return state.profiles.find((profile) => profile.id === activeProfileId) || state.profiles[0] || starterState.profiles[0];
}

function canSeeFinance() {
  const profile = currentProfile();
  return profile.role === "Admin" || profilePages(profile).includes("finance");
}

function canManageProfiles() {
  return currentProfile().role === "Admin";
}

function canManageTeam() {
  return currentProfile().role === "Admin";
}

function canValidateFinance() {
  return currentProfile().role === "Admin" || canAccessSection("finance:validate");
}

const modalWriteSections = {
  field: "fields:write",
  crop: "crops:write",
  task: "tasks:write",
  baseTask: "tasks:write",
  harvest: "harvests:write",
  stock: "stock:write",
  finance: "finance:write",
  sale: "prices:write",
  team: "team:write",
  profile: "profiles:write"
};

const collectionDeleteSections = {
  fields: "fields:delete",
  crops: "crops:delete",
  tasks: "tasks:delete",
  dailyTaskTemplates: "tasks:delete",
  harvests: "harvests:delete",
  stock: "stock:delete",
  finance: "finance:delete",
  team: "team:delete",
  profiles: "profiles:delete"
};

function canWriteModal(type) {
  if (type === "profile") return canManageProfiles();
  if (type === "team") return canManageTeam();
  return canAccessSection(modalWriteSections[type]);
}

function canDeleteCollection(collection) {
  if (collection === "profiles") return canManageProfiles();
  if (collection === "team") return canManageTeam();
  return canAccessSection(collectionDeleteSections[collection]);
}

function canAccessView(view) {
  const profile = currentProfile();
  if (view === "profiles") return canManageProfiles();
  if (profile.role === "Admin") return true;
  return profilePages(profile).includes(view);
}

function ensureAllowedView() {
  if (!canAccessView(currentView)) {
    currentView = "dashboard";
    document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
    document.querySelector("#dashboardView").classList.add("active");
    document.querySelector("#pageTitle").textContent = "Tableau de bord";
  }
}

function applySectionAccess() {
  const rules = [
    ["#kpiGrid", "dashboard:kpis"],
    ["#priorityTasks", "dashboard:tasks"],
    ["#dashboardView .dashboard-weather-top", "dashboard:weather"],
    ["#fieldStrip", "dashboard:fields"],
    ["#stockAlerts", "dashboard:stock"],
    ["#cultureHarvests", "dashboard:harvests"],
    ["#dashboardRevenuePanel", "dashboard:revenues"],
    ["#revenueCard", "dashboard:revenues"],
    ["#revenueDetailsBtn", "dashboard:revenues"],
    ["#fieldsGrid", "fields:list"],
    ['[data-modal="field"]', "fields:write"],
    ["#cropsGrid", "crops:list"],
    ['[data-modal="crop"]', "crops:write"],
    ["#tasksView .daily-task-panel", "tasks:base"],
    ["#dailyTaskBase", "tasks:base"],
    ['[data-modal="baseTask"]', "tasks:write"],
    ["#taskPeriodFilters", "tasks:filters"],
    ["#taskFilters", "tasks:filters"],
    ["#tasksTable", "tasks:list"],
    ["#quickTaskBtn", "tasks:write"],
    ['[data-modal="task"]', "tasks:write"],
    ["#harvestSummary", "harvests:summary"],
    ["#harvestPeriodFilters", "harvests:table"],
    ["#harvestsTable", "harvests:table"],
    ['[data-modal="harvest"]', "harvests:write"],
    ["#stockGrid", "stock:list"],
    ['[data-modal="stock"]', "stock:write"],
    ["#financeSummary", "finance:summary"],
    ["#financeCashPanel", "finance:cash"],
    ["#financeUserBalancePanel", "finance:cash"],
    ["#financePeriodFilters", "finance:operations"],
    ["#financeUserFilters", "finance:userFilter"],
    ["#financeTable", "finance:operations"],
    ["#financeByCropTable", "finance:byCrop"],
    ['#financeView [data-modal="finance"]', "finance:write"],
    ["#priceFilters", "prices:filters"],
    ["#pricePeriodFilters", "prices:filters"],
    ["#priceSummary", "prices:filters"],
    ["#priceChart", "prices:chart"],
    ["#priceSalesTable", "prices:sales"],
    ['#pricesView [data-modal="sale"]', "prices:write"],
    ['[data-edit][data-type="field"]', "fields:write"],
    ['[data-toggle-field]', "fields:write"],
    ['[data-delete][data-collection="fields"]', "fields:delete"],
    ['[data-edit][data-type="crop"]', "crops:write"],
    ['[data-toggle-crop]', "crops:write"],
    ['[data-delete][data-collection="crops"]', "crops:delete"],
    ['[data-edit][data-type="task"]', "tasks:write"],
    ['[data-edit][data-type="baseTask"]', "tasks:write"],
    ['[data-base-task-check]', "tasks:write"],
    ['[data-delete][data-collection="tasks"]', "tasks:delete"],
    ['[data-delete][data-collection="dailyTaskTemplates"]', "tasks:delete"],
    ['[data-complete]', "tasks:write"],
    ['[data-edit][data-type="harvest"]', "harvests:write"],
    ['[data-delete][data-collection="harvests"]', "harvests:delete"],
    ['[data-edit][data-type="stock"]', "stock:write"],
    ['[data-delete][data-collection="stock"]', "stock:delete"],
    ['[data-edit][data-type="finance"]', "finance:write"],
    ['[data-delete][data-collection="finance"]', "finance:delete"],
    ['[data-edit][data-type="team"]', "team:write"],
    ['[data-delete][data-collection="team"]', "team:delete"],
    ["#teamGrid", "team:list"],
    ['[data-modal="team"]', "team:write"]
  ];
  rules.forEach(([selector, sectionId]) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.classList.toggle("access-hidden", !canAccessSection(sectionId));
    });
  });
  document.querySelectorAll('[data-modal="team"], [data-edit][data-type="team"], [data-delete][data-collection="team"]').forEach((node) => {
    node.classList.toggle("access-hidden", !canManageTeam());
  });
}

function renderProfileSelect() {
  const select = document.querySelector("#profileSelect");
  if (!select) return;
  if (!state.profiles.some((profile) => profile.id === activeProfileId)) {
    activeProfileId = state.profiles[0] ? state.profiles[0].id : "admin-profile";
    localStorage.setItem(activeProfileKey, activeProfileId);
  }
  select.innerHTML = state.profiles.map((profile) => optionTag(`${profile.name} - ${profile.role}`, `${profile.name} - ${profile.role}`, profile.id)).join("");
  select.value = activeProfileId;
}

function accessDescription(role) {
  if (role === "Admin") return "Accès complet";
  if (role === "Comptable") return "Accès finances et revenus";
  if (role === "Chef exploitation") return "Opérations sans finances";
  if (role === "Commercial") return "Commercial sans dépenses";
  return "Finances et revenus masqués";
}

function openModal(type, id = null) {
  const saleShortcut = type === "sale";
  modalType = saleShortcut ? "finance" : type;
  modalAccessType = type;
  if (!canWriteModal(type)) return;
  if (modalType === "team" && !canManageTeam()) return;
  const config = modalConfig[modalType];
  const rawRecord = id ? state[config.collection].find((item) => item.id === id) : null;
  const record = rawRecord && modalType === "team" ? teamRecordWithAccount(rawRecord) : rawRecord;
  if (modalType === "finance" && record && !canEditFinanceRecord(record)) return;
  const saleDefaults = saleShortcut ? { type: "Recette", isSale: "on", saleUnit: "kg" } : {};
  editingRecord = record ? { collection: config.collection, id } : null;
  document.querySelector("#modalTitle").textContent = saleShortcut ? "Ajouter une vente" : record ? config.title.replace("Ajouter", "Modifier") : config.title;
  document.querySelector("#modalFields").innerHTML = config.fields.map(([name, label, typeName, options]) => {
    const value = record && record[name] !== undefined ? record[name] : saleDefaults[name] !== undefined ? saleDefaults[name] : "";
    if (modalType === "team" && ["profileId", "login", "password"].includes(name) && !canManageProfiles()) return "";
    if (saleShortcut && name === "type") return `<input type="hidden" name="type" value="Recette" />`;
    if (saleShortcut && name === "isSale") return `<input type="hidden" name="isSale" value="on" />`;
    const safeValue = escapeHtml(value);
    if (typeName === "pagesSelect") {
      const selectedPages = Array.isArray(value) && value.length ? value : defaultPagesByRole[(record && record.role) || "Terrain"] || ["dashboard"];
      return `<fieldset class="wide-field checkbox-group" id="profilePageAccess"><legend>${label}</legend>${accessPages.map((page) => `<label><input type="checkbox" name="pages" value="${page.id}" ${selectedPages.includes(page.id) ? "checked" : ""} />${page.label}</label>`).join("")}</fieldset>`;
    }
    if (typeName === "sectionsSelect") {
      const selectedPages = record && Array.isArray(record.pages) && record.pages.length ? record.pages : defaultPagesByRole[(record && record.role) || "Terrain"] || ["dashboard"];
      const selectedSections = Array.isArray(value) ? value : allSectionsForPages(selectedPages);
      return `<div class="wide-field" id="profileSectionAccess">${renderSectionAccessChoices(selectedPages, selectedSections, label)}</div>`;
    }
    if (typeName === "cropCheckboxes") {
      const selectedCrops = Array.isArray(value) ? value : cropOptions();
      return `<fieldset class="wide-field checkbox-group"><legend>${label}</legend>${cropOptions(value).map((crop) => `<label><input type="checkbox" name="${name}" value="${crop}" ${selectedCrops.includes(crop) ? "checked" : ""} />${crop}</label>`).join("")}</fieldset>`;
    }
    if (typeName === "modeCheckboxes") {
      const modeOptions = ["Plein champ", "Serre"];
      const selectedModes = Array.isArray(value) ? value : [];
      return `<fieldset class="wide-field checkbox-group"><legend>${label}</legend>${modeOptions.map((mode) => `<label><input type="checkbox" name="${name}" value="${mode}" ${selectedModes.includes(mode) ? "checked" : ""} />${mode}</label>`).join("")}<p class="muted wide-field">Laissez vide pour appliquer à tous les modes.</p></fieldset>`;
    }
    if (typeName === "profileSelect") {
      const options = profileOptions();
      const selectedProfile = value || (!record && modalType === "team" ? defaultTeamProfileId() : "");
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option.label, selectedProfile, option.value)).join("")}</select></label>`;
    }
    if (typeName === "fieldSelect") {
      const fieldOptions = fieldOptionsForSelect(value);
      if (modalType === "task" && !record) {
        return `
          <fieldset class="wide-field checkbox-group"><legend>${label}</legend>${fieldOptions.map((option) => `<label><input type="checkbox" name="${name}" value="${escapeHtml(option)}" />${escapeHtml(option)}</label>`).join("")}</fieldset>
          <fieldset class="wide-field checkbox-group"><legend>Mode de création</legend>
            <label><input type="radio" name="taskCreationMode" value="grouped" checked />Une seule tâche avec les parcelles sélectionnées</label>
            <label><input type="radio" name="taskCreationMode" value="separate" />Une tâche séparée par parcelle</label>
          </fieldset>
        `;
      }
      return `<label>${label}<select name="${name}" required>${fieldOptions.map((option) => optionTag(option, value)).join("")}</select></label>`;
    }
    if (typeName === "cropSelect") {
      const options = cropOptions(value);
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option, value)).join("")}</select></label>`;
    }
    if (typeName === "cropSelectOptional") {
      const options = ["Non affecté", ...cropOptions(value)];
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option, value || "Non affecté")).join("")}</select></label>`;
    }
    if (typeName === "staffSelect") {
      const options = staffOptions();
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option, value)).join("")}</select></label>`;
    }
    if (typeName === "financeAssigneeSelect") {
      if (!canManageProfiles()) return "";
      const selectedAssignee = value || "";
      const options = financeAssigneeOptions(selectedAssignee);
      return `<label>${label}<select name="${name}">${options.map((option) => optionTag(option.label, selectedAssignee, option.value)).join("")}</select></label>`;
    }
    if (typeName === "financeStatusSelect") {
      const selectedStatus = value || (canValidateFinance() ? "Validé" : "Soumis");
      if (!canValidateFinance()) return `<input type="hidden" name="${name}" value="${escapeHtml(selectedStatus)}" />`;
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option, selectedStatus)).join("")}</select></label>`;
    }
    if (typeName === "financeTypeSelect") {
      const allowedTypes = canValidateFinance() ? options : ["Recette", "Dépense", "Retour caisse"];
      const selectedType = allowedTypes.includes(value) ? value : allowedTypes[0];
      return `<label>${label}<select name="${name}" required>${allowedTypes.map((option) => optionTag(option, selectedType)).join("")}</select></label>`;
    }
    if (typeName === "textarea") {
      return `<label class="wide-field">${label}<textarea name="${name}" rows="4" placeholder="Exemple : feuilles jaunies sur 2 lignes, arrosage renforcé, plants en bonne reprise...">${safeValue}</textarea></label>`;
    }
    if (modalType === "task" && !record && name === "due") {
      return `
        <fieldset class="wide-field checkbox-group"><legend>Échéances</legend>
          <label>Date 1<input name="${name}" type="date" required /></label>
          <label>Date 2<input name="${name}" type="date" /></label>
          <label>Date 3<input name="${name}" type="date" /></label>
          <label>Date 4<input name="${name}" type="date" /></label>
          <label>Date 5<input name="${name}" type="date" /></label>
          <label>Date 6<input name="${name}" type="date" /></label>
          <label>Date 7<input name="${name}" type="date" /></label>
        </fieldset>
      `;
    }
    if (typeName === "checkbox") {
      const checked = name === "active" ? !record || record.active !== false : Boolean(value);
      return `<label class="checkbox-field">${label}<input name="${name}" type="checkbox" ${checked ? "checked" : ""} /></label>`;
    }
    if (typeName === "select") {
      const saleFieldClass = name === "saleUnit" ? "sale-field" : "";
      return `<label class="${saleFieldClass}">${label}<select name="${name}" ${name === "saleUnit" ? "" : "required"}>${options.map((option) => optionTag(option, value)).join("")}</select></label>`;
    }
    if (modalType === "field" && name === "area") {
      return `<label>${label}<input name="${name}" type="number" value="${safeValue}" min="0" max="3" step="0.01" required /><span class="field-hint">De 0 à 3 ha. Exemple : 300 m² = 0,03 ha.</span></label>`;
    }
    const optionalSaleField = ["saleQuantity", "salePrice", "saleUnit", "saleKgEquivalent"].includes(name);
    return `<label class="${optionalSaleField ? "sale-field" : ""}">${label}<input name="${name}" type="${typeName}" value="${safeValue}" ${optionalSaleField ? "" : "required"} /></label>`;
  }).join("");
  if (modalType === "finance") {
    document.querySelector("#modalFields").insertAdjacentHTML(
      "beforeend",
      `<div class="unit-price-preview sale-field" id="unitPricePreview">Prix unitaire : à calculer</div>`
    );
    bindFinanceSaleFields();
  }
  if (modalType === "profile") bindProfileAccessFields();
  document.querySelector("#recordModal").showModal();
}

function renderSectionAccessChoices(pages, selectedSections, label = "Sous-sections autorisées") {
  const visiblePages = pages.length ? pages : ["dashboard"];
  const selected = expandLegacySections(selectedSections);
  return `<fieldset class="checkbox-group section-access-group"><legend>${label}</legend>${visiblePages.map((page) => {
    const sections = accessSections[page] || [];
    return `<div class="section-access-page"><strong>${pageLabel(page)}</strong>${sections.map((section) => `<label><input type="checkbox" name="sections" value="${section.id}" ${selected.includes(section.id) ? "checked" : ""} />${section.label}</label>`).join("")}</div>`;
  }).join("")}</fieldset>`;
}

function bindProfileAccessFields() {
  const form = document.querySelector("#recordForm");
  const container = document.querySelector("#profileSectionAccess");
  if (!form || !container) return;
  form.querySelectorAll('input[name="pages"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const formData = new FormData(form);
      const pages = formData.getAll("pages");
      const selectedSections = formData.getAll("sections");
      container.innerHTML = renderSectionAccessChoices(pages, selectedSections);
    });
  });
}

function bindFinanceSaleFields() {
  const form = document.querySelector("#recordForm");
  ["type", "crop", "isSale", "saleQuantity", "salePrice", "saleUnit", "saleKgEquivalent"].forEach((name) => {
    const field = form.elements[name];
    if (field) field.addEventListener("input", updateFinanceSaleFields);
    if (field) field.addEventListener("change", updateFinanceSaleFields);
  });
  updateFinanceSaleFields();
}

function updateFinanceSaleFields() {
  const form = document.querySelector("#recordForm");
  const isSale = form.elements.type && form.elements.type.value === "Recette";
  const saleChecked = form.elements.isSale && form.elements.isSale.type === "hidden" ? form.elements.isSale.value === "on" : Boolean(form.elements.isSale && form.elements.isSale.checked);
  const hasCrop = form.elements.crop && form.elements.crop.value && form.elements.crop.value !== "Non affecté";
  const showSaleCheckbox = isSale && hasCrop;
  const saleCheckboxLabel = form.elements.isSale ? form.elements.isSale.closest("label") : null;
  if (saleCheckboxLabel) {
    saleCheckboxLabel.classList.toggle("sale-fields-hidden", !showSaleCheckbox);
    form.elements.isSale.disabled = !showSaleCheckbox;
    if (!showSaleCheckbox) form.elements.isSale.checked = false;
  }
  const showSaleFields = showSaleCheckbox && saleChecked;
  if (form.elements.amount) {
    form.elements.amount.readOnly = showSaleFields;
    form.elements.amount.classList.toggle("readonly-input", showSaleFields);
  }
  document.querySelectorAll(".sale-field").forEach((field) => {
    field.classList.toggle("sale-fields-hidden", !showSaleFields);
    field.querySelectorAll("input, select").forEach((input) => {
      input.disabled = !showSaleFields;
    });
  });
  const preview = document.querySelector("#unitPricePreview");
  if (!preview || !showSaleFields) return;
  const quantity = Number((form.elements.saleQuantity && form.elements.saleQuantity.value) || 0);
  const salePrice = Number((form.elements.salePrice && form.elements.salePrice.value) || 0);
  const unit = (form.elements.saleUnit && form.elements.saleUnit.value) || "unité";
  const kgEquivalentLabel = form.elements.saleKgEquivalent ? form.elements.saleKgEquivalent.closest("label") : null;
  const needsKgEquivalent = !["kg", "tonnes"].includes(unit);
  if (kgEquivalentLabel) {
    kgEquivalentLabel.classList.toggle("sale-fields-hidden", !showSaleFields || !needsKgEquivalent);
    form.elements.saleKgEquivalent.disabled = !showSaleFields || !needsKgEquivalent;
  }
  if (quantity > 0 && salePrice > 0) {
    const calculatedAmount = Math.round(quantity * salePrice);
    form.elements.amount.value = calculatedAmount;
    const kgQuantity = unit === "kg" ? quantity : unit === "tonnes" ? quantity * 1000 : Number((form.elements.saleKgEquivalent && form.elements.saleKgEquivalent.value) || 0);
    const kgText = kgQuantity > 0 ? ` • Prix/kg : ${money(calculatedAmount / kgQuantity)}` : "";
    preview.textContent = `Montant calculé automatiquement : ${money(calculatedAmount)} (${quantity} ${unit} × ${money(salePrice)})${kgText}`;
  } else {
    form.elements.amount.value = "";
    preview.textContent = "Montant calculé automatiquement : renseignez la quantité et le prix unitaire";
  }
}

function optionTag(option, value) {
  const optionValue = arguments.length > 2 ? arguments[2] : option;
  const selected = String(option) === String(value) || String(option).startsWith(`${value} -`) || String(optionValue) === String(value);
  return `<option value="${escapeHtml(optionValue)}" ${selected ? "selected" : ""}>${escapeHtml(option)}</option>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function handleFormSubmit(event) {
  event.preventDefault();
  const config = modalConfig[modalType];
  if (!canWriteModal(modalAccessType || modalType)) return;
  if (modalType === "team" && !canManageTeam()) return;
  if (modalType === "finance" && editingRecord) {
    const existingRecord = state.finance.find((item) => item.id === editingRecord.id);
    if (!canEditFinanceRecord(existingRecord)) return;
  }
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  config.fields.forEach(([name, , typeName]) => {
    if (typeName === "number") data[name] = Number(data[name]);
  });
  if (modalType === "profile") {
    const formData = new FormData(event.currentTarget);
    data.pages = formData.getAll("pages");
    const sectionInputs = event.currentTarget.querySelectorAll('input[name="sections"]').length;
    data.sections = sectionInputs ? formData.getAll("sections") : allSectionsForPages(data.pages);
  }
  if (modalType === "baseTask") {
    const formData = new FormData(event.currentTarget);
    data.crops = formData.getAll("crops");
    data.modes = formData.getAll("modes");
  }
  if (modalType === "team" && !canManageProfiles()) {
    delete data.profileId;
    delete data.login;
    delete data.password;
  }
  if (modalType === "team" && canManageProfiles()) {
    data.profileId = data.profileId || defaultTeamProfileId();
    data.login = String(data.login || "").trim();
    data.password = String(data.password || "");
  }
  if (modalType === "crop") {
    data.active = Boolean(event.currentTarget.elements.active && event.currentTarget.elements.active.checked);
  }
  if (modalType === "field") {
    data.active = Boolean(event.currentTarget.elements.active && event.currentTarget.elements.active.checked);
    data.area = Math.max(0, Math.min(3, Number(data.area || 0)));
  }
  let selectedTaskFields = [];
  let selectedTaskDates = [];
  let separateTaskByField = false;
  if (modalType === "task") {
    const formData = new FormData(event.currentTarget);
    selectedTaskFields = formData.getAll("field").filter(Boolean);
    selectedTaskDates = [...new Set(formData.getAll("due").filter(Boolean))];
    separateTaskByField = formData.get("taskCreationMode") === "separate";
    if (!editingRecord && !selectedTaskFields.length) {
      window.alert("Sélectionnez au moins une parcelle pour créer la tâche.");
      return;
    }
    if (!editingRecord && !selectedTaskDates.length) {
      window.alert("Sélectionnez au moins une date pour créer la tâche.");
      return;
    }
    data.field = editingRecord ? data.field : separateTaskByField ? selectedTaskFields[0] : selectedTaskFields.join(", ");
    data.due = editingRecord ? data.due : selectedTaskDates[0];
    delete data.taskCreationMode;
    data.status = taskStatus(data);
  }
  if (data.health) data.health = Number.parseInt(data.health, 10);
  if (modalType === "finance") {
    if (!canValidateFinance() && !["Recette", "Dépense", "Retour caisse"].includes(data.type)) data.type = "Dépense";
    if (!canManageProfiles()) {
      if (!editingRecord) data.assignedTo = (currentUser() && currentUser().id) || currentUserLabel();
      else delete data.assignedTo;
    } else {
      data.assignedTo = data.assignedTo || "";
    }
    if (!canValidateFinance()) {
      const existingRecord = editingRecord ? state.finance.find((item) => item.id === editingRecord.id) : null;
      data.status = existingRecord && existingRecord.status ? existingRecord.status : "Soumis";
    } else {
      data.status = data.status || "Validé";
    }
    data.isSale = event.currentTarget.elements.isSale && event.currentTarget.elements.isSale.type === "hidden" ? event.currentTarget.elements.isSale.value : event.currentTarget.elements.isSale && event.currentTarget.elements.isSale.checked ? "on" : "";
    const isSaleWithCrop = data.type === "Recette" && data.isSale && data.crop && data.crop !== "Non affecté";
    if (!isSaleWithCrop) {
      data.saleQuantity = "";
      data.salePrice = "";
      data.saleUnit = "";
      data.saleKgEquivalent = "";
    } else if (Number(data.saleQuantity) > 0 && Number(data.salePrice) > 0) {
      data.amount = Number(data.saleQuantity) * Number(data.salePrice);
      if (data.saleUnit === "kg") data.saleKgEquivalent = Number(data.saleQuantity);
      if (data.saleUnit === "tonnes") data.saleKgEquivalent = Number(data.saleQuantity) * 1000;
    }
  }
  let savedRecordId = editingRecord ? editingRecord.id : createId();
  if (editingRecord) {
    const timestamp = new Date().toISOString();
    state[config.collection] = state[config.collection].map((item) =>
      item.id === editingRecord.id ? touchRecord({ ...item, ...data }, timestamp) : item
    );
  } else if (modalType === "task" && (selectedTaskDates.length > 1 || (separateTaskByField && selectedTaskFields.length > 1))) {
    const timestamp = new Date().toISOString();
    const fieldGroups = separateTaskByField ? selectedTaskFields : [selectedTaskFields.join(", ")];
    selectedTaskDates.forEach((due) => {
      fieldGroups.forEach((fieldName) => {
        const taskData = { ...data, field: fieldName, due };
        state[config.collection].unshift(touchRecord({ id: createId(), ...taskData, status: taskStatus(taskData) }, timestamp));
      });
    });
  } else {
    state[config.collection].unshift(touchRecord({ id: savedRecordId, ...data }));
  }
  if (modalType === "team") {
    upsertUserAccountForTeamMember(savedRecordId, data);
    state.userAccounts = mergeUserAccounts(state.userAccounts, state.team);
  }
  saveState();
  editingRecord = null;
  event.currentTarget.reset();
  document.querySelector("#recordModal").close();
  render();
}

function openPasswordModal() {
  const form = document.querySelector("#passwordForm");
  const message = document.querySelector("#passwordMessage");
  const person = currentUser();
  form.reset();
  form.querySelectorAll("[data-toggle-password]").forEach((button) => {
    const input = form.elements[button.dataset.togglePassword];
    if (input) input.type = "password";
    button.classList.remove("active");
    button.setAttribute("aria-label", button.dataset.togglePassword === "confirmPassword" ? "Afficher la confirmation" : "Afficher le nouveau mot de passe");
  });
  form.elements.login.value = person ? person.login || "" : "";
  message.textContent = "";
  message.className = "wide-field password-message";
  document.querySelector("#passwordModal").showModal();
}

function togglePasswordVisibility(button) {
  const form = button.closest("form");
  const input = form && form.elements[button.dataset.togglePassword];
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.classList.toggle("active", show);
  button.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
}

function passwordForCurrentUser(person) {
  const account = arrayOrEmpty(state.userAccounts).find((item) => item.id === person.id || item.teamId === person.id || item.login === person.login);
  return account && account.password !== undefined ? String(account.password || "") : String(person.password || "");
}

function accountMatchesPerson(account, person) {
  return account && person && (
    account.id === person.id
    || account.teamId === person.id
    || String(account.login || "").trim() === String(person.login || "").trim()
  );
}

async function currentPasswordIsValid(person, currentPassword) {
  if (!person) return false;
  if (passwordForCurrentUser(person) === currentPassword) return true;
  if (!supabaseEnabled() || !navigator.onLine) return false;
  const remoteAccounts = await fetchRemoteCollection("userAccounts").catch(() => []);
  const remoteAccount = remoteAccounts.find((account) => accountMatchesPerson(account, person));
  if (!remoteAccount || String(remoteAccount.password || "") !== currentPassword) return false;
  state.userAccounts = mergeUserAccounts([remoteAccount, ...arrayOrEmpty(state.userAccounts)], state.team);
  state.team = state.team.map((member) =>
    member.id === person.id ? { ...member, login: remoteAccount.login || member.login, password: remoteAccount.password || member.password, profileId: remoteAccount.profileId || member.profileId } : member
  );
  saveState({ sync: false, touch: false });
  return true;
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[value="default"]');
  const currentPassword = form.elements.currentPassword.value;
  const newPassword = form.elements.newPassword.value;
  const confirmPassword = form.elements.confirmPassword.value;
  const person = currentUser();
  if (!await currentPasswordIsValid(person, currentPassword)) {
    showPasswordMessage("Ancien mot de passe incorrect.", "error");
    return;
  }
  if (newPassword.length < 4) {
    showPasswordMessage("Le nouveau mot de passe doit contenir au moins 4 caractères.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showPasswordMessage("La confirmation ne correspond pas au nouveau mot de passe.", "error");
    return;
  }

  state.team = state.team.map((member) =>
    member.id === person.id ? touchRecord({ ...member, password: newPassword }) : member
  );
  upsertUserAccountForTeamMember(person.id, { password: newPassword });
  state.userAccounts = mergeUserAccounts(state.userAccounts, state.team);
  if (submitButton) submitButton.disabled = true;
  showPasswordMessage("Mot de passe mis à jour localement. Synchronisation Supabase...", "success");
  saveState({ sync: false });
  if (!navigator.onLine || !supabaseEnabled()) {
    showPasswordMessage("Mot de passe local mis à jour, mais Supabase n'est pas accessible maintenant.", "error");
    if (submitButton) submitButton.disabled = false;
    return;
  }
  try {
    await pushRemoteState();
    showPasswordMessage("Mot de passe mis à jour dans Supabase. Reconnectez-vous avec le nouveau mot de passe.", "success");
  } catch (error) {
    showPasswordMessage(`Mot de passe local mis à jour, mais Supabase n'a pas confirmé : ${error.message}`, "error");
    if (submitButton) submitButton.disabled = false;
    return;
  }
  window.setTimeout(() => {
    form.reset();
    document.querySelector("#passwordModal").close();
    logout();
  }, 800);
}

function showPasswordMessage(text, type) {
  const message = document.querySelector("#passwordMessage");
  message.textContent = text;
  message.className = `wide-field password-message ${type}`;
}

function deleteRecord(collection, id) {
  if (!canDeleteCollection(collection)) return;
  if (collection === "finance") {
    const record = state.finance.find((item) => item.id === id);
    if (record && !canDeleteFinanceRecord(record)) return;
  }
  if (collection === "team" && !canManageTeam()) return;
  state[collection] = state[collection].filter((item) => item.id !== id);
  rememberDeletion(collection, id);
  if (collection === "team") rememberDeletion("userAccounts", id);
  if (collection === "profiles" && activeProfileId === id) {
    activeProfileId = "admin-profile";
    localStorage.setItem(activeProfileKey, activeProfileId);
  }
  saveState();
  render();
}

function completeTask(id) {
  if (!canAccessSection("tasks:write")) return;
  setTaskCompletion(id, true);
}

function setTaskCompletion(id, done) {
  if (!canAccessSection("tasks:write")) return;
  state.tasks = state.tasks.map((task) => {
    if (task.id !== id) return task;
    if (done) {
      const previousStatus = task.status && task.status !== "Terminé" ? task.status : task.previousStatus || "À faire";
      return touchRecord({ ...task, previousStatus, status: "Terminé" });
    }
    const restoredStatus = task.previousStatus && task.previousStatus !== "Terminé" ? task.previousStatus : "À faire";
    return touchRecord({ ...task, previousStatus: "", status: restoredStatus });
  });
  saveState();
  render();
}

function toggleField(id) {
  if (!canAccessSection("fields:write")) return;
  state.fields = state.fields.map((field) =>
    field.id === id ? touchRecord({ ...field, active: field.active === false }) : field
  );
  saveState();
  render();
}

function toggleCrop(id) {
  if (!canAccessSection("crops:write")) return;
  state.crops = state.crops.map((crop) =>
    crop.id === id ? touchRecord({ ...crop, active: crop.active === false }) : crop
  );
  saveState();
  render();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    renderConnection();
    return;
  }
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => ("caches" in window ? caches.keys() : []))
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .finally(renderConnection);
}

try {
  init();
} catch (error) {
  showStartupError(error.message);
}













