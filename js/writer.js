class Note {
  constructor({ id, text = "", time = new Date().toLocaleTimeString() } = {}) {
    this.id = id ?? Note.nextId();
    this.text = text;
    this.time = time;
  }
  static fromJSON(obj) {
    return new Note({ id: obj.id, text: obj.text, time: obj.time });
  }

  static nextId() {
    return Note._counter++;
  }
}
Note._counter = JSON.parse(localStorage.getItem("notes") || "[]").length || 0;

class NotesApp {
  constructor(strings) {
    this.strings = strings || {};

    this.titleEl = document.getElementById("titleText");
    this.lastSavedLabelEl = document.getElementById("lastSavedLabel");
    this.lastSavedEl = document.getElementById("lastSaved");
    this.addBtn = document.getElementById("addNoteBtn");
    this.notesList = document.getElementById("notesList");
    this.placeholder = document.getElementById("placeholder");

    this.notes = this.loadNotes();
    this.changes = false;
    this.editorOpen = false;

    this.applyStrings();

    this.addBtn.addEventListener("click", () => this.openEditor());
    this.notesList.addEventListener("click", (e) => this.handleListClick(e));
    window.addEventListener("storage", (e) => this.handleStorageEvent(e));

    this.renderNotes();
    this.lastSavedEl.textContent = localStorage.getItem("lastSaved") || "—";

    this.debouncedPersist = this.debounce(() => this.savePersistNotes(), 600);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.changes)
        this.savePersistNotes();
    });
    window.addEventListener("beforeunload", () => {
      if (this.changes) this.savePersistNotes();
    });
  }

  debounce(fn, wait = 500) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  applyStrings() {
    const s = this.strings;
    this.titleEl.textContent = s.title;

    this.lastSavedLabelEl.textContent = s.lastSavedLabel;

    document.querySelector("label[for='note-text']").textContent = s.yourNote;
    document.getElementById("note-text").placeholder = s.startWriting;
    document.querySelector(".note-save").textContent = s.save;
    document.querySelector(".note-cancel").textContent = s.cancel;
    document.getElementById("add-btn-text").textContent = s.addNote;
    document.querySelector("#placeholder p").textContent = s.noNotes;
    document.getElementById("backButton").textContent = s.backButton;
  }

  loadNotes() {
    try {
      const notes = JSON.parse(localStorage.getItem("notes")) || [];
      return notes.map(Note.fromJSON);
    } catch {
      return [];
    }
  }

  setLastSaved(timeStr) {
    localStorage.setItem("lastSaved", timeStr);
    this.lastSavedEl.textContent = timeStr;
  }

  savePersistNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
    this.setLastSaved(new Date().toLocaleTimeString());
    this.changes = false;
  }

  onChange() {
    this.changes = true;
  }

  renderNotes() {
    if (!this.notes.length) {
      this.placeholder.style.display = "flex";
      this.notesList.innerHTML = "";
      return;
    }

    this.placeholder.style.display = "none";
    this.notesList.innerHTML = "";

    this.notes.forEach((note) => {
      const wrapper = document.createElement("div");
      wrapper.className = "mb-3";
      wrapper.dataset.id = note.id;

      wrapper.innerHTML = `
      <label class="form-label saved-at"></label>
      <textarea class="form-control note-editor" rows="3"></textarea>
      <div class="d-flex justify-content-end mt-2">
        <button class="btn btn-outline-danger btn-sm delete-note" title="Delete">Delete</button>
      </div>
    `;

      const label = wrapper.querySelector(".saved-at");
      const textarea = wrapper.querySelector(".note-editor");

      label.textContent = `${this.strings?.savedAt ?? "Saved at:"} ${
        note.time ?? "—"
      }`;
      textarea.value = note.text ?? "";

      textarea.addEventListener("input", () => {
        note.text = textarea.value;
        note.time = new Date().toLocaleTimeString();
        label.textContent = `${this.strings?.savedAt ?? "Saved at:"} ${
          note.time
        }`;
        this.debouncedPersist();
        this.changes = true;
      });

      this.notesList.appendChild(wrapper);
    });
  }

  openEditor(existing = null) {
    if (this.editorOpen) return;
    this.editorOpen = true;
    this.addBtn.disabled = true;

    const s = this.strings;
    const editorCard = document.createElement("div");
    editorCard.className = "card shadow-sm my-4";
    editorCard.innerHTML = `
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">${s.yourNote ?? "Your note"}</label>
          <textarea class="form-control note-editor" rows="4" placeholder="${
            s.startWriting ?? "Start writing..."
          }" required></textarea>
          <div class="invalid-feedback">${
            s.validationMessage ?? "Please write something before saving."
          }</div>
        </div>
        <div class="d-flex gap-2 justify-content-end">
          <button type="button" class="btn btn-outline-secondary btn-lg editor-cancel">${
            s.cancel ?? "Cancel"
          }</button>
          <button type="button" class="btn btn-success btn-lg editor-save">${
            s.save ?? "Save"
          }</button>
        </div>
      </div>
    `;

    const textarea = editorCard.querySelector(".note-editor");
    if (existing) textarea.value = existing.text;

    this.notesList.parentNode.insertBefore(editorCard, this.notesList);

    const cancelBtn = editorCard.querySelector(".editor-cancel");
    const saveBtn = editorCard.querySelector(".editor-save");

    cancelBtn.addEventListener("click", () => {
      editorCard.remove();
      this.editorOpen = false;
      this.addBtn.disabled = false;
    });

    textarea.addEventListener("input", () => {
      if (textarea.value.trim() !== "") textarea.classList.remove("is-invalid");
    });

    saveBtn.addEventListener("click", () => {
      const text = textarea.value.trim();
      if (!text) {
        textarea.classList.add("is-invalid");
        return;
      }

      if (existing) {
        existing.text = text;
        existing.time = new Date().toLocaleTimeString();
      } else {
        this.notes.push(new Note({ text }));
      }
      this.onChange();

      editorCard.remove();
      this.editorOpen = false;
      this.addBtn.disabled = false;

      this.renderNotes();
    });
  }

  handleListClick(e) {
    const block = e.target.closest("[data-id]");
    if (!block) return;

    console.log(block);

    const id = block.dataset.id;
    const idx = this.notes.findIndex((n) => n.id === +id);
    if (idx === -1) return;

    if (e.target.closest(".delete-note")) {
      this.notes.splice(idx, 1);
      this.renderNotes();
      this.savePersistNotes();
      return;
    }
  }

  handleStorageEvent(event) {
    if (event.key === "notes") {
      const newNotes = JSON.parse(event.newValue || "[]").map(Note.fromJSON);
      this.notes = newNotes;
      this.renderNotes();
    }
    if (event.key === "lastSaved") {
      this.lastSavedEl.textContent = event.newValue || "—";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const strings = window.MESSAGES || {}; 
  new NotesApp(strings);
});
