const STORAGE_KEY = "notewise:v1";

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { items: [], notes: [] };
  try {
    const parsed = JSON.parse(raw);
    return { items: parsed.items || [], notes: parsed.notes || [] };
  } catch {
    return { items: [], notes: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const store = {
  data: loadData(),

  addItem({ title, type, author, genre, status }) {
    const now = new Date().toISOString();
    const item = {
      id: makeId(),
      title: title.trim(),
      type,
      author: author.trim(),
      genre: genre.trim(),
      status,
      rating: null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.items.unshift(item);
    saveData(this.data);
    return item;
  },

  updateItem(id, patch) {
    const item = this.data.items.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, patch, { updatedAt: new Date().toISOString() });
    if (item.status !== "finished") item.rating = null;
    saveData(this.data);
    return item;
  },

  getItem(id) {
    return this.data.items.find((i) => i.id === id) || null;
  },

  addNote({ itemId, text, tag }) {
    const now = new Date().toISOString();
    const note = {
      id: makeId(),
      itemId,
      text: text.trim(),
      tag,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    this.data.notes.unshift(note);
    saveData(this.data);
    return note;
  },

  updateNote(id, patch) {
    const note = this.data.notes.find((n) => n.id === id);
    if (!note) return null;
    Object.assign(note, patch, { updatedAt: new Date().toISOString() });
    saveData(this.data);
    return note;
  },

  deleteNote(id) {
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    saveData(this.data);
  },

  notesForItem(itemId) {
    return this.data.notes
      .filter((n) => n.itemId === itemId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  allGenres() {
    const set = new Set(this.data.items.map((i) => i.genre).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },

  exportBlob() {
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), items: this.data.items, notes: this.data.notes },
      null,
      2
    );
  },
};
