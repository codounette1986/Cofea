const stateKey = "agripilot-state-v1";
const activeProfileKey = "agripilot-active-profile-v1";
const authUserKey = "agripilot-auth-user-v1";
const lastRemoteSyncKey = "agripilot-last-remote-sync-v1";

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

const starterState = {
  profiles: [
    { id: "admin-profile", name: "Admins", role: "Admin", note: "Accès complet à toute l'application." },
    { id: "chef-profile", name: "Chef d'exploitation", role: "Chef exploitation", note: "Pilotage opérationnel sans accès aux finances." },
    { id: "commercial-profile", name: "Commercial", role: "Commercial", note: "Suivi des cultures, récoltes, stock et contacts sans accès aux dépenses." },
    { id: "comptable-profile", name: "Comptable", role: "Comptable", note: "Accès aux finances, revenus et dépenses." },
    { id: "terrain-profile", name: "Équipe terrain", role: "Terrain", note: "Accès terrain. Finances et revenus masqués." }
  ],
  fields: [
    { id: crypto.randomUUID(), name: "Serre 1", crop: "Poivrons", area: 0.6, stage: "Floraison", health: 84, mode: "Serre", update: "Plants vigoureux, floraison régulière. Surveiller l'humidité en fin de journée." },
    { id: crypto.randomUUID(), name: "Serre 2", crop: "Piment", area: 0.4, stage: "Fructification", health: 78, mode: "Serre", update: "Quelques feuilles marquées, contrôle thrips à refaire après arrosage." },
    { id: crypto.randomUUID(), name: "Plein champ Nord", crop: "Papayes", area: 2.8, stage: "Croissance", health: 88, mode: "Plein champ", update: "Bonne reprise après paillage, croissance homogène." },
    { id: crypto.randomUUID(), name: "Plein champ Sud", crop: "Piment", area: 1.7, stage: "Reprise", health: 71, mode: "Plein champ", update: "Reprise correcte mais stress hydrique visible sur quelques lignes." }
  ],
  tasks: [
    { id: crypto.randomUUID(), title: "Contrôle goutte-à-goutte", field: "Serre 1", owner: "Awa", due: "2026-08-18", status: "En cours" },
    { id: crypto.randomUUID(), title: "Tuteurage des poivrons", field: "Serre 1", owner: "Mamadou", due: "2026-08-19", status: "À faire" },
    { id: crypto.randomUUID(), title: "Surveillance thrips et acariens", field: "Serre 2", owner: "Ibrahima", due: "2026-08-17", status: "En retard" },
    { id: crypto.randomUUID(), title: "Paillage papayers", field: "Plein champ Nord", owner: "Awa", due: "2026-08-22", status: "À faire" },
    { id: crypto.randomUUID(), title: "Désherbage plein champ", field: "Plein champ Sud", owner: "Mamadou", due: "2026-08-20", status: "À faire" }
  ],
  harvests: [
    { id: crypto.randomUUID(), date: "2026-08-10", field: "Serre 2", crop: "Piment", quantity: 64, unit: "kg", quality: "Très bonne", destination: "Vente marché" },
    { id: crypto.randomUUID(), date: "2026-08-13", field: "Serre 1", crop: "Poivrons", quantity: 48, unit: "kg", quality: "Bonne", destination: "Commande restaurant" },
    { id: crypto.randomUUID(), date: "2026-08-15", field: "Plein champ Nord", crop: "Papayes", quantity: 32, unit: "pièces", quality: "À trier", destination: "Stock ferme" }
  ],
  crops: [
    { id: crypto.randomUUID(), name: "Poivrons", active: true, family: "Solanacées", cycle: "90 à 120 jours", water: "Régulier, sans excès", spacing: "50 x 50 cm", notes: "Surveiller les thrips, acariens et coups de chaleur en serre." },
    { id: crypto.randomUUID(), name: "Piment", active: true, family: "Solanacées", cycle: "100 à 150 jours", water: "Modéré et fréquent", spacing: "50 x 60 cm", notes: "Récoltes échelonnées. Bien suivre floraison, nouaison et attaques d'insectes." },
    { id: crypto.randomUUID(), name: "Papayes", active: true, family: "Caricacées", cycle: "8 à 12 mois avant production", water: "Profond et régulier", spacing: "2,5 x 2,5 m", notes: "Éviter l'eau stagnante. Paillage utile en plein champ." }
  ],
  stock: [
    { id: crypto.randomUUID(), item: "Semences poivron", category: "Semences", quantity: 8, unit: "sachets", threshold: 4 },
    { id: crypto.randomUUID(), item: "Plants papayer", category: "Plantation", quantity: 120, unit: "plants", threshold: 60 },
    { id: crypto.randomUUID(), item: "Compost", category: "Fertilisation", quantity: 1.6, unit: "t", threshold: 2 },
    { id: crypto.randomUUID(), item: "Film serre", category: "Serre", quantity: 2, unit: "rouleaux", threshold: 1 }
  ],
  finance: [
    { id: crypto.randomUUID(), date: "2026-08-12", label: "Vente piment frais", crop: "Piment", type: "Recette", amount: 185000, isSale: "on", saleQuantity: 64, salePrice: 2890.625, saleUnit: "kg" },
    { id: crypto.randomUUID(), date: "2026-08-13", label: "Vente poivrons restaurant", crop: "Poivrons", type: "Recette", amount: 144000, isSale: "on", saleQuantity: 48, salePrice: 3000, saleUnit: "kg" },
    { id: crypto.randomUUID(), date: "2026-08-14", label: "Main d'oeuvre serre", crop: "Poivrons", type: "Dépense", amount: 42000 },
    { id: crypto.randomUUID(), date: "2026-08-15", label: "Achat compost papayes", crop: "Papayes", type: "Dépense", amount: 38000 }
  ],
  team: [
    
    { id: "admin-user", name: "Administrateur", role: "Admin", phone: "", profileId: "admin-profile", login: "admin", password: "admin123" },
    { id: crypto.randomUUID(), name: "Awa Ndiaye", role: "Responsable irrigation", phone: "77 000 10 20", profileId: "chef-profile", login: "awa", password: "1234" },
    { id: crypto.randomUUID(), name: "Mamadou Fall", role: "Chef de parcelle", phone: "76 000 30 40", profileId: "terrain-profile", login: "mamadou", password: "1234" },
    { id: crypto.randomUUID(), name: "Ibrahima Diop", role: "Machiniste", phone: "78 000 50 60", profileId: "terrain-profile", login: "ibrahima", password: "1234" }
  ]
};

