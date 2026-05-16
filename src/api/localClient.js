const DB_KEY = 'atlaslift_local_db_v1';
const USER_KEY = 'atlaslift_local_user_v1';

const ENTITY_KEYS = [
  'UserProfile',
  'MealLog',
  'SavedMeal',
  'WorkoutProgram',
  'ProgramDay',
  'ProgramExercise',
  'WorkoutSession',
  'WorkoutSet',
  'HydrationEntry',
  'BodyMetric',
  'Exercise'
];

const defaultExercises = [
  { name: 'Back Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Pull-Up', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { name: 'Dumbbell Incline Press', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Machine' }
];

const nowIso = () => new Date().toISOString();

const clone = (value) => JSON.parse(JSON.stringify(value));

const readDb = () => {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const empty = Object.fromEntries(ENTITY_KEYS.map((key) => [key, []]));
    const seeded = {
      ...empty,
      Exercise: defaultExercises.map((item, idx) => ({
        id: `ex_${idx + 1}`,
        ...item,
        created_date: nowIso(),
        updated_date: nowIso()
      }))
    };
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    for (const key of ENTITY_KEYS) {
      if (!Array.isArray(parsed[key])) parsed[key] = [];
    }
    return parsed;
  } catch {
    localStorage.removeItem(DB_KEY);
    return readDb();
  }
};

const writeDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const makeId = (name) => `${name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const sortRecords = (rows, field) => {
  if (!field) return rows;
  const descending = field.startsWith('-');
  const key = descending ? field.slice(1) : field;
  return [...rows].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    return av > bv ? (descending ? -1 : 1) : (descending ? 1 : -1);
  });
};

const withEntity = (entityName) => ({
  async list(sortField, limit) {
    const db = readDb();
    let rows = sortRecords(db[entityName], sortField);
    if (typeof limit === 'number') rows = rows.slice(0, limit);
    return clone(rows);
  },
  async filter(where) {
    const db = readDb();
    const rows = db[entityName].filter((row) =>
      Object.entries(where || {}).every(([k, v]) => row?.[k] === v)
    );
    return clone(rows);
  },
  async create(data) {
    const db = readDb();
    const created = {
      id: makeId(entityName),
      created_date: nowIso(),
      updated_date: nowIso(),
      ...data
    };
    db[entityName].push(created);
    writeDb(db);
    return clone(created);
  },
  async bulkCreate(items) {
    const db = readDb();
    const created = (items || []).map((item) => ({
      id: makeId(entityName),
      created_date: nowIso(),
      updated_date: nowIso(),
      ...item
    }));
    db[entityName].push(...created);
    writeDb(db);
    return clone(created);
  },
  async update(id, patch) {
    const db = readDb();
    const idx = db[entityName].findIndex((row) => row.id === id);
    if (idx === -1) throw new Error(`Record not found: ${entityName}/${id}`);
    db[entityName][idx] = {
      ...db[entityName][idx],
      ...patch,
      updated_date: nowIso()
    };
    writeDb(db);
    return clone(db[entityName][idx]);
  },
  async delete(id) {
    const db = readDb();
    const before = db[entityName].length;
    db[entityName] = db[entityName].filter((row) => row.id !== id);
    writeDb(db);
    return { success: db[entityName].length !== before };
  }
});

const getLocalUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  const user = {
    id: 'local_user_1',
    email: 'local@atlaslift.app',
    name: 'Local User'
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const appClient = {
  auth: {
    async me() {
      return clone(getLocalUser());
    },
    logout() {
      localStorage.removeItem(USER_KEY);
    },
    redirectToLogin() {
      // Local mode has no remote login flow.
    }
  },
  entities: Object.fromEntries(ENTITY_KEYS.map((name) => [name, withEntity(name)]))
};
