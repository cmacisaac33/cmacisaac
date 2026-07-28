import { store } from "./storage.js";

const GENRE_SUGGESTIONS = ["Business", "Health", "Fiction", "Mindset"];
const TAG_LABELS = { quote: "Quote", takeaway: "Key Takeaway", question: "Question", action: "Action Item" };

const state = {
  view: "library",
  currentItemId: null,
  resurfaceNoteId: null,
  filters: { type: "all", status: "all", genre: "all" },
  search: "",
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function setupSegmented(container, onChange) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".segmented-btn");
    if (!btn) return;
    container.querySelectorAll(".segmented-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    container.dataset.value = btn.dataset.value;
    onChange(btn.dataset.value);
  });
}

function setSegmentedValue(container, value) {
  container.dataset.value = value;
  container.querySelectorAll(".segmented-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.value === value);
  });
}

// ---------- Navigation ----------

function navigateTo(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((v) => {
    v.hidden = v.dataset.view !== view;
  });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === view);
  });
  $("bottom-nav").hidden = view === "add" || view === "detail";
  if (view === "library") renderLibrary();
  if (view === "resurface") renderResurface(true);
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.nav));
});

// ---------- Library ----------

function populateGenreFilterOptions() {
  const select = $("filter-genre");
  const current = select.value;
  const genres = store.allGenres();
  select.innerHTML = '<option value="all">All genres</option>' +
    genres.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
  if (genres.includes(current)) select.value = current;
}

function itemMatchesSearch(item, query) {
  if (!query) return { matches: true, viaNote: false };
  const q = query.toLowerCase();
  if (item.title.toLowerCase().includes(q)) return { matches: true, viaNote: false };
  const notes = store.notesForItem(item.id);
  const viaNote = notes.some((n) => n.text.toLowerCase().includes(q));
  return { matches: viaNote, viaNote };
}