let state = loadState();
let currentView = "dashboard";
let activeTaskFilter = "Tous";
let activePriceCrop = "Toutes";
let periodFilters = {
  tasks: { from: "", to: "" },
  harvests: { from: "", to: "" },
  finance: { from: "", to: "" },
  prices: { from: "", to: "" }
};
let modalType = "task";
let editingRecord = null;
let activeProfileId = localStorage.getItem(activeProfileKey) || "admin-profile";
let activeUserId = localStorage.getItem(authUserKey) || "";
let syncTimer = null;
let syncState = {
  status: "idle",
  detail: localStorage.getItem(lastRemoteSyncKey) ? `Dernière synchro : ${localStorage.getItem(lastRemoteSyncKey)}` : "Supabase prêt"
};

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

const dailyTaskTemplates = [
  {
    title: "Contrôle irrigation",
    crops: ["Poivrons", "Piment", "Papayes"],
    note: "Vérifier goutte-à-goutte, pression, fuites, zones sèches et réserve d'eau."
  },
  {
    title: "Observation ravageurs",
    crops: ["Poivrons", "Piment"],
    note: "Surveiller thrips, pucerons, acariens, mouches blanches et dessous des feuilles."
  },
  {
    title: "Aération et chaleur serre",
    crops: ["Poivrons", "Piment"],
    modes: ["Serre"],
    note: "Ouvrir/aérer si nécessaire et surveiller les coups de chaleur."
  },
  {
    title: "Contrôle floraison et fruits",
    crops: ["Poivrons", "Piment", "Papayes"],
    note: "Observer chute de fleurs, fruits abîmés, nouaison et maturité."
  },
  {
    title: "Nettoyage sanitaire",
    crops: ["Poivrons", "Piment", "Papayes"],
    note: "Retirer feuilles ou fruits malades et noter les zones touchées."
  },
  {
    title: "Récolte fruits mûrs",
    crops: ["Poivrons", "Piment", "Papayes"],
    note: "Cueillir les fruits prêts selon les commandes et la maturité."
  },
  {
    title: "Contrôle stress hydrique papaye",
    crops: ["Papayes"],
    note: "Vérifier flétrissement, paillage, humidité du sol et fruits trop mûrs."
  }
];
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
    { id: "fields:form", label: "Ajout et modification" }
  ],
  crops: [
    { id: "crops:list", label: "Base des cultures" },
    { id: "crops:form", label: "Ajout et modification" }
  ],
  tasks: [
    { id: "tasks:base", label: "Base quotidienne" },
    { id: "tasks:filters", label: "Filtres des travaux" },
    { id: "tasks:list", label: "Planning des travaux" },
    { id: "tasks:form", label: "Ajout et modification" }
  ],
  harvests: [
    { id: "harvests:summary", label: "Résumé par parcelle" },
    { id: "harvests:table", label: "Historique des récoltes" },
    { id: "harvests:form", label: "Ajout et modification" }
  ],
  stock: [
    { id: "stock:list", label: "Inventaire" },
    { id: "stock:form", label: "Ajout et modification" }
  ],
  finance: [
    { id: "finance:summary", label: "Résumé financier" },
    { id: "finance:operations", label: "Tableau des opérations" },
    { id: "finance:byCrop", label: "Recettes et dépenses par culture" },
    { id: "finance:form", label: "Ajout et modification" }
  ],
  prices: [
    { id: "prices:filters", label: "Filtre par culture" },
    { id: "prices:chart", label: "Courbe du prix/kg" },
    { id: "prices:sales", label: "Tableau des ventes" },
    { id: "prices:form", label: "Ajout de vente" }
  ],
  team: [
    
    { id: "team:list", label: "Liste de l'équipe" },
    { id: "team:form", label: "Ajout et modification" }
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
      ["status", "Statut", "select", ["À faire", "En cours", "Terminé", "En retard"]]
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
      ["type", "Type", "select", ["Recette", "Dépense"]],
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
      ["profileId", "Profil d accès", "profileSelect"],
      ["login", "Identifiant", "text"],
      ["password", "Mot de passe", "password"]
    ]
  }
};

function loadState() {
  const stored = localStorage.getItem(stateKey);
  if (!stored) return normalizeLoadedState({ ...starterState, dailyTaskTemplates, updatedAt: new Date().toISOString() });
  let parsed = {};
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    localStorage.removeItem(stateKey);
    return normalizeLoadedState({ ...starterState, dailyTaskTemplates, updatedAt: new Date().toISOString() });
  }
  const localTeam = teamWithUserAccounts(parsed.team || starterState.team, parsed.userAccounts || userAccountsFromTeam(parsed.team || starterState.team));
  return {
    ...starterState,
    ...parsed,
    profiles: mergeDefaultProfiles(parsed.profiles),
    fields: parsed.fields || starterState.fields,
    tasks: parsed.tasks || starterState.tasks,
    harvests: parsed.harvests || starterState.harvests,
    crops: parsed.crops || starterState.crops,
    stock: parsed.stock || starterState.stock,
    finance: parsed.finance || starterState.finance,
    team: ensureAdminAccess(mergeDefaultTeam(localTeam)),
    userAccounts: userAccountsFromTeam(localTeam),
    dailyTaskTemplates: normalizeDailyTaskTemplates(parsed.dailyTaskTemplates || dailyTaskTemplates),
    updatedAt: parsed.updatedAt || new Date().toISOString()
  };
}