function renderLibrary() {
  populateGenreFilterOptions();

  const { type, status, genre } = state.filters;
  const query = state.search.trim();

  const rows = store.data.items
    .map((item) => ({ item, search: itemMatchesSearch(item, query) }))
    .filter(({ item, search }) => {
      if (type !== "all" && item.type !== type) return false;
      if (status !== "all" && item.status !== status) return false;
      if (genre !== "all" && item.genre !== genre) return false;
      return search.matches;
    });

  const list = $("item-list");
  $("library-empty").hidden = rows.length > 0;
  list.innerHTML = rows
    .map(({ item, search }) => {
      const typeLabel = item.type === "book" ? "Book" : "Podcast";
      const statusLabel = item.status === "finished" ? "Finished" : "In progress";
      return `
        <div class="item-card" data-id="${item.id}">
          <div class="item-card-top">
            <div>
              <div class="item-title">${escapeHtml(item.title)}</div>
              ${item.author ? `<div class="item-author">${escapeHtml(item.author)}</div>` : ""}
            </div>
          </div>
          <div class="badge-row">
            <span class="badge">${typeLabel}</span>
            ${item.genre ? `<span class="badge">${escapeHtml(item.genre)}</span>` : ""}
            <span class="badge status-${item.status}">${statusLabel}</span>
            ${search.viaNote ? `<span class="badge match-note">matched in a note</span>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

$("item-list").addEventListener("click", (e) => {
  const card = e.target.closest(".item-card");
  if (!card) return;
  openDetail(card.dataset.id);
});

$("search-input").addEventListener("input", (e) => {
  state.search = e.target.value;
  renderLibrary();
});

["filter-type", "filter-status", "filter-genre"].forEach((id) => {
  $(id).addEventListener("change", () => {
    state.filters.type = $("filter-type").value;
    state.filters.status = $("filter-status").value;
    state.filters.genre = $("filter-genre").value;
    renderLibrary();
  });
});

// ---------- Add Item ----------

$("btn-open-add").addEventListener("click", () => {
  $("add-form").reset();
  setSegmentedValue($("add-type"), "book");
  setSegmentedValue($("add-status"), "in_progress");
  const genreOptions = $("genre-options");
  const genres = Array.from(new Set([...GENRE_SUGGESTIONS, ...store.allGenres()]));
  genreOptions.innerHTML = genres.map((g) => `<option value="${escapeHtml(g)}"></option>`).join("");
  navigateTo("add");
});

$("btn-add-back").addEventListener("click", () => navigateTo("library"));

setupSegmented($("add-type"), () => {});
setupSegmented($("add-status"), () => {});

$("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("add-title").value.trim();
  if (!title) return;
  const item = store.addItem({
    title,
    type: $("add-type").dataset.value,
    author: $("add-author").value,
    genre: $("add-genre").value,
    status: $("add-status").dataset.value,
  });
  openDetail(item.id);
});

// ---------- Item Detail ----------

setupSegmented($("detail-status"), (value) => {
  store.updateItem(state.currentItemId, { status: value });
  renderDetail();
});

setupSegmented($("note-tag"), () => {});

function renderDetail() {
  const item = store.getItem(state.currentItemId);
  if (!item) {
    navigateTo("library");
    return;
  }

  $("detail-title").textContent = item.title;
  $("detail-author").textContent = item.author || "";
  $("detail-author").hidden = !item.author;
  $("detail-genre").textContent = item.genre || "No genre";
  $("detail-type").textContent = item.type === "book" ? "Book" : "Podcast";
  setSegmentedValue($("detail-status"), item.status);

  const finished = item.status === "finished";
  $("rating-row").hidden = !finished;
  $("rating-hint").hidden = finished;
  renderStars(item.rating || 0);

  const notes = store.notesForItem(item.id);
  $("notes-empty").hidden = notes.length > 0;
  $("notes-list").innerHTML = notes.map(renderNoteCard).join("");
}

function renderStars(rating) {
  document.querySelectorAll("#detail-stars .star").forEach((star) => {
    star.classList.toggle("filled", Number(star.dataset.star) <= rating);
  });
}

$("detail-stars").addEventListener("click", (e) => {
  const star = e.target.closest(".star");
  if (!star) return;
  const item = store.getItem(state.currentItemId);
  if (!item || item.status !== "finished") return;
  const value = Number(star.dataset.star);
  const newRating = item.rating === value ? null : value;
  store.updateItem(item.id, { rating: newRating });
  renderStars(newRating || 0);
});

function renderNoteCard(note) {
  return `
    <div class="note-card" data-id="${note.id}">
      <div class="note-card-top">
        <span class="badge note-tag-${note.tag}">${TAG_LABELS[note.tag]}</span>
        <div class="note-actions">
          <button class="btn-fav ${note.favorite ? "favorited" : ""}" data-action="favorite">${note.favorite ? "★ Starred" : "☆ Star"}</button>
          <button data-action="edit">Edit</button>
          <button class="danger" data-action="delete">Delete</button>
        </div>
      </div>
      <p class="note-text">${escapeHtml(note.text)}</p>
      <div class="note-meta"><span>${formatDate(note.createdAt)}</span></div>
    </div>`;
}

$("btn-detail-back").addEventListener("click", () => navigateTo("library"));

function openDetail(itemId) {
  state.currentItemId = itemId;
  $("note-text").value = "";
  setSegmentedValue($("note-tag"), "takeaway");
  navigateTo("detail");
  renderDetail();
}

$("btn-add-note").addEventListener("click", () => {
  const text = $("note-text").value.trim();
  if (!text) return;
  store.addNote({ itemId: state.currentItemId, text, tag: $("note-tag").dataset.value });
  $("note-text").value = "";
  renderDetail();
});

$("notes-list").addEventListener("click", (e) => {
  const card = e.target.closest(".note-card");
  if (!card) return;
  const noteId = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === "favorite") {
    const note = store.data.notes.find((n) => n.id === noteId);
    store.updateNote(noteId, { favorite: !note.favorite });
    renderDetail();
  } else if (action === "delete") {
    if (confirm("Delete this note? This can't be undone.")) {
      store.deleteNote(noteId);
      renderDetail();
    }
  } else if (action === "edit") {
    startEditNote(card, noteId);
  }
});

function startEditNote(card, noteId) {
  const note = store.data.notes.find((n) => n.id === noteId);
  const tags = Object.entries(TAG_LABELS)
    .map(([value, label]) => `<button type="button" class="segmented-btn ${value === note.tag ? "active" : ""}" data-value="${value}">${label}</button>`)
    .join("");
  card.innerHTML = `
    <div class="segmented segmented-tags edit-tag" data-value="${note.tag}">${tags}</div>
    <textarea class="edit-text" rows="2">${escapeHtml(note.text)}</textarea>
    <div class="note-actions">
      <button data-action="save-edit">Save</button>
      <button data-action="cancel-edit">Cancel</button>
    </div>`;

  const tagContainer = card.querySelector(".edit-tag");
  setupSegmented(tagContainer, () => {});

  card.querySelector("[data-action='save-edit']").addEventListener("click", () => {
    const text = card.querySelector(".edit-text").value.trim();
    if (!text) return;
    store.updateNote(noteId, { text, tag: tagContainer.dataset.value });
    renderDetail();
  });
  card.querySelector("[data-action='cancel-edit']").addEventListener("click", () => renderDetail());
}

// ---------- Resurface ----------

function renderResurface(pickNew) {
  const notes = store.data.notes;
  if (notes.length === 0) {
    $("resurface-card").hidden = true;
    $("resurface-empty").hidden = false;
    return;
  }
  $("resurface-empty").hidden = true;
  $("resurface-card").hidden = false;

  if (pickNew || !state.resurfaceNoteId) {
    let candidates = notes;
    if (notes.length > 1) candidates = notes.filter((n) => n.id !== state.resurfaceNoteId);
    state.resurfaceNoteId = candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  const note = notes.find((n) => n.id === state.resurfaceNoteId);
  const item = store.getItem(note.itemId);
  $("resurface-tag").textContent = TAG_LABELS[note.tag];
  $("resurface-tag").className = `badge note-tag-${note.tag}`;
  $("resurface-text").textContent = note.text;
  $("resurface-source").textContent = item ? `From "${item.title}" (${item.type === "book" ? "Book" : "Podcast"})` : "Source deleted";
}

$("btn-resurface-another").addEventListener("click", () => renderResurface(true));

// ---------- Settings / Export ----------

$("btn-export").addEventListener("click", () => {
  const blob = new Blob([store.exportBlob()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `notewise-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---------- Init ----------

navigateTo("library");