function saveState(options = {}) {
  const shouldTouch = options.touch !== false;
  const shouldSync = options.sync !== false;
  if (shouldTouch) state.updatedAt = new Date().toISOString();
  state.userAccounts = userAccountsFromTeam(state.team);
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

function ensureAdminAccess(team = state.team) {
  const defaultAdmin = starterState.team.find((person) => person.id === "admin-user");
  const withoutDuplicateAdmin = team.filter((person) => person.id !== "admin-user" && person.login !== "admin");
  return [{ ...defaultAdmin }, ...withoutDuplicateAdmin];
}

function userAccountsFromTeam(team = []) {
  return ensureAdminAccess(team).map((person) => ({
    id: person.id,
    teamId: person.id,
    login: person.login || "",
    password: person.password || "",
    profileId: person.profileId || "terrain-profile"
  }));
}

function stripTeamCredentials(team = []) {
  return team.map(({ login, password, ...person }) => person);
}

function teamWithUserAccounts(team = [], accounts = []) {
  const accountsByTeamId = new Map(accounts.map((account) => [account.teamId || account.id, account]));
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

function hasUsableAccounts(accounts = []) {
  return accounts.some((account) => account.login && account.password);
}

function normalizeDailyTaskTemplates(templates = []) {
  return templates.map((template) => ({
    id: template.id || crypto.randomUUID(),
    title: template.title || "Tâche de base",
    crops: Array.isArray(template.crops) ? template.crops : [],
    modes: Array.isArray(template.modes) ? template.modes : [],
    note: template.note || ""
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

function remoteTableUrl(table) {
  return `${supabaseConfig.url}/rest/v1/${table}`;
}

function syncedCollections() {
  return Object.keys(supabaseConfig.tables);
}

function normalizeLoadedState(data) {
  const remoteTeam = teamWithUserAccounts(data.team || starterState.team, data.userAccounts || userAccountsFromTeam(data.team || starterState.team));
  return {
    ...starterState,
    ...data,
    profiles: mergeDefaultProfiles(data.profiles),
    fields: data.fields || starterState.fields,
    tasks: data.tasks || starterState.tasks,
    harvests: data.harvests || starterState.harvests,
    crops: data.crops || starterState.crops,
    stock: data.stock || starterState.stock,
    finance: data.finance || starterState.finance,
    team: ensureAdminAccess(mergeDefaultTeam(remoteTeam)),
    userAccounts: userAccountsFromTeam(remoteTeam),
    dailyTaskTemplates: normalizeDailyTaskTemplates(data.dailyTaskTemplates || dailyTaskTemplates),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

function setSyncStatus(status, detail) {
  syncState = { status, detail };
  renderConnection();
}

async function fetchRemoteMeta() {
  const response = await fetch(`${remoteTableUrl(supabaseConfig.metaTable)}?id=eq.${encodeURIComponent(supabaseConfig.rowId)}&select=updated_at&limit=1`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Lecture Supabase impossible (${response.status})`);
  const rows = await response.json();
  return rows[0] || null;
}

async function fetchRemoteCollection(collection) {
  const table = supabaseConfig.tables[collection];
  const response = await fetch(`${remoteTableUrl(table)}?select=id,data,updated_at&order=updated_at.asc`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Lecture ${table} impossible (${response.status})`);
  const rows = await response.json();
  return rows.map((row) => ({ id: row.id, ...row.data }));
}

async function fetchRemoteState() {
  const remoteMeta = await fetchRemoteMeta();
  if (!remoteMeta) return null;
  const remoteData = { updatedAt: remoteMeta.updated_at };
  for (const collection of syncedCollections()) {
    remoteData[collection] = await fetchRemoteCollection(collection);
  }
  return { data: remoteData, updated_at: remoteMeta.updated_at };
}

async function replaceRemoteCollection(collection) {
  const table = supabaseConfig.tables[collection];
  const source = collection === "team"
    ? stripTeamCredentials(state.team || [])
    : collection === "userAccounts"
      ? userAccountsFromTeam(state.team || [])
      : state[collection] || [];
  const rows = source.map((item) => ({
    id: item.id,
    data: item,
    updated_at: state.updatedAt || new Date().toISOString()
  }));
  const deleteResponse = await fetch(`${remoteTableUrl(table)}?id=neq.__agripilot_never__`, {
    method: "DELETE",
    headers: supabaseHeaders({ Prefer: "return=minimal" })
  });
  if (!deleteResponse.ok) throw new Error(`Nettoyage ${table} impossible (${deleteResponse.status})`);
  if (!rows.length) return;
  const insertResponse = await fetch(remoteTableUrl(table), {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(rows)
  });
  if (!insertResponse.ok) throw new Error(`Sauvegarde ${table} impossible (${insertResponse.status})`);
}

async function saveRemoteMeta() {
  const payload = {
    id: supabaseConfig.rowId,
    updated_at: state.updatedAt || new Date().toISOString()
  };
  const response = await fetch(remoteTableUrl(supabaseConfig.metaTable), {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Sauvegarde suivi Supabase impossible (${response.status})`);
}

async function pushRemoteState() {
  if (!supabaseEnabled() || !navigator.onLine) return;
  setSyncStatus("syncing", "Synchronisation Supabase...");
  for (const collection of syncedCollections()) {
    await replaceRemoteCollection(collection);
  }
  await saveRemoteMeta();
  markRemoteSynced();
}

function scheduleRemoteSave() {
  if (!supabaseEnabled() || !navigator.onLine) {
    setSyncStatus("offline", "Sauvegardé sur cet appareil, synchro dès le retour Internet");
    return;
  }
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    pushRemoteState().catch((error) => setSyncStatus("error", error.message));
  }, 700);
}

async function syncFromSupabase() {
  if (!supabaseEnabled()) return;
  if (!navigator.onLine) {
    setSyncStatus("offline", "Hors ligne : données conservées sur cet appareil");
    return;
  }
  setSyncStatus("syncing", "Lecture Supabase...");
  try {
    const remoteRow = await fetchRemoteState();
    if (!remoteRow?.data) {
      await pushRemoteState();
      return;
    }
    const remoteData = remoteRow.data;
    const remoteDate = new Date(remoteData.updatedAt || remoteRow.updated_at || 0).getTime();
    const localDate = new Date(state.updatedAt || 0).getTime();
    const localAccounts = userAccountsFromTeam(state.team || []);
    if (!hasUsableAccounts(remoteData.userAccounts) && hasUsableAccounts(localAccounts)) {
      state.userAccounts = localAccounts;
      await pushRemoteState();
      return;
    }
    if (remoteDate > localDate) {
      state = normalizeLoadedState(remoteData);
      saveState({ sync: false, touch: false });
      render();
    } else if (localDate > remoteDate) {
      await pushRemoteState();
      return;
    }
    markRemoteSynced();
  } catch (error) {
    setSyncStatus("error", error.message);
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
  bindEvents();
  registerServiceWorker();
  if (currentUser()) {
    showApp();
  } else {
    showLogin();
  }
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
    const toggleCropButton = event.target.closest("[data-toggle-crop]");
    const dailyTasksButton = event.target.closest("#generateDailyTasksBtn");
    const periodResetButton = event.target.closest("[data-period-reset]");

    if (targetButton) switchView(targetButton.dataset.target);
    if (modalButton) openModal(modalButton.dataset.modal);
    if (editButton) openModal(editButton.dataset.type, editButton.dataset.edit);
    if (deleteButton) deleteRecord(deleteButton.dataset.collection, deleteButton.dataset.delete);
    if (completeButton) completeTask(completeButton.dataset.complete);
    if (toggleCropButton) toggleCrop(toggleCropButton.dataset.toggleCrop);
    if (dailyTasksButton) generateDailyTasks();
    if (periodResetButton) resetPeriodFilter(periodResetButton.dataset.periodReset);
  });
  const handlePeriodInput = (event) => {
    const periodInput = event.target.closest("[data-period-key]");
    if (!periodInput) return;
    updatePeriodFilter(periodInput.dataset.periodKey, periodInput.dataset.periodBound, periodInput.value);
  };
  document.body.addEventListener("input", handlePeriodInput);
  document.body.addEventListener("change", handlePeriodInput);

  document.querySelector("#loginForm").addEventListener("submit", handleLogin);
  document.querySelector("#resetAdminBtn")?.addEventListener("click", resetAdminLogin);
  document.querySelector("#quickTaskBtn").addEventListener("click", () => openModal("task"));
  document.querySelector("#logoutBtn").addEventListener("click", logout);
  document.querySelector("#recordForm").addEventListener("submit", handleFormSubmit);
  document.querySelector("#changePasswordBtn").addEventListener("click", openPasswordModal);
  document.querySelector("#passwordForm").addEventListener("submit", handlePasswordSubmit);
  document.querySelector("#syncNowBtn")?.addEventListener("click", syncFromSupabase);
  window.addEventListener("online", () => {
    renderConnection();
    syncFromSupabase();
  });
  window.addEventListener("offline", renderConnection);
}


function currentUser() {
  return state.team.find((person) => person.id === activeUserId) || null;
}

function showLogin(message = "") {
  document.body.classList.remove("authenticated");
  const loginMessage = document.querySelector("#loginMessage");
  if (loginMessage) {
    loginMessage.textContent = message;
    loginMessage.className = message ? "password-message error" : "password-message";
  }
  const pageTitle = document.querySelector("#pageTitle");
  if (pageTitle) pageTitle.textContent = "Connexion";
}

function showApp() {
  const user = currentUser();
  if (!user) {
    showLogin();
    return;
  }
  activeProfileId = user.profileId || "terrain-profile";
  localStorage.setItem(activeProfileKey, activeProfileId);
  document.body.classList.add("authenticated");
  ensureAllowedView();
  render();
  syncFromSupabase();
}

function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const login = form.elements.login.value.trim();
  const password = form.elements.password.value;
  let user = state.team.find((person) => String(person.login || "").trim() === login && String(person.password || "") === password);
  if (!user && login === "admin" && password === "admin123") {
    state.team = ensureAdminAccess(state.team);
    saveState();
    user = state.team.find((person) => person.id === "admin-user");
  }
  if (!user) {
    showLogin("Identifiant ou mot de passe incorrect.");
    return;
  }
  activeUserId = user.id;
  localStorage.setItem(authUserKey, activeUserId);
  form.reset();
  showApp();
}

function resetAdminLogin() {
  state.team = ensureAdminAccess(state.team);
  state.userAccounts = userAccountsFromTeam(state.team);
  saveState();
  activeUserId = "";
  localStorage.removeItem(authUserKey);
  const form = document.querySelector("#loginForm");
  if (form) {
    form.elements.login.value = "admin";
    form.elements.password.value = "admin123";
  }
  showLogin("Accès admin réinitialisé. Connectez-vous avec admin / admin123.");
}

function logout() {
  activeUserId = "";
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
  const controlled = Boolean(navigator.serviceWorker?.controller);
  const statusDot = document.querySelector("#statusDot");
  const statusText = document.querySelector("#statusText");
  const statusDetail = document.querySelector("#statusDetail");
  const syncButton = document.querySelector("#syncNowBtn");
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
  if (syncButton) syncButton.disabled = !online || syncState.status === "syncing";
}

function renderDashboard() {
  const expenses = state.finance.filter((item) => item.type === "Dépense").reduce((sum, item) => sum + Number(item.amount), 0);
  const revenues = state.finance.filter((item) => item.type === "Recette").reduce((sum, item) => sum + Number(item.amount), 0);
  const lateTasks = state.tasks.filter((task) => task.status === "En retard").length;
  const area = state.fields.reduce((sum, field) => sum + Number(field.area), 0);
  const harvestWeight = state.harvests.filter((harvest) => harvest.unit === "kg").reduce((sum, harvest) => sum + Number(harvest.quantity), 0);
  const kpis = [
    ["Surface suivie", `${area.toFixed(1)} ha`],
    ["Travaux ouverts", state.tasks.filter((task) => task.status !== "Terminé").length],
    ["Récoltes kg", `${harvestWeight} kg`],
    canSeeFinance() ? ["Solde estimé", money(revenues - expenses)] : ["Profil actif", currentProfile().role]
  ];
  document.querySelector("#kpiGrid").innerHTML = kpis.map(([label, value]) => `
    <article class="kpi"><span>${label}</span><strong>${value}</strong></article>
  `).join("");
  document.querySelector("#priorityTasks").innerHTML = state.tasks.slice(0, 4).map(taskItem).join("");
  document.querySelector("#fieldStrip").innerHTML = state.fields.slice(0, 3).map(fieldMini).join("");
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
  document.querySelector("#revenueDetailsBtn").hidden = !canSeeFinance();
  document.querySelector("#revenueCard").innerHTML = canSeeFinance()
    ? `
      <strong>${money(revenues)}</strong>
      <span>Revenus enregistrés</span>
      <div class="summary-line"><span>Dépenses</span><strong>${money(expenses)}</strong></div>
      <div class="summary-line"><span>Solde</span><strong>${money(revenues - expenses)}</strong></div>
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
      <span class="muted">${field.crop} · ${field.area} ha · ${field.mode || "Plein champ"}</span>
      <div class="record-meta">
        <span class="pill">${field.stage}</span>
        <span class="pill">${field.mode || "Plein champ"}</span>
        <span class="pill">${field.health}% santé</span>
      </div>
      <div class="progress"><span style="width:${Math.min(field.health, 100)}%"></span></div>
      <p class="field-update">${field.update || "Aucune mise à jour enregistrée pour cette parcelle."}</p>
      <div class="field-harvests">
        <strong>${harvestSummaryForField(field.name, harvests)}</strong>
        <span class="muted">récolté sur cette parcelle</span>
      </div>
      <div class="card-actions">
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
  const tasks = activeTaskFilter === "Tous" ? periodTasks : periodTasks.filter((task) => task.status === activeTaskFilter);
  document.querySelector("#tasksTable").innerHTML = tasks.map((task) => `
    <tr>
      <td><strong>${task.title}</strong></td>
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
    <article class="daily-task-card">
      <strong>${template.title}</strong>
      <span class="muted">${template.crops.length ? template.crops.join(" · ") : "Toutes les cultures"}${template.modes?.length ? ` · ${template.modes.join(" · ")}` : " · Tous modes"}</span>
      <p>${template.note}</p>
      <div class="card-actions daily-task-actions">
        <button data-edit="${template.id}" data-type="baseTask">Modifier</button>
        <button data-delete="${template.id}" data-collection="dailyTaskTemplates">Supprimer</button>
      </div>
    </article>
  `).join("") || `<p class="muted">Aucune tâche de base enregistrée.</p>`;
}

function dateInPeriod(dateValue, key) {
  if (!dateValue) return true;
  const filter = periodFilters[key] || {};
  return (!filter.from || dateValue >= filter.from) && (!filter.to || dateValue <= filter.to);
}

function updatePeriodFilter(key, bound, value) {
  if (!periodFilters[key]) return;
  periodFilters[key][bound] = value;
  renderPeriodView(key);
}

function resetPeriodFilter(key) {
  if (!periodFilters[key]) return;
  periodFilters[key] = { from: "", to: "" };
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

function dailyTasksForField(field) {
  if (!isCropActive(field.crop)) return [];
  return (state.dailyTaskTemplates || [])
    .filter((template) => !template.crops?.length || template.crops.includes(field.crop))
    .filter((template) => !template.modes?.length || template.modes.includes(field.mode || "Plein champ"))
    .map((template) => ({
      title: `${template.title} - ${field.name}`,
      field: field.name,
      owner: state.team[0]?.name || "À assigner",
      due: currentDateValue(),
      status: "À faire"
    }));
}

function generateDailyTasks() {
  const due = currentDateValue();
  const existingKeys = new Set(state.tasks.map((task) => `${task.title}|${task.field}|${task.due}`));
  const tasksToAdd = state.fields.flatMap(dailyTasksForField).filter((task) => {
    const key = `${task.title}|${task.field}|${due}`;
    return !existingKeys.has(key);
  });
  if (!tasksToAdd.length) {
    const button = document.querySelector("#generateDailyTasksBtn");
    if (button) {
      button.textContent = "Déjà créé pour aujourd'hui";
      window.setTimeout(() => { button.textContent = "Créer les tâches du jour"; }, 1800);
    }
    return;
  }
  state.tasks = tasksToAdd.map((task) => ({ id: crypto.randomUUID(), ...task })).concat(state.tasks);
  activeTaskFilter = "Tous";
  saveState();
  render();
}
function renderHarvests() {
  const harvests = state.harvests.filter((harvest) => dateInPeriod(harvest.date, "harvests"));
  document.querySelector("#harvestSummary").innerHTML = state.fields.map((field) => `
    <div class="summary-line">
      <span>${field.name}</span>
      <strong>${harvestSummaryForField(field.name, harvests)}</strong>
    </div>
  `).join("");
  document.querySelector("#harvestsTable").innerHTML = harvests.map((harvest) => `
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
  const financeRecords = state.finance.filter((item) => dateInPeriod(item.date, "finance"));
  const revenue = financeRecords.filter((item) => item.type === "Recette").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = financeRecords.filter((item) => item.type !== "Recette").reduce((sum, item) => sum + Number(item.amount), 0);
  document.querySelector("#financeSummary").innerHTML = [
    ["Recettes", money(revenue)],
    ["Dépenses", money(expense)],
    ["Solde", money(revenue - expense)]
  ].map(([label, value]) => `<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#financeTable").innerHTML = financeRecords.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.label}</td>
      <td>${item.crop || "Non affecté"}</td>
      <td>${item.type}</td>
      <td>${money(Number(item.amount))}</td>
      <td><button class="text-button" data-edit="${item.id}" data-type="finance">Modifier</button><button class="text-button" data-delete="${item.id}" data-collection="finance">Supprimer</button></td>
    </tr>
  `).join("");
  document.querySelector("#financeByCropTable").innerHTML = financeByCrop(financeRecords).map((item) => `
    <tr>
      <td><strong>${item.crop}</strong></td>
      <td>${money(item.revenue)}</td>
      <td>${money(item.expense)}</td>
      <td><strong>${money(item.revenue - item.expense)}</strong></td>
    </tr>
  `).join("");
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
  const filteredSales = activePriceCrop === "Toutes" ? datedSales : datedSales.filter((sale) => sale.crop === activePriceCrop);
  document.querySelector("#priceSummary").innerHTML = priceSummary(filteredSales);
  document.querySelector("#priceChart").innerHTML = renderPriceChart(filteredSales);
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
  document.querySelector("#teamGrid").innerHTML = state.team.map((person) => `
    <article class="record-card">
      <strong>${person.name}</strong>
      <span class="muted">${person.role}</span>
      <div class="record-meta">
        <span class="pill">${person.phone}</span>
        ${canManageProfiles() ? `<span class="pill">${profileName(person.profileId)}</span>` : ""}
      </div>
      ${canManageProfiles() ? `<p class="field-update">Identifiant : ${person.login || "Non défini"}</p>` : ""}
      <div class="card-actions">
        <button data-edit="${person.id}" data-type="team">Modifier</button>
        ${person.id === "admin-user" || person.id === activeUserId ? "" : `<button data-delete="${person.id}" data-collection="team">Supprimer</button>`}
      </div>
    </article>
  `).join("");
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
      return { ...task, status };
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

function harvestSummaryForField(fieldName, sourceHarvests = state.harvests) {
  const harvests = sourceHarvests.filter((harvest) => harvest.field === fieldName);
  if (!harvests.length) return "0";
  const totals = harvests.reduce((summary, harvest) => {
    summary[harvest.unit] = (summary[harvest.unit] || 0) + Number(harvest.quantity);
    return summary;
  }, {});
  return Object.entries(totals).map(([unit, quantity]) => `${quantity} ${unit}`).join(" + ");
}

function harvestByActiveCrop() {
  const activeCrops = [...new Set(state.fields.map((field) => field.crop).filter(isCropActive))];
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
      fields: state.fields.filter((field) => field.crop === crop).length,
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

function financeByCrop(records = state.finance) {
  const cropNames = [...new Set([...state.crops.map((crop) => crop.name), ...records.map((item) => item.crop || "Non affecté")])];
  return cropNames.map((crop) => {
    const cropRecords = records.filter((item) => (item.crop || "Non affecté") === crop);
    return {
      crop,
      revenue: cropRecords.filter((item) => item.type === "Recette").reduce((sum, item) => sum + Number(item.amount), 0),
      expense: cropRecords.filter((item) => item.type !== "Recette").reduce((sum, item) => sum + Number(item.amount), 0)
    };
  }).filter((item) => item.revenue || item.expense || item.crop !== "Non affecté");
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

function profileName(profileId) {
  return state.profiles.find((profile) => profile.id === profileId)?.name || "Profil non défini";
}

function profilePages(profile) {
  if (profile.role === "Admin") return defaultPagesByRole.Admin;
  return Array.isArray(profile.pages) && profile.pages.length ? profile.pages : defaultPagesByRole[profile.role] || ["dashboard"];
}

function allSectionsForPages(pages) {
  return pages.flatMap((page) => (accessSections[page] || []).map((section) => section.id));
}

function profileSections(profile) {
  const pages = profilePages(profile);
  if (profile.role === "Admin") return allSectionsForPages(pages);
  if (Array.isArray(profile.sections)) return profile.sections;
  return allSectionsForPages(pages);
}

function canAccessSection(sectionId) {
  const profile = currentProfile();
  if (profile.role === "Admin") return true;
  return profileSections(profile).includes(sectionId);
}

function pageLabel(pageId) {
  return navItems.find(([id]) => id === pageId)?.[1] || pageId;
}

function staffOptions() {
  return state.team.map((person) => person.name);
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
    ["#revenueCard", "dashboard:revenues"],
    ["#revenueDetailsBtn", "dashboard:revenues"],
    ["#fieldsGrid", "fields:list"],
    ['[data-modal="field"]', "fields:form"],
    ["#cropsGrid", "crops:list"],
    ['[data-modal="crop"]', "crops:form"],
    ["#tasksView .daily-task-panel", "tasks:base"],
    ["#dailyTaskBase", "tasks:base"],
    ["#generateDailyTasksBtn", "tasks:form"],
    ['[data-modal="baseTask"]', "tasks:form"],
    ["#taskPeriodFilters", "tasks:filters"],
    ["#taskFilters", "tasks:filters"],
    ["#tasksTable", "tasks:list"],
    ['[data-modal="task"]', "tasks:form"],
    ["#quickTaskBtn", "tasks:form"],
    ["#harvestSummary", "harvests:summary"],
    ["#harvestPeriodFilters", "harvests:table"],
    ["#harvestsTable", "harvests:table"],
    ['[data-modal="harvest"]', "harvests:form"],
    ["#stockGrid", "stock:list"],
    ['[data-modal="stock"]', "stock:form"],
    ["#financeSummary", "finance:summary"],
    ["#financePeriodFilters", "finance:operations"],
    ["#financeTable", "finance:operations"],
    ["#financeByCropTable", "finance:byCrop"],
    ['#financeView [data-modal="finance"]', "finance:form"],
    ["#priceFilters", "prices:filters"],
    ["#pricePeriodFilters", "prices:filters"],
    ["#priceSummary", "prices:filters"],
    ["#priceChart", "prices:chart"],
    ["#priceSalesTable", "prices:sales"],
    ['#pricesView [data-modal="sale"]', "prices:form"],
    ['[data-edit][data-type="field"]', "fields:form"],
    ['[data-delete][data-collection="fields"]', "fields:form"],
    ['[data-edit][data-type="crop"]', "crops:form"],
    ['[data-toggle-crop]', "crops:form"],
    ['[data-delete][data-collection="crops"]', "crops:form"],
    ['[data-edit][data-type="task"]', "tasks:form"],
    ['[data-edit][data-type="baseTask"]', "tasks:form"],
    ['[data-delete][data-collection="tasks"]', "tasks:form"],
    ['[data-delete][data-collection="dailyTaskTemplates"]', "tasks:form"],
    ['[data-complete]', "tasks:form"],
    ['[data-edit][data-type="harvest"]', "harvests:form"],
    ['[data-delete][data-collection="harvests"]', "harvests:form"],
    ['[data-edit][data-type="stock"]', "stock:form"],
    ['[data-delete][data-collection="stock"]', "stock:form"],
    ['[data-edit][data-type="finance"]', "finance:form"],
    ['[data-delete][data-collection="finance"]', "finance:form"],
    ['[data-edit][data-type="team"]', "team:form"],
    ['[data-delete][data-collection="team"]', "team:form"],
    ["#teamGrid", "team:list"],
    ['[data-modal="team"]', "team:form"]
  ];
  rules.forEach(([selector, sectionId]) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.classList.toggle("access-hidden", !canAccessSection(sectionId));
    });
  });
}

function renderProfileSelect() {
  const select = document.querySelector("#profileSelect");
  if (!select) return;
  if (!state.profiles.some((profile) => profile.id === activeProfileId)) {
    activeProfileId = state.profiles[0]?.id || "admin-profile";
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
  const config = modalConfig[modalType];
  const record = id ? state[config.collection].find((item) => item.id === id) : null;
  const saleDefaults = saleShortcut ? { type: "Recette", isSale: "on", saleUnit: "kg" } : {};
  editingRecord = record ? { collection: config.collection, id } : null;
  document.querySelector("#modalTitle").textContent = saleShortcut ? "Ajouter une vente" : record ? config.title.replace("Ajouter", "Modifier") : config.title;
  document.querySelector("#modalFields").innerHTML = config.fields.map(([name, label, typeName, options]) => {
    const value = record?.[name] ?? saleDefaults[name] ?? "";
    if (modalType === "team" && ["profileId", "login", "password"].includes(name) && !canManageProfiles()) return "";
    if (saleShortcut && name === "type") return `<input type="hidden" name="type" value="Recette" />`;
    if (saleShortcut && name === "isSale") return `<input type="hidden" name="isSale" value="on" />`;
    const safeValue = escapeHtml(value);
    if (typeName === "pagesSelect") {
      const selectedPages = Array.isArray(value) && value.length ? value : defaultPagesByRole[record?.role || "Terrain"] || ["dashboard"];
      return `<fieldset class="wide-field checkbox-group" id="profilePageAccess"><legend>${label}</legend>${accessPages.map((page) => `<label><input type="checkbox" name="pages" value="${page.id}" ${selectedPages.includes(page.id) ? "checked" : ""} />${page.label}</label>`).join("")}</fieldset>`;
    }
    if (typeName === "sectionsSelect") {
      const selectedPages = Array.isArray(record?.pages) && record.pages.length ? record.pages : defaultPagesByRole[record?.role || "Terrain"] || ["dashboard"];
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
      return `<label>${label}<select name="${name}" required>${options.map((option) => optionTag(option.label, value, option.value)).join("")}</select></label>`;
    }
    if (typeName === "fieldSelect") {
      const fieldOptions = state.fields.map((field) => field.name);
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
    if (typeName === "textarea") {
      return `<label class="wide-field">${label}<textarea name="${name}" rows="4" placeholder="Exemple : feuilles jaunies sur 2 lignes, arrosage renforcé, plants en bonne reprise...">${safeValue}</textarea></label>`;
    }
    if (typeName === "checkbox") {
      const checked = modalType === "crop" && name === "active" ? record?.active !== false : Boolean(value);
      return `<label class="checkbox-field">${label}<input name="${name}" type="checkbox" ${checked ? "checked" : ""} /></label>`;
    }
    if (typeName === "select") {
      const saleFieldClass = name === "saleUnit" ? "sale-field" : "";
      return `<label class="${saleFieldClass}">${label}<select name="${name}" ${name === "saleUnit" ? "" : "required"}>${options.map((option) => optionTag(option, value)).join("")}</select></label>`;
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
  return `<fieldset class="checkbox-group section-access-group"><legend>${label}</legend>${visiblePages.map((page) => {
    const sections = accessSections[page] || [];
    return `<div class="section-access-page"><strong>${pageLabel(page)}</strong>${sections.map((section) => `<label><input type="checkbox" name="sections" value="${section.id}" ${selectedSections.includes(section.id) ? "checked" : ""} />${section.label}</label>`).join("")}</div>`;
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
  const isSale = form.elements.type?.value === "Recette";
  const saleChecked = form.elements.isSale?.type === "hidden" ? form.elements.isSale.value === "on" : Boolean(form.elements.isSale?.checked);
  const hasCrop = form.elements.crop?.value && form.elements.crop.value !== "Non affecté";
  const showSaleCheckbox = isSale && hasCrop;
  const saleCheckboxLabel = form.elements.isSale?.closest("label");
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
  const quantity = Number(form.elements.saleQuantity?.value || 0);
  const salePrice = Number(form.elements.salePrice?.value || 0);
  const unit = form.elements.saleUnit?.value || "unité";
  const kgEquivalentLabel = form.elements.saleKgEquivalent?.closest("label");
  const needsKgEquivalent = !["kg", "tonnes"].includes(unit);
  if (kgEquivalentLabel) {
    kgEquivalentLabel.classList.toggle("sale-fields-hidden", !showSaleFields || !needsKgEquivalent);
    form.elements.saleKgEquivalent.disabled = !showSaleFields || !needsKgEquivalent;
  }
  if (quantity > 0 && salePrice > 0) {
    const calculatedAmount = Math.round(quantity * salePrice);
    form.elements.amount.value = calculatedAmount;
    const kgQuantity = unit === "kg" ? quantity : unit === "tonnes" ? quantity * 1000 : Number(form.elements.saleKgEquivalent?.value || 0);
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
  if (modalType === "crop") {
    data.active = Boolean(event.currentTarget.elements.active?.checked);
  }
  if (modalType === "task") data.status = taskStatus(data);
  if (data.health) data.health = Number.parseInt(data.health, 10);
  if (modalType === "finance") {
    data.isSale = event.currentTarget.elements.isSale?.type === "hidden" ? event.currentTarget.elements.isSale.value : event.currentTarget.elements.isSale?.checked ? "on" : "";
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
  if (editingRecord) {
    state[config.collection] = state[config.collection].map((item) =>
      item.id === editingRecord.id ? { ...item, ...data } : item
    );
  } else {
    state[config.collection].unshift({ id: crypto.randomUUID(), ...data });
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
  form.reset();
  message.textContent = "";
  message.className = "wide-field password-message";
  document.querySelector("#passwordModal").showModal();
}

function handlePasswordSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#passwordMessage");
  const login = form.elements.login.value.trim();
  const currentPassword = form.elements.currentPassword.value;
  const newPassword = form.elements.newPassword.value;
  const confirmPassword = form.elements.confirmPassword.value;
  const person = currentUser();
  if (!person || String(person.login || "").trim() !== login || String(person.password || "") !== currentPassword) {
    showPasswordMessage("Identifiant ou ancien mot de passe incorrect.", "error");
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
    member.id === person.id ? { ...member, password: newPassword } : member
  );
  saveState();
  showPasswordMessage("Mot de passe mis à jour.", "success");
  window.setTimeout(() => {
    form.reset();
    document.querySelector("#passwordModal").close();
  }, 800);
}

function showPasswordMessage(text, type) {
  const message = document.querySelector("#passwordMessage");
  message.textContent = text;
  message.className = `wide-field password-message ${type}`;
}

function deleteRecord(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  if (collection === "profiles" && activeProfileId === id) {
    activeProfileId = "admin-profile";
    localStorage.setItem(activeProfileKey, activeProfileId);
  }
  saveState();
  render();
}

function completeTask(id) {
  state.tasks = state.tasks.map((task) => task.id === id ? { ...task, status: "Terminé" } : task);
  saveState();
  render();
}

function toggleCrop(id) {
  state.crops = state.crops.map((crop) =>
    crop.id === id ? { ...crop, active: crop.active === false } : crop
  );
  saveState();
  render();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then(() => {
    renderConnection();
  }).catch(() => {
    renderConnection();
  });
  navigator.serviceWorker.addEventListener("controllerchange", renderConnection);
}

init();

